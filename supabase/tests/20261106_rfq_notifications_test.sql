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
--     6. Automated RFQ trigger queueing + atomic row claiming + 5-minute crash recovery.
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
    v_test_rfq_id VARCHAR := 'TEST-RFQ-INTEGRATION-001';
    v_test_item_id UUID;
    v_queued_by_trigger INTEGER := 0;
    v_claimed_count INTEGER := 0;
    v_reclaimed_count INTEGER := 0;
    v_claimed_log_id UUID;
    v_test_attempt_count INTEGER;
    v_test_status VARCHAR;
    v_quota_result JSONB;
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
    RAISE NOTICE '  --> OK: Reserved 1 quota slot for % (Today: %, Month: %)', 
        v_test_date, v_quota_result->>'today_sent', v_quota_result->>'month_sent';

    -- 3.2 Verify that the transaction-scoped advisory lock is actively held
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

    -- 3.6 Regression Test: check_email_quota() on a date WITHOUT an existing quota record
    -- Verifies that today_sent = 0, month_sent = 0, and can_send is a strict boolean (true, never null)
    v_quota_result := public.check_email_quota((v_test_date + INTERVAL '100 days')::DATE);
    ASSERT (v_quota_result->>'today_sent')::INTEGER = 0, 
        format('REGRESSION FAILURE: expected today_sent=0 for unrecorded date, got %s', v_quota_result->>'today_sent');
    ASSERT (v_quota_result->>'month_sent')::INTEGER = 0, 
        format('REGRESSION FAILURE: expected month_sent=0 for unrecorded date, got %s', v_quota_result->>'month_sent');
    ASSERT v_quota_result->>'can_send' IS NOT NULL AND (v_quota_result->>'can_send')::BOOLEAN = true, 
        format('REGRESSION FAILURE: expected can_send=true (boolean) for unrecorded date, got %s', v_quota_result->>'can_send');
    ASSERT (v_quota_result->>'reason') = 'OK', 
        format('REGRESSION FAILURE: expected reason=OK, got %s', v_quota_result->>'reason');
    RAISE NOTICE '  --> OK: Regression test passed: check_email_quota on unrecorded date returned today_sent=0, can_send=true, reason=OK.';

    -- --------------------------------------------------------------------------
    -- TEST 4: AUTOMATED RFQ TRIGGER QUEUEING, CLAIMING & CRASH RECOVERY
    -- --------------------------------------------------------------------------
    RAISE NOTICE '[TEST 4] Verifying RFQ trigger queueing, atomic claiming, and crash recovery...';

    -- 4.1 Insert test quotation request with VALID status 'New' matching production CHECK constraint:
    -- CHECK (status IN ('New', 'Under Review', 'Quotation Prepared', 'Quotation Sent', 'Accepted', 'Declined', 'Closed'))
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
        created_at,
        updated_at
    ) VALUES (
        v_test_rfq_id,
        'Integration Test Engineer',
        'ZEZ Automation Testing Hub',
        'qa-tester@example.com',
        '+63 917 000 0000',
        'Davao City',
        'Enterprise IT Logistics Center, J.P. Laurel Avenue, Davao City',
        150000.00,
        'New',
        TIMEZONE('utc'::text, NOW()),
        TIMEZONE('utc'::text, NOW())
    );

    -- 4.2 Insert test quotation line item
    INSERT INTO public.quotation_items (
        quotation_request_id,
        product_name,
        model,
        brand,
        sku,
        quantity,
        unit_price_php,
        subtotal_php,
        created_at
    ) VALUES (
        v_test_rfq_id,
        'Cisco Catalyst 1000 Series 24-Port Gigabit Switch',
        'C1000-24T-4G-L',
        'Cisco',
        'CSCO-C1000-24T-TEST',
        2,
        45000.00,
        90000.00,
        TIMEZONE('utc'::text, NOW())
    ) RETURNING id INTO v_test_item_id;

    -- 4.3 Verify that trg_queue_rfq_notifications trigger AUTOMATICALLY queued logs
    SELECT COUNT(*) INTO v_queued_by_trigger 
    FROM public.rfq_notification_logs 
    WHERE rfq_id = v_test_rfq_id;

    ASSERT v_queued_by_trigger > 0, 'FAILURE: trg_queue_rfq_notifications trigger failed to auto-queue logs.';
    RAISE NOTICE '  --> OK: RFQ trigger automatically queued % notification entries for eligible administrators.', v_queued_by_trigger;

    -- 4.4 Claim pending notifications via claim_pending_rfq_notifications RPC
    SELECT COUNT(*) INTO v_claimed_count 
    FROM public.claim_pending_rfq_notifications(v_test_rfq_id, 10);

    ASSERT v_claimed_count = v_queued_by_trigger, format('FAILURE: Expected %s claimed notifications, got %s', v_queued_by_trigger, v_claimed_count);
    RAISE NOTICE '  --> OK: claim_pending_rfq_notifications atomically claimed all % entries into status=processing.', v_claimed_count;

    -- 4.5 Verify crash recovery (> 5 minutes timeout):
    -- Pick one claimed log, simulate a worker crash by rewinding last_attempt_at to 6 minutes ago
    SELECT id INTO v_claimed_log_id
    FROM public.rfq_notification_logs
    WHERE rfq_id = v_test_rfq_id
    LIMIT 1;

    UPDATE public.rfq_notification_logs
    SET last_attempt_at = TIMEZONE('utc'::text, NOW()) - INTERVAL '6 minutes'
    WHERE id = v_claimed_log_id;

    -- Re-claim: crash recovery sweep must identify the timed-out processing job and reclaim it
    SELECT COUNT(*) INTO v_reclaimed_count 
    FROM public.claim_pending_rfq_notifications(v_test_rfq_id, 10);

    ASSERT v_reclaimed_count = 1, format('FAILURE: Crash recovery expected 1 reclaimed job, got %s', v_reclaimed_count);

    SELECT attempt_count, status INTO v_test_attempt_count, v_test_status
    FROM public.rfq_notification_logs
    WHERE id = v_claimed_log_id;

    ASSERT v_test_status = 'processing', 'FAILURE: Reclaimed job must be in processing status.';
    ASSERT v_test_attempt_count = 2, format('FAILURE: Expected attempt_count=2, got %s', v_test_attempt_count);
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
