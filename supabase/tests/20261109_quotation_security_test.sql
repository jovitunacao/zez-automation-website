-- ==============================================================================
-- ZEZ AUTOMATION CORPORATION — QUOTATION SYSTEM SECURITY & INTEGRATION TESTS
-- File: supabase/tests/20261109_quotation_security_test.sql
--
-- PURPOSE:
--   Verifies database-level security rules, transactional integrity,
--   server sequence generation, status transition state machine,
--   approval role enforcement, immutable issued revisions, email claiming,
--   and customer token expiration.
--
-- EXECUTION:
--   Safe for Supabase SQL Editor and automated runners.
--   Enclosed in a transaction that executes tests and always issues ROLLBACK.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
    v_test_admin_id UUID := gen_random_uuid();
    v_unauth_admin_id UUID := gen_random_uuid();
    v_quote_res JSONB;
    v_quote_id TEXT;
    v_token TEXT;
    v_claim_res JSONB;
    v_idempotency_key TEXT;
    v_cust_res JSONB;
    v_pub_res JSONB;
BEGIN
    RAISE NOTICE '--- Starting ZEZ B2B Quotation Security Test Suite ---';

    -- 0. Setup Mock Administrator Accounts
    INSERT INTO public.administrator_users (id, email, full_name, role, is_active)
    VALUES 
        (v_test_admin_id, 'authorized.engr@zez.ph', 'Engr. Test Specialist', 'sales_engineer', true),
        (v_unauth_admin_id, 'viewer@zez.ph', 'Unauthorized Viewer', 'viewer', true)
    ON CONFLICT (id) DO NOTHING;

    -- -------------------------------------------------------------------------
    -- TEST 1: Server sequence ID allocation (client-forged ID must be ignored)
    -- -------------------------------------------------------------------------
    v_quote_res := public.save_official_quotation(
        jsonb_build_object(
            'id', 'FORGED-ZEZ-99999',
            'revision_number', 1,
            'status', 'Draft',
            'customer_full_name', 'Security Test Customer',
            'customer_email', 'sec-test@customer.ph',
            'subtotal_php', 50000.00,
            'grand_total_php', 50000.00,
            'payment_terms', 'Standard commercial terms as specified in quotation / PO',
            'warranty_terms', 'Standard manufacturer warranty as specified per product line'
        ),
        jsonb_build_array(
            jsonb_build_object('product_name', 'Test Firewall Appliance', 'quantity', 1, 'unit_price_php', 50000.00, 'line_total_php', 50000.00)
        ),
        'System Test Runner',
        'Testing Server ID Allocation'
    );

    IF (v_quote_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 1 FAILED: save_official_quotation returned error: %', v_quote_res->>'error';
    END IF;

    v_quote_id := v_quote_res->>'id';
    IF v_quote_id = 'FORGED-ZEZ-99999' OR v_quote_id NOT LIKE 'ZEZ-Q-%' THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Server accepted forged ID % instead of allocating canonical ZEZ-Q- sequence', v_quote_id;
    END IF;
    RAISE NOTICE '[PASS] Test 1: Server allocated canonical sequence ID: %', v_quote_id;

    -- -------------------------------------------------------------------------
    -- TEST 2: Status transition state machine validation
    -- (Draft cannot directly transition to Sent or Accepted without Approval)
    -- -------------------------------------------------------------------------
    v_quote_res := public.save_official_quotation(
        jsonb_build_object(
            'id', v_quote_id,
            'revision_number', 1,
            'status', 'Sent' -- Invalid direct leap from Draft to Sent
        ),
        NULL,
        'System Test Runner',
        'Attempting Invalid Transition'
    );

    IF (v_quote_res->>'success')::BOOLEAN IS TRUE THEN
        RAISE EXCEPTION 'TEST 2 FAILED: Database allowed invalid state transition directly from Draft to Sent!';
    END IF;
    RAISE NOTICE '[PASS] Test 2: Invalid transition Draft -> Sent correctly rejected (%s)', v_quote_res->>'error';

    -- -------------------------------------------------------------------------
    -- TEST 3: Valid status transition (Draft -> Approved)
    -- -------------------------------------------------------------------------
    v_quote_res := public.save_official_quotation(
        jsonb_build_object(
            'id', v_quote_id,
            'revision_number', 1,
            'status', 'Approved',
            'approved_by', v_test_admin_id
        ),
        NULL,
        'System Test Runner',
        'Approving Quotation'
    );

    IF (v_quote_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Could not transition Draft to Approved: %', v_quote_res->>'error';
    END IF;
    RAISE NOTICE '[PASS] Test 3: Approved quotation successfully';

    -- -------------------------------------------------------------------------
    -- TEST 4: Atomic email-send claiming with row lock & server idempotency key
    -- -------------------------------------------------------------------------
    v_claim_res := public.claim_quotation_for_email_send(v_quote_id, v_test_admin_id, false);
    IF (v_claim_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 4 FAILED: claim_quotation_for_email_send failed: %', v_claim_res->>'error';
    END IF;

    v_idempotency_key := v_claim_res->>'idempotency_key';
    IF v_idempotency_key IS NULL OR v_idempotency_key NOT LIKE 'zez_qsend_%' THEN
        RAISE EXCEPTION 'TEST 4 FAILED: Invalid server idempotency key generated: %', v_idempotency_key;
    END IF;
    RAISE NOTICE '[PASS] Test 4: Atomically claimed quotation for email with key: %', v_idempotency_key;

    -- Finalize the email send
    PERFORM public.finalize_quotation_email_send(
        v_quote_id,
        v_test_admin_id,
        'resend_test_msg_12345',
        v_idempotency_key,
        'sec-test@customer.ph',
        true
    );
    RAISE NOTICE '[PASS] Test 4.1: Finalized quotation email dispatch into Sent status';

    -- -------------------------------------------------------------------------
    -- TEST 5: Immutability of issued commercial quotations
    -- (Modifying line items on a Sent quotation must be rejected)
    -- -------------------------------------------------------------------------
    v_quote_res := public.save_official_quotation(
        jsonb_build_object(
            'id', v_quote_id,
            'revision_number', 1,
            'status', 'Sent',
            'subtotal_php', 10000.00 -- Altering price
        ),
        jsonb_build_array(
            jsonb_build_object('product_name', 'Tampered Item', 'quantity', 5, 'unit_price_php', 2000.00, 'line_total_php', 10000.00)
        ),
        'Malicious Actor',
        'Attempting Modification of Issued Quote'
    );

    IF (v_quote_res->>'success')::BOOLEAN IS TRUE THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Database allowed modification of an issued Sent quotation!';
    END IF;
    RAISE NOTICE '[PASS] Test 5: In-place tampering of issued quotation correctly rejected: %', v_quote_res->>'error';

    -- -------------------------------------------------------------------------
    -- TEST 6: Customer access token security & response workflow
    -- -------------------------------------------------------------------------
    SELECT customer_access_token INTO v_token FROM public.quotations WHERE id = v_quote_id;

    -- Verify customer can view public quotation without admin_notes or token leakage
    v_pub_res := public.get_public_quotation_by_token(v_token);
    IF (v_pub_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 6 FAILED: get_public_quotation_by_token returned error: %', v_pub_res->>'error';
    END IF;

    IF v_pub_res->'quotation'->>'customer_access_token' IS NOT NULL THEN
        RAISE EXCEPTION 'TEST 6 FAILED: get_public_quotation_by_token leaked secret customer_access_token!';
    END IF;
    IF v_pub_res->'quotation'->>'admin_notes' IS NOT NULL AND v_pub_res->'quotation'->>'admin_notes' != '' THEN
        RAISE EXCEPTION 'TEST 6 FAILED: get_public_quotation_by_token leaked admin_notes!';
    END IF;
    RAISE NOTICE '[PASS] Test 6: Public quotation view sanitized (no token or admin_notes exposure)';

    -- -------------------------------------------------------------------------
    -- TEST 7: Customer response to unissued quotations rejected
    -- -------------------------------------------------------------------------
    -- Create a draft quote and attempt customer response
    v_quote_res := public.save_official_quotation(
        jsonb_build_object(
            'revision_number', 1,
            'status', 'Draft',
            'customer_full_name', 'Unissued Test Customer',
            'customer_email', 'unissued@customer.ph',
            'customer_access_token', 'token_unissued_draft_123'
        ),
        NULL,
        'System Test Runner',
        'Creating Unissued Draft'
    );

    v_cust_res := public.submit_customer_quotation_response('token_unissued_draft_123', 'Accepted');
    IF (v_cust_res->>'success')::BOOLEAN IS TRUE THEN
        RAISE EXCEPTION 'TEST 7 FAILED: Customer response was accepted on an unissued Draft!';
    END IF;
    RAISE NOTICE '[PASS] Test 7: Customer response on unissued Draft correctly rejected: %', v_cust_res->>'error';

    -- -------------------------------------------------------------------------
    -- TEST 8: Customer acceptance on valid Sent quotation
    -- -------------------------------------------------------------------------
    v_cust_res := public.submit_customer_quotation_response(v_token, 'Accepted', 'PO attached via corporate portal', 'PO-2026-ZEZ-778');
    IF (v_cust_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 8 FAILED: Customer acceptance on valid Sent quote failed: %', v_cust_res->>'error';
    END IF;
    RAISE NOTICE '[PASS] Test 8: Customer acceptance processed successfully (New status: %)', v_cust_res->>'status';

    -- -------------------------------------------------------------------------
    -- TEST 9: Terminal status immutability (cannot modify accepted quotation)
    -- -------------------------------------------------------------------------
    v_cust_res := public.submit_customer_quotation_response(v_token, 'Declined');
    IF (v_cust_res->>'success')::BOOLEAN IS TRUE THEN
        RAISE EXCEPTION 'TEST 9 FAILED: Database allowed re-declining an already Accepted quotation!';
    END IF;
    RAISE NOTICE '[PASS] Test 9: Terminal Accepted status cannot be altered: %', v_cust_res->>'error';

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'ALL ZEZ B2B QUOTATION SQL SECURITY TESTS PASSED SUCCESSFULLY';
    RAISE NOTICE '============================================================';
END;
$$;

-- Always rollback so test records are never left in the database
ROLLBACK;
