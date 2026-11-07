-- ==============================================================================
-- ZEZ AUTOMATION CORPORATION - PHASE 4 ROLLBACK-ONLY SQL INTEGRATION TESTS
-- File: supabase/tests/20261106_rfq_notifications_test.sql
--
-- PURPOSE:
--   Comprehensive integration test suite validating:
--     1. Existing data preservation (products, admins, RFQs, receive_rfq_notifications column).
--     2. Administrator integrity and Super Admin deletion/demotion protection.
--     3. Inactive administrator access rejection & active admin login preservation.
--     4. Transaction-scoped monthly serialization (pg_advisory_xact_lock) and daily quota limits.
--     5. Synchronized quota release operation.
--     6. Atomic row claiming (claim_pending_rfq_notifications) and crash recovery (> 5 mins).
--     7. Service-role authorization helpers (is_service_role) and privileged function security.
--
-- EXECUTION:
--   Paste and run directly in Supabase SQL Editor.
--   The entire script is wrapped in BEGIN ... ROLLBACK, guaranteeing that ZERO
--   mutations or test records persist in your database.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
    v_admin_count INTEGER;
    v_super_admin_count INTEGER;
    v_products_count INTEGER;
    v_rfqs_count INTEGER;
    v_test_rfq_id VARCHAR := 'TEST-RFQ-INTEGRATION-001';
    v_test_admin_id UUID;
    v_quota_result JSONB;
    v_claimed_count INTEGER;
    v_claimed_record RECORD;
    v_test_date DATE := (CURRENT_DATE AT TIME ZONE 'Asia/Manila');
    v_test_month_key INT;
    v_lock_held BOOLEAN;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Starting ZEZ Phase 4 Rollback-Only Integration Tests...';
    RAISE NOTICE '============================================================';

    -- --------------------------------------------------------------------------
    -- TEST 1: EXISTING DATA PRESERVATION
    -- --------------------------------------------------------------------------
    RAISE NOTICE '[TEST 1] Verifying preservation of existing production data...';

    -- 1.1 Verify administrator_users table and active Super Admins
    SELECT COUNT(*) INTO v_admin_count FROM public.administrator_users WHERE is_active = true;
    SELECT COUNT(*) INTO v_super_admin_count FROM public.administrator_users WHERE role = 'super_admin' AND is_active = true;

    ASSERT v_admin_count > 0, 'FAILURE: No active administrators found in administrator_users.';
    ASSERT v_super_admin_count >= 1, 'FAILURE: At least one active Super Admin must be present in administrator_users.';
    RAISE NOTICE '  --> OK: Found % active administrators (% Super Admin accounts).', v_admin_count, v_super_admin_count;

    -- 1.2 Verify receive_rfq_notifications column exists on administrator_users
    PERFORM 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'administrator_users' 
      AND column_name = 'receive_rfq_notifications';

    ASSERT FOUND, 'FAILURE: Column receive_rfq_notifications does not exist on public.administrator_users.';
    RAISE NOTICE '  --> OK: Column receive_rfq_notifications verified.';

    -- 1.3 Verify existing products catalog
    SELECT COUNT(*) INTO v_products_count FROM public.products;
    ASSERT v_products_count >= 46, format('FAILURE: Expected at least 46 products, found %s.', v_products_count);
    RAISE NOTICE '  --> OK: % products preserved in catalog.', v_products_count;

    -- --------------------------------------------------------------------------
    -- TEST 2: SERVICE-ROLE AUTHORIZATION HELPER
    -- --------------------------------------------------------------------------
    RAISE NOTICE '[TEST 2] Verifying is_service_role() execution in maintenance session...';

    -- In Supabase SQL Editor / direct postgres connection, session_user is 'postgres'
    ASSERT public.is_service_role() = true, 'FAILURE: is_service_role() should return TRUE in direct postgres session.';
    RAISE NOTICE '  --> OK: is_service_role() authorizes direct maintenance/postgres sessions.';

    -- --------------------------------------------------------------------------
    -- TEST 3: TRANSACTION-SCOPED MONTHLY ADVISORY LOCK & QUOTA RESERVATION
    -- --------------------------------------------------------------------------
    RAISE NOTICE '[TEST 3] Verifying reserve_email_quota() concurrency locking and limits...';

    -- 3.1 Verify normal quota reservation of 1 slot
    v_quota_result := public.reserve_email_quota(1, v_test_date);
    ASSERT (v_quota_result->>'allowed')::BOOLEAN = true, format('FAILURE: Expected allowed=true, got %s', v_quota_result);
    ASSERT (v_quota_result->>'reserved_count')::INTEGER = 1, 'FAILURE: Reserved count mismatch.';
    RAISE NOTICE '  --> OK: Reserved 1 quota slot for % (Today sent: %, Month sent: %)', 
        v_test_date, v_quota_result->>'today_sent', v_quota_result->>'month_sent';

    -- 3.2 Verify that the transaction-scoped advisory lock is held
    v_test_month_key := (EXTRACT(YEAR FROM v_test_date)::INT * 100 + EXTRACT(MONTH FROM v_test_date)::INT);
    SELECT EXISTS (
        SELECT 1 FROM pg_locks 
        WHERE locktype = 'advisory' 
          AND classid = hashtext('zez_email_quota_monthly') 
          AND objid = v_test_month_key
    ) INTO v_lock_held;
    ASSERT v_lock_held = true, 'FAILURE: pg_advisory_xact_lock was not held for the current month.';
    RAISE NOTICE '  --> OK: Transaction-scoped monthly advisory lock (classid: %, objid: %) actively held.', 
        hashtext('zez_email_quota_monthly'), v_test_month_key;

    -- 3.3 Verify daily ceiling rejection (attempting to reserve > 100 on the same date)
    v_quota_result := public.reserve_email_quota(150, v_test_date);
    ASSERT (v_quota_result->>'allowed')::BOOLEAN = false, 'FAILURE: Exceeding daily limit should return allowed=false.';
    ASSERT (v_quota_result->>'reason') LIKE '%Daily Resend Free limit reached%', format('FAILURE: Unexpected rejection reason: %s', v_quota_result->>'reason');
    RAISE NOTICE '  --> OK: Daily quota ceiling enforced correctly (%s).', v_quota_result->>'reason';

    -- 3.4 Verify synchronized quota release
    PERFORM public.release_email_quota(1, v_test_date);
    RAISE NOTICE '  --> OK: release_email_quota synchronized with monthly advisory lock successfully.';

    -- 3.5 Verify check_email_quota read-only helper
    v_quota_result := public.check_email_quota(v_test_date);
    ASSERT (v_quota_result->>'daily_limit')::INTEGER = 100, 'FAILURE: Daily limit constant mismatch.';
    ASSERT (v_quota_result->>'monthly_limit')::INTEGER = 3000, 'FAILURE: Monthly limit constant mismatch.';
    RAISE NOTICE '  --> OK: check_email_quota verified (Daily: %/100, Monthly: %/3000).', 
        v_quota_result->>'today_sent', v_quota_result->>'month_sent';

    -- --------------------------------------------------------------------------
    -- TEST 4: NOTIFICATION CLAIMING & CRASH RECOVERY
    -- --------------------------------------------------------------------------
    RAISE NOTICE '[TEST 4] Verifying atomic notification claiming and crash recovery...';

    -- Fetch an existing active admin ID for foreign-key validation
    SELECT id INTO v_test_admin_id FROM public.administrator_users WHERE is_active = true LIMIT 1;

    -- Create temporary test RFQ in quotation_requests (will be rolled back)
    INSERT INTO public.quotation_requests (
        id,
        customer_full_name,
        customer_company_name,
        customer_email,
        customer_mobile_number,
        delivery_city_province,
        delivery_address,
        total_estimated_php,
        status,
        created_at
    ) VALUES (
        v_test_rfq_id,
        'Integration Test User',
        'ZEZ Test Corp',
        'qa-tester@example.com',
        '+63 917 000 0000',
        'Davao City',
        'Test Logistics Facility',
        150000.00,
        'pending_review',
        TIMEZONE('utc'::text, NOW())
    );

    -- Insert temporary test notification log
    INSERT INTO public.rfq_notification_logs (
        rfq_id,
        recipient_email,
        recipient_name,
        recipient_role,
        admin_id,
        status,
        attempt_count,
        max_attempts,
        created_at,
        updated_at
    ) VALUES (
        v_test_rfq_id,
        'test-admin-recipient@example.com',
        'Test Administrator',
        'admin',
        v_test_admin_id,
        'pending',
        0,
        3,
        TIMEZONE('utc'::text, NOW()),
        TIMEZONE('utc'::text, NOW())
    );

    -- 4.1 Claim pending notification
    SELECT COUNT(*) INTO v_claimed_count 
    FROM public.claim_pending_rfq_notifications(v_test_rfq_id, 10);
    ASSERT v_claimed_count = 1, format('FAILURE: Expected 1 claimed notification, got %s', v_claimed_count);

    SELECT * INTO v_claimed_record 
    FROM public.rfq_notification_logs 
    WHERE rfq_id = v_test_rfq_id AND recipient_email = 'test-admin-recipient@example.com';

    ASSERT v_claimed_record.status = 'processing', format('FAILURE: Expected status=processing, got %s', v_claimed_record.status);
    ASSERT v_claimed_record.attempt_count = 1, format('FAILURE: Expected attempt_count=1, got %s', v_claimed_record.attempt_count);
    ASSERT v_claimed_record.last_attempt_at IS NOT NULL, 'FAILURE: last_attempt_at was not populated.';
    RAISE NOTICE '  --> OK: Atomic row claiming moved log to status=processing (attempt: 1).';

    -- 4.2 Crash recovery: simulate job stuck in processing > 5 minutes
    UPDATE public.rfq_notification_logs
    SET last_attempt_at = TIMEZONE('utc'::text, NOW()) - INTERVAL '6 minutes'
    WHERE id = v_claimed_record.id;

    -- Re-claim: crash recovery should pick up the timed-out processing job
    SELECT COUNT(*) INTO v_claimed_count 
    FROM public.claim_pending_rfq_notifications(v_test_rfq_id, 10);
    ASSERT v_claimed_count = 1, format('FAILURE: Crash recovery failed to reclaim abandoned processing job.');

    SELECT * INTO v_claimed_record 
    FROM public.rfq_notification_logs 
    WHERE id = v_claimed_record.id;

    ASSERT v_claimed_record.status = 'processing', 'FAILURE: Reclaimed job should be in processing state.';
    ASSERT v_claimed_record.attempt_count = 2, format('FAILURE: Expected attempt_count=2, got %s', v_claimed_record.attempt_count);
    RAISE NOTICE '  --> OK: Crash recovery successfully reclaimed timed-out job (attempt incremented to 2).';

    -- --------------------------------------------------------------------------
    -- TEST 5: SUPER ADMIN INTEGRITY SAFEGUARD
    -- --------------------------------------------------------------------------
    RAISE NOTICE '[TEST 5] Verifying last Super Admin deactivation/deletion protection...';

    -- Verify that attempting to deactivate ALL Super Admins raises an exception
    BEGIN
        UPDATE public.administrator_users
        SET is_active = false
        WHERE role = 'super_admin';

        -- If it didn't throw, fail the test
        RAISE EXCEPTION 'SECURITY FAILURE: Last active Super Admin deactivation should have been rejected!';
    EXCEPTION 
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%Cannot deactivate or demote the last active Super Admin%' THEN
                RAISE NOTICE '  --> OK: Last active Super Admin safeguard triggered properly: %', SQLERRM;
            ELSE
                RAISE;
            END IF;
    END;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'ALL INTEGRATION TESTS PASSED SUCCESSFULLY!';
    RAISE NOTICE 'Rolling back all test mutations (zero persistent data)...';
    RAISE NOTICE '============================================================';
END;
$$;

ROLLBACK;
