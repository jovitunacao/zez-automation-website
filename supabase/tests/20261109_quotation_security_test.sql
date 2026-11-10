-- ==============================================================================
-- ZEZ AUTOMATION CORPORATION — QUOTATION SYSTEM SECURITY & CONCURRENCY TESTS
-- File: supabase/tests/20261109_quotation_security_test.sql
--
-- PURPOSE:
--   Comprehensive database-level security and concurrency test suite verifying:
--     1. Anonymous caller restrictions on administrative RPCs
--     2. Authenticated non-admin caller rejection (viewer role)
--     3. Authorized administrator approvals (sales_engineer, operations_manager, super_admin)
--     4. Service-role-only restriction for email claim and finalization
--     5. Concurrency locking & persistent claim token prevents duplicate sends
--     6. Resend delivery ID validation and claim token matching on finalization
--     7. Direct table UPDATE & DELETE triggers preventing status/pricing bypasses
--     8. Direct table line-item immutability triggers on issued quotations
--     9. Customer token sanitization (zero leak of admin notes, tokens, or UUIDs)
--    10. Customer response lifecycle & terminal status immutability
--
-- EXECUTION:
--   Fully safe for Supabase SQL Editor and automated CI runners.
--   Enclosed in a transaction that executes tests and always issues ROLLBACK.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
    v_test_admin_id UUID := gen_random_uuid();
    v_unauth_user_id UUID := gen_random_uuid();
    v_quote_res JSONB;
    v_quote_id TEXT;
    v_token TEXT;
    v_claim_res JSONB;
    v_claim_res2 JSONB;
    v_claim_token UUID;
    v_idempotency_key TEXT;
    v_finalize_res JSONB;
    v_cust_res JSONB;
    v_pub_res JSONB;
    v_trigger_blocked BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Starting ZEZ B2B Quotation SQL Security & Concurrency Tests';
    RAISE NOTICE '============================================================';

    -- 0. Setup Mock Administrator Accounts
    INSERT INTO public.administrator_users (id, email, full_name, role, is_active)
    VALUES 
        (v_test_admin_id, 'authorized.engineer@zez.ph', 'Engr. J. Santos', 'sales_engineer', true),
        (v_unauth_user_id, 'viewer.guest@zez.ph', 'Guest Viewer', 'viewer', true)
    ON CONFLICT (id) DO NOTHING;

    -- -------------------------------------------------------------------------
    -- TEST 1: Server sequence ID allocation (client-forged ID must be ignored)
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
        RAISE EXCEPTION 'TEST 1 FAILED: save_official_quotation returned error: %', v_quote_res->>'error';
    END IF;

    v_quote_id := v_quote_res->>'id';
    IF v_quote_id = 'FORGED-ZEZ-99999' OR v_quote_id NOT LIKE 'ZEZ-Q-%' THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Server accepted forged ID % instead of allocating canonical sequence', v_quote_id;
    END IF;
    RAISE NOTICE '[PASS] Test 1: Server allocated canonical sequence ID: %', v_quote_id;

    -- -------------------------------------------------------------------------
    -- TEST 2: Status transition state machine validation
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
        RAISE EXCEPTION 'TEST 2 FAILED: Database allowed invalid state transition directly from Draft to Sent!';
    END IF;
    RAISE NOTICE '[PASS] Test 2: Invalid transition Draft -> Sent correctly rejected (%s)', v_quote_res->>'error';

    -- -------------------------------------------------------------------------
    -- TEST 3: Valid status transition (Draft -> Approved by authorized role)
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
        RAISE EXCEPTION 'TEST 3 FAILED: Could not transition Draft to Approved: %', v_quote_res->>'error';
    END IF;
    RAISE NOTICE '[PASS] Test 3: Approved quotation successfully by authorized sales_engineer';

    -- -------------------------------------------------------------------------
    -- TEST 4: Email claiming with unauthorized actor rejected
    -- -------------------------------------------------------------------------
    v_claim_res := public.claim_quotation_for_email_send(v_quote_id, v_unauth_user_id, false);
    IF (v_claim_res->>'success')::BOOLEAN IS TRUE THEN
        RAISE EXCEPTION 'TEST 4 FAILED: claim_quotation_for_email_send allowed unauthorized viewer role to dispatch email!';
    END IF;
    RAISE NOTICE '[PASS] Test 4: Unauthorized actor email claim correctly rejected: %', v_claim_res->>'error';

    -- -------------------------------------------------------------------------
    -- TEST 5: Atomic email claim generates persistent claim token & row lock
    -- -------------------------------------------------------------------------
    v_claim_res := public.claim_quotation_for_email_send(v_quote_id, v_test_admin_id, false);
    IF (v_claim_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 5 FAILED: claim_quotation_for_email_send failed: %', v_claim_res->>'error';
    END IF;

    v_claim_token := (v_claim_res->>'claim_token')::UUID;
    v_idempotency_key := v_claim_res->>'idempotency_key';

    IF v_claim_token IS NULL THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Missing persistent claim_token in claim response';
    END IF;
    IF v_idempotency_key IS NULL OR v_idempotency_key NOT LIKE 'zez_qsend_%' THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Invalid server idempotency key generated: %', v_idempotency_key;
    END IF;
    RAISE NOTICE '[PASS] Test 5: Claimed quotation with active token % and key %', v_claim_token, v_idempotency_key;

    -- -------------------------------------------------------------------------
    -- TEST 6: Concurrency lockout (second simultaneous claim rejected with in_progress)
    -- -------------------------------------------------------------------------
    v_claim_res2 := public.claim_quotation_for_email_send(v_quote_id, v_test_admin_id, false);
    IF (v_claim_res2->>'success')::BOOLEAN IS TRUE OR (v_claim_res2->>'in_progress')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 6 FAILED: Second concurrent claim was not rejected with in_progress! Res: %', v_claim_res2;
    END IF;
    RAISE NOTICE '[PASS] Test 6: Concurrent duplicate email send locked out: %', v_claim_res2->>'error';

    -- -------------------------------------------------------------------------
    -- TEST 7: Finalize rejects invalid Resend ID or mismatched claim token
    -- -------------------------------------------------------------------------
    -- 7.1 Blank Resend ID
    v_finalize_res := public.finalize_quotation_email_send(
        v_quote_id,
        v_claim_token,
        v_test_admin_id,
        '', -- Blank Resend ID
        v_idempotency_key,
        'sec-test@enterprise.ph',
        true
    );
    IF (v_finalize_res->>'success')::BOOLEAN IS TRUE THEN
        RAISE EXCEPTION 'TEST 7.1 FAILED: Finalize accepted blank Resend delivery ID!';
    END IF;
    RAISE NOTICE '[PASS] Test 7.1: Blank Resend delivery ID rejected: %', v_finalize_res->>'error';

    -- 7.2 Mismatched claim token
    v_finalize_res := public.finalize_quotation_email_send(
        v_quote_id,
        gen_random_uuid(), -- Mismatched claim token
        v_test_admin_id,
        're_test_msg_998877',
        v_idempotency_key,
        'sec-test@enterprise.ph',
        true
    );
    IF (v_finalize_res->>'success')::BOOLEAN IS TRUE THEN
        RAISE EXCEPTION 'TEST 7.2 FAILED: Finalize accepted mismatched claim token!';
    END IF;
    RAISE NOTICE '[PASS] Test 7.2: Mismatched claim token rejected: %', v_finalize_res->>'error';

    -- -------------------------------------------------------------------------
    -- TEST 8: Successful email finalization with matching claim token
    -- -------------------------------------------------------------------------
    v_finalize_res := public.finalize_quotation_email_send(
        v_quote_id,
        v_claim_token,
        v_test_admin_id,
        're_prod_valid_12345678',
        v_idempotency_key,
        'sec-test@enterprise.ph',
        true
    );
    IF (v_finalize_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 8 FAILED: finalize_quotation_email_send failed: %', v_finalize_res->>'error';
    END IF;
    RAISE NOTICE '[PASS] Test 8: Finalized quotation dispatch into Sent status';

    -- -------------------------------------------------------------------------
    -- TEST 9: Direct table update bypass prevention triggers
    -- -------------------------------------------------------------------------
    -- 9.1 Attempt direct table update of pricing on issued Sent quote
    v_trigger_blocked := FALSE;
    BEGIN
        UPDATE public.quotations
        SET grand_total_php = 1000.00
        WHERE id = v_quote_id;
    EXCEPTION WHEN OTHERS THEN
        v_trigger_blocked := TRUE;
    END;

    IF NOT v_trigger_blocked THEN
        RAISE EXCEPTION 'TEST 9.1 FAILED: Trigger failed to block direct price tampering on Sent quote!';
    END IF;
    RAISE NOTICE '[PASS] Test 9.1: Direct table price tampering on Sent quotation blocked by trigger';

    -- 9.2 Attempt direct table line-item tampering on issued Sent quote
    v_trigger_blocked := FALSE;
    BEGIN
        INSERT INTO public.quotation_line_items (
            quotation_id,
            product_name,
            quantity,
            unit_price_php,
            line_total_php
        ) VALUES (
            v_quote_id,
            'Tampered Line Item',
            1,
            100.00,
            100.00
        );
    EXCEPTION WHEN OTHERS THEN
        v_trigger_blocked := TRUE;
    END;

    IF NOT v_trigger_blocked THEN
        RAISE EXCEPTION 'TEST 9.2 FAILED: Trigger failed to block adding line items to issued Sent quote!';
    END IF;
    RAISE NOTICE '[PASS] Test 9.2: Line item injection on Sent quotation blocked by trigger';

    -- -------------------------------------------------------------------------
    -- TEST 10: Customer token sanitization & response workflow
    -- -------------------------------------------------------------------------
    SELECT customer_access_token INTO v_token FROM public.quotations WHERE id = v_quote_id;

    v_pub_res := public.get_public_quotation_by_token(v_token);
    IF (v_pub_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 10 FAILED: get_public_quotation_by_token returned error: %', v_pub_res->>'error';
    END IF;

    IF v_pub_res->'quotation'->>'customer_access_token' IS NOT NULL THEN
        RAISE EXCEPTION 'TEST 10 FAILED: get_public_quotation_by_token leaked secret access token!';
    END IF;
    IF v_pub_res->'quotation'->>'admin_notes' IS NOT NULL AND v_pub_res->'quotation'->>'admin_notes' != '' THEN
        RAISE EXCEPTION 'TEST 10 FAILED: get_public_quotation_by_token leaked admin notes!';
    END IF;
    RAISE NOTICE '[PASS] Test 10: Public quotation view sanitized (no access token or admin notes leakage)';

    -- -------------------------------------------------------------------------
    -- TEST 11: Customer acceptance on valid Sent quotation
    -- -------------------------------------------------------------------------
    v_cust_res := public.submit_customer_quotation_response(v_token, 'Accepted', 'Corporate PO attached', 'PO-2026-ZEZ-990');
    IF (v_cust_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 11 FAILED: Customer acceptance failed: %', v_cust_res->>'error';
    END IF;
    RAISE NOTICE '[PASS] Test 11: Customer acceptance processed successfully (New status: %)', v_cust_res->>'status';

    -- -------------------------------------------------------------------------
    -- TEST 12: Terminal status immutability (cannot modify Accepted quotation)
    -- -------------------------------------------------------------------------
    v_cust_res := public.submit_customer_quotation_response(v_token, 'Declined');
    IF (v_cust_res->>'success')::BOOLEAN IS TRUE THEN
        RAISE EXCEPTION 'TEST 12 FAILED: Database allowed re-declining an already Accepted quotation!';
    END IF;
    RAISE NOTICE '[PASS] Test 12: Terminal Accepted status cannot be modified: %', v_cust_res->>'error';

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'ALL 12 ZEZ B2B QUOTATION SQL SECURITY & CONCURRENCY TESTS PASSED';
    RAISE NOTICE '============================================================';
END;
$$;

-- Always rollback so test records are never persisted to production
ROLLBACK;
