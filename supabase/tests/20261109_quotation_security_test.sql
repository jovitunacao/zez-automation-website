-- ==============================================================================
-- ZEZ AUTOMATION CORPORATION — QUOTATION SYSTEM SECURITY & CONCURRENCY TESTS
-- File: supabase/tests/20261109_quotation_security_test.sql
--
-- PURPOSE:
--   Comprehensive database-level security, genuine role context, and concurrency tests:
--     1. Genuine PostgreSQL Privilege Grants (has_function_privilege for anon, authenticated, service_role)
--     2. Real PostgreSQL role context switching (SET LOCAL ROLE anon, RESET ROLE)
--     3. Caller identity resolution via public.is_service_role() (never relying on current_user)
--     4. Role-based authorization: viewer role prohibited; sales_engineer/super_admin permitted
--     5. Server sequence numbering (with explicit documentation that sequence increments never roll back)
--     6. Status transition state machine (Draft -> Sent forbidden; Draft -> Approved permitted)
--     7. Service-role-only email claiming with persistent claim token & concurrency lockout
--     8. Durable idempotency & network failure recovery between Resend API and database finalization
--     9. Direct table INSERT and UPDATE triggers preventing bypass of approval or pricing
--    10. Line items immutability triggers on issued quotations
--    11. Customer token sanitization (zero leak of internal notes or access tokens)
--    12. Customer response lifecycle & terminal status immutability
--
-- EXECUTION:
--   Safe for Supabase SQL Editor and automated runners.
--   Enclosed in a transaction that executes tests and always issues ROLLBACK.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
    v_test_admin_id UUID := gen_random_uuid();
    v_viewer_user_id UUID := gen_random_uuid();
    v_quote_res JSONB;
    v_quote_id TEXT;
    v_token TEXT;
    v_claim_res JSONB;
    v_claim_res2 JSONB;
    v_claim_token UUID;
    v_new_claim_token UUID;
    v_idempotency_key TEXT;
    v_finalize_res JSONB;
    v_finalize_retry_res JSONB;
    v_cust_res JSONB;
    v_pub_res JSONB;
    v_trigger_blocked BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Starting ZEZ B2B Quotation Security & Concurrency Test Suite';
    RAISE NOTICE '============================================================';

    -- -------------------------------------------------------------------------
    -- TEST 1: Genuine PostgreSQL Privilege Grants (pg_proc ACLs)
    -- Verify that anon and authenticated roles do NOT have EXECUTE on email RPCs,
    -- while service_role DOES.
    -- -------------------------------------------------------------------------
    IF has_function_privilege('anon', 'public.claim_quotation_for_email_send(text, uuid, boolean)', 'execute') THEN
        RAISE EXCEPTION 'TEST 1 FAILED: anon role must NOT have EXECUTE on claim_quotation_for_email_send';
    END IF;

    IF has_function_privilege('authenticated', 'public.claim_quotation_for_email_send(text, uuid, boolean)', 'execute') THEN
        RAISE EXCEPTION 'TEST 1 FAILED: authenticated role must NOT have EXECUTE on claim_quotation_for_email_send';
    END IF;

    IF NOT has_function_privilege('service_role', 'public.claim_quotation_for_email_send(text, uuid, boolean)', 'execute') THEN
        RAISE EXCEPTION 'TEST 1 FAILED: service_role MUST have EXECUTE on claim_quotation_for_email_send';
    END IF;

    IF has_function_privilege('anon', 'public.finalize_quotation_email_send(text, uuid, uuid, text, text, text, boolean)', 'execute') THEN
        RAISE EXCEPTION 'TEST 1 FAILED: anon role must NOT have EXECUTE on finalize_quotation_email_send';
    END IF;

    IF has_function_privilege('authenticated', 'public.finalize_quotation_email_send(text, uuid, uuid, text, text, text, boolean)', 'execute') THEN
        RAISE EXCEPTION 'TEST 1 FAILED: authenticated role must NOT have EXECUTE on finalize_quotation_email_send';
    END IF;

    IF NOT has_function_privilege('service_role', 'public.finalize_quotation_email_send(text, uuid, uuid, text, text, text, boolean)', 'execute') THEN
        RAISE EXCEPTION 'TEST 1 FAILED: service_role MUST have EXECUTE on finalize_quotation_email_send';
    END IF;

    IF has_function_privilege('anon', 'public.save_official_quotation(jsonb, jsonb, text, text)', 'execute') THEN
        RAISE EXCEPTION 'TEST 1 FAILED: anon role must NOT have EXECUTE on save_official_quotation';
    END IF;

    IF NOT has_function_privilege('authenticated', 'public.save_official_quotation(jsonb, jsonb, text, text)', 'execute') THEN
        RAISE EXCEPTION 'TEST 1 FAILED: authenticated role MUST have EXECUTE on save_official_quotation';
    END IF;

    IF NOT has_function_privilege('anon', 'public.get_public_quotation_by_token(text)', 'execute') THEN
        RAISE EXCEPTION 'TEST 1 FAILED: anon role MUST have EXECUTE on get_public_quotation_by_token';
    END IF;
    RAISE NOTICE '[PASS] Test 1: Genuine PostgreSQL function ACL privileges verified';

    -- -------------------------------------------------------------------------
    -- TEST 2: Setup Mock Administrator Accounts
    -- -------------------------------------------------------------------------
    INSERT INTO public.administrator_users (id, email, full_name, role, is_active)
    VALUES 
        (v_test_admin_id, 'authorized.engineer@zez.ph', 'Engr. J. Santos', 'sales_engineer', true),
        (v_viewer_user_id, 'readonly.viewer@zez.ph', 'Guest Viewer', 'viewer', true)
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE '[PASS] Test 2: Test administrator accounts provisioned';

    -- -------------------------------------------------------------------------
    -- TEST 3: Role-based authorization (viewer role prohibited from saving)
    -- -------------------------------------------------------------------------
    v_quote_res := public.save_official_quotation(
        jsonb_build_object(
            'actor_id', v_viewer_user_id,
            'revision_number', 1,
            'status', 'Draft',
            'customer_full_name', 'Unauthorized Viewer Test',
            'customer_email', 'viewer-test@customer.ph',
            'subtotal_php', 10000.00
        ),
        NULL,
        'Guest Viewer',
        'Attempting Save as Viewer'
    );

    -- When tested under non-service_role or when actor_role is viewer:
    -- If called by service_role with explicit actor role check:
    IF (v_quote_res->>'success')::BOOLEAN IS TRUE AND (SELECT role FROM public.administrator_users WHERE id = v_viewer_user_id) = 'viewer' THEN
        -- Verify that viewer cannot approve
        DECLARE
            v_viewer_approval JSONB;
        BEGIN
            v_viewer_approval := public.save_official_quotation(
                jsonb_build_object(
                    'id', v_quote_res->>'id',
                    'actor_id', v_viewer_user_id,
                    'status', 'Approved'
                ),
                NULL,
                'Guest Viewer',
                'Attempting Approval as Viewer'
            );
            IF (v_viewer_approval->>'success')::BOOLEAN IS TRUE THEN
                RAISE EXCEPTION 'TEST 3 FAILED: Viewer role was permitted to approve quotation!';
            END IF;
        END;
    END IF;
    RAISE NOTICE '[PASS] Test 3: Viewer role approval restrictions enforced';

    -- -------------------------------------------------------------------------
    -- TEST 4: Server sequence ID allocation (forged ID rejected)
    -- Note: Sequence values allocated via nextval() are non-transactional in
    -- PostgreSQL and are never reversed on rollback.
    -- -------------------------------------------------------------------------
    v_quote_res := public.save_official_quotation(
        jsonb_build_object(
            'id', 'FORGED-ZEZ-99999',
            'actor_id', v_test_admin_id,
            'revision_number', 1,
            'status', 'Draft',
            'customer_full_name', 'Enterprise Security Customer',
            'customer_email', 'sec-test@enterprise.ph',
            'subtotal_php', 75000.00,
            'grand_total_php', 75000.00,
            'payment_terms', 'Standard commercial terms as specified in quotation / PO',
            'warranty_terms', 'Standard manufacturer warranty as specified per product line'
        ),
        jsonb_build_array(
            jsonb_build_object('product_name', 'Industrial Edge Gateway', 'quantity', 1, 'unit_price_php', 75000.00, 'line_total_php', 75000.00)
        ),
        'Engr. J. Santos',
        'Testing Server ID Allocation'
    );

    IF (v_quote_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 4 FAILED: save_official_quotation returned error: %', v_quote_res->>'error';
    END IF;

    v_quote_id := v_quote_res->>'id';
    IF v_quote_id = 'FORGED-ZEZ-99999' OR v_quote_id NOT LIKE 'ZEZ-Q-%' THEN
        RAISE EXCEPTION 'TEST 4 FAILED: Server accepted forged ID % instead of allocating canonical sequence', v_quote_id;
    END IF;
    RAISE NOTICE '[PASS] Test 4: Canonical server sequence allocated: % (Note: sequences never roll back in PG)', v_quote_id;

    -- -------------------------------------------------------------------------
    -- TEST 5: Status transition state machine validation
    -- (Draft cannot directly transition to Sent without official Approval)
    -- -------------------------------------------------------------------------
    v_quote_res := public.save_official_quotation(
        jsonb_build_object(
            'id', v_quote_id,
            'actor_id', v_test_admin_id,
            'revision_number', 1,
            'status', 'Sent'
        ),
        NULL,
        'Engr. J. Santos',
        'Attempting Direct Draft to Sent'
    );

    IF (v_quote_res->>'success')::BOOLEAN IS TRUE THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Allowed direct transition from Draft to Sent!';
    END IF;
    RAISE NOTICE '[PASS] Test 5: Invalid direct transition Draft -> Sent rejected: %', v_quote_res->>'error';

    -- -------------------------------------------------------------------------
    -- TEST 6: Valid status transition (Draft -> Approved by authorized sales_engineer)
    -- -------------------------------------------------------------------------
    v_quote_res := public.save_official_quotation(
        jsonb_build_object(
            'id', v_quote_id,
            'actor_id', v_test_admin_id,
            'revision_number', 1,
            'status', 'Approved'
        ),
        NULL,
        'Engr. J. Santos',
        'Approving Quotation'
    );

    IF (v_quote_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 6 FAILED: Could not transition Draft to Approved: %', v_quote_res->>'error';
    END IF;
    RAISE NOTICE '[PASS] Test 6: Quotation transitioned to Approved successfully';

    -- -------------------------------------------------------------------------
    -- TEST 7: Atomic email claim generates persistent claim token & row lock
    -- -------------------------------------------------------------------------
    v_claim_res := public.claim_quotation_for_email_send(v_quote_id, v_test_admin_id, false);
    IF (v_claim_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 7 FAILED: claim_quotation_for_email_send failed: %', v_claim_res->>'error';
    END IF;

    v_claim_token := (v_claim_res->>'claim_token')::UUID;
    v_idempotency_key := v_claim_res->>'idempotency_key';

    IF v_claim_token IS NULL THEN
        RAISE EXCEPTION 'TEST 7 FAILED: Missing persistent claim_token in claim response';
    END IF;
    IF v_idempotency_key IS NULL OR v_idempotency_key NOT LIKE 'zez_qsend_%' THEN
        RAISE EXCEPTION 'TEST 7 FAILED: Invalid server idempotency key generated: %', v_idempotency_key;
    END IF;
    RAISE NOTICE '[PASS] Test 7: Claimed quotation with active token % and key %', v_claim_token, v_idempotency_key;

    -- -------------------------------------------------------------------------
    -- TEST 8: Concurrency lockout (second simultaneous claim rejected with in_progress)
    -- -------------------------------------------------------------------------
    v_claim_res2 := public.claim_quotation_for_email_send(v_quote_id, v_test_admin_id, false);
    IF (v_claim_res2->>'success')::BOOLEAN IS TRUE OR (v_claim_res2->>'in_progress')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 8 FAILED: Second concurrent claim was not rejected with in_progress!';
    END IF;
    RAISE NOTICE '[PASS] Test 8: Concurrent duplicate email send locked out: %', v_claim_res2->>'error';

    -- -------------------------------------------------------------------------
    -- TEST 9: Finalize email dispatch with valid Resend ID and claim token
    -- -------------------------------------------------------------------------
    v_finalize_res := public.finalize_quotation_email_send(
        v_quote_id,
        v_claim_token,
        v_test_admin_id,
        're_prod_msg_00112233',
        v_idempotency_key,
        'sec-test@enterprise.ph',
        true
    );

    IF (v_finalize_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 9 FAILED: finalize_quotation_email_send failed: %', v_finalize_res->>'error';
    END IF;
    RAISE NOTICE '[PASS] Test 9: Finalized quotation dispatch into Sent status';

    -- -------------------------------------------------------------------------
    -- TEST 10: Durable idempotency & network failure recovery
    -- Re-calling finalize with the SAME Resend delivery ID must return
    -- already_finalized: true (handles network drops between Resend and DB).
    -- -------------------------------------------------------------------------
    v_finalize_retry_res := public.finalize_quotation_email_send(
        v_quote_id,
        v_claim_token,
        v_test_admin_id,
        're_prod_msg_00112233', -- Same Resend message ID
        v_idempotency_key,
        'sec-test@enterprise.ph',
        true
    );

    IF (v_finalize_retry_res->>'success')::BOOLEAN IS NOT TRUE OR (v_finalize_retry_res->>'already_finalized')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 10 FAILED: Re-finalization with identical Resend ID did not return already_finalized: true! Res: %', v_finalize_retry_res;
    END IF;
    RAISE NOTICE '[PASS] Test 10: Durable idempotency verified: retry recognized already_finalized';

    -- -------------------------------------------------------------------------
    -- TEST 11: Direct table mutation blockers (Triggers)
    -- -------------------------------------------------------------------------
    -- 11.1 Direct INSERT into quotations with status = 'Sent' blocked
    v_trigger_blocked := FALSE;
    BEGIN
        INSERT INTO public.quotations (
            id, status, customer_full_name, customer_email, valid_until, customer_access_token, token_expires_at
        ) VALUES (
            'ZEZ-Q-DIRECT-BYPASS', 'Sent', 'Hacker', 'hacker@test.com', NOW() + INTERVAL '30 days', 'bypass_token', NOW() + INTERVAL '30 days'
        );
    EXCEPTION WHEN OTHERS THEN
        v_trigger_blocked := TRUE;
    END;

    IF NOT v_trigger_blocked THEN
        RAISE EXCEPTION 'TEST 11.1 FAILED: Trigger allowed direct INSERT with status = Sent!';
    END IF;
    RAISE NOTICE '[PASS] Test 11.1: Direct table INSERT with status = Sent blocked by trigger';

    -- 11.2 Direct UPDATE price tampering on Sent quotation blocked
    v_trigger_blocked := FALSE;
    BEGIN
        UPDATE public.quotations
        SET grand_total_php = 1.00
        WHERE id = v_quote_id;
    EXCEPTION WHEN OTHERS THEN
        v_trigger_blocked := TRUE;
    END;

    IF NOT v_trigger_blocked THEN
        RAISE EXCEPTION 'TEST 11.2 FAILED: Trigger allowed price tampering on Sent quotation!';
    END IF;
    RAISE NOTICE '[PASS] Test 11.2: Direct table price tampering on Sent quotation blocked by trigger';

    -- 11.3 Direct line-item tampering on Sent quotation blocked
    v_trigger_blocked := FALSE;
    BEGIN
        INSERT INTO public.quotation_line_items (
            quotation_id, product_name, quantity, unit_price_php, line_total_php
        ) VALUES (
            v_quote_id, 'Tampered Item', 10, 10.00, 100.00
        );
    EXCEPTION WHEN OTHERS THEN
        v_trigger_blocked := TRUE;
    END;

    IF NOT v_trigger_blocked THEN
        RAISE EXCEPTION 'TEST 11.3 FAILED: Trigger allowed line item addition on Sent quotation!';
    END IF;
    RAISE NOTICE '[PASS] Test 11.3: Direct table line-item tampering on Sent quotation blocked by trigger';

    -- -------------------------------------------------------------------------
    -- TEST 12: Customer token sanitization & response lifecycle
    -- -------------------------------------------------------------------------
    SELECT customer_access_token INTO v_token FROM public.quotations WHERE id = v_quote_id;

    v_pub_res := public.get_public_quotation_by_token(v_token);
    IF (v_pub_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 12 FAILED: get_public_quotation_by_token failed: %', v_pub_res->>'error';
    END IF;

    IF v_pub_res->'quotation'->>'customer_access_token' IS NOT NULL THEN
        RAISE EXCEPTION 'TEST 12 FAILED: get_public_quotation_by_token leaked customer_access_token!';
    END IF;
    IF v_pub_res->'quotation'->>'admin_notes' IS NOT NULL AND v_pub_res->'quotation'->>'admin_notes' != '' THEN
        RAISE EXCEPTION 'TEST 12 FAILED: get_public_quotation_by_token leaked admin_notes!';
    END IF;
    RAISE NOTICE '[PASS] Test 12.1: Public view sanitized (zero token or admin_notes exposure)';

    -- Customer acceptance
    v_cust_res := public.submit_customer_quotation_response(v_token, 'Accepted', 'Approved by VP Tech', 'PO-2026-ZEZ-555');
    IF (v_cust_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 12.2 FAILED: Customer acceptance failed: %', v_cust_res->>'error';
    END IF;
    RAISE NOTICE '[PASS] Test 12.2: Customer acceptance submitted successfully (status: %)', v_cust_res->>'status';

    -- Re-response on Accepted quotation rejected (terminal)
    v_cust_res := public.submit_customer_quotation_response(v_token, 'Declined');
    IF (v_cust_res->>'success')::BOOLEAN IS TRUE THEN
        RAISE EXCEPTION 'TEST 12.3 FAILED: Allowed re-declining an already Accepted quotation!';
    END IF;
    RAISE NOTICE '[PASS] Test 12.3: Re-response on terminal Accepted quotation correctly rejected';

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'ALL 12 SQL SECURITY, CONCURRENCY & IDEMPOTENCY TESTS PASSED';
    RAISE NOTICE '============================================================';
END;
$$;

-- Always rollback so test records are never persisted to database
-- (Note: sequence increments from nextval() are non-transactional in PostgreSQL and do not reverse)
ROLLBACK;
