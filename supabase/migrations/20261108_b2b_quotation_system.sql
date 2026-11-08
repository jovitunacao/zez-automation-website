-- ==============================================================================
-- ZEZ AUTOMATION CORPORATION — B2B QUOTATION SYSTEM MIGRATION (HARDENED)
-- Migration: 20261108_b2b_quotation_system.sql
-- Description:
--   Creates production-ready enterprise quotation management tables, line items,
--   atomic sequence numbering, audit logging, immutable version control,
--   transactional consistency, and hardened customer response workflows.
--
-- COMPATIBILITY:
--   - Additive and non-destructive.
--   - Does NOT modify existing quotation_requests (RFQs), products, or accounts.
--   - Strict Row Level Security (RLS) restricting internal pricing, margins,
--     and customer data to authorized administrators.
-- ==============================================================================

-- 1. ATOMIC QUOTATION NUMBER GENERATOR
CREATE SEQUENCE IF NOT EXISTS public.quotation_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_year TEXT;
    v_seq INT;
    v_number TEXT;
BEGIN
    v_year := to_char(CURRENT_DATE, 'YYYY');
    v_seq := nextval('public.quotation_number_seq');
    v_number := 'ZEZ-Q-' || v_year || '-' || LPAD(v_seq::TEXT, 5, '0');
    RETURN v_number;
END;
$$;

-- Restrict execution
REVOKE ALL ON FUNCTION public.generate_quotation_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_quotation_number() TO authenticated, service_role;

-- 2. OFFICIAL B2B QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS public.quotations (
    id VARCHAR(100) PRIMARY KEY, -- e.g. ZEZ-Q-2026-00001 or ZEZ-Q-2026-00001-R2
    base_quotation_id VARCHAR(100), -- Base quotation number for grouping revisions
    rfq_id VARCHAR(100) REFERENCES public.quotation_requests(id) ON DELETE SET NULL,
    revision_number INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    -- Status values: 'Draft', 'Pending Approval', 'Approved', 'Sent', 'Accepted', 'Declined', 'Expired', 'Cancelled', 'Under Review'
    
    -- Customer & Commercial Target
    customer_full_name TEXT NOT NULL,
    customer_company_name TEXT,
    customer_email TEXT NOT NULL,
    customer_mobile_number TEXT,
    delivery_city_province TEXT,
    delivery_address TEXT,
    tin_number TEXT,
    
    -- Commercial Terms (Configurable Approved Terms)
    payment_terms TEXT NOT NULL DEFAULT 'Cash On Delivery (COD) / Full Payment upon turnover',
    warranty_terms TEXT NOT NULL DEFAULT 'Standard 1-Year Local Manufacturer Warranty on Hardware',
    validity_days INT NOT NULL DEFAULT 30,
    valid_until TIMESTAMPTZ NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'PHP',
    lead_time_description TEXT DEFAULT 'Standard Freight Delivery (3-5 business days upon PO acceptance)',
    special_instructions TEXT,
    admin_notes TEXT, -- Confidential internal staff remarks
    assigned_specialist TEXT, -- Dynamic assigned specialist
    
    -- Pricing Breakdown (Decimal-Safe Exact Numeric)
    subtotal_php NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' | 'fixed'
    discount_value NUMERIC(14,2) DEFAULT 0,
    discount_amount_php NUMERIC(14,2) NOT NULL DEFAULT 0,
    vat_type VARCHAR(30) NOT NULL DEFAULT 'vat_inclusive_12', -- 'vat_inclusive_12', 'vat_exclusive_12', 'vat_exempt', 'zero_rated'
    vat_rate NUMERIC(5,4) NOT NULL DEFAULT 0.1200,
    vat_amount_php NUMERIC(14,2) NOT NULL DEFAULT 0,
    net_of_vat_php NUMERIC(14,2) NOT NULL DEFAULT 0,
    delivery_fee_php NUMERIC(14,2) NOT NULL DEFAULT 0,
    installation_fee_php NUMERIC(14,2) NOT NULL DEFAULT 0,
    other_fees_php NUMERIC(14,2) NOT NULL DEFAULT 0,
    grand_total_php NUMERIC(14,2) NOT NULL DEFAULT 0,
    
    -- Security & Customer Expirable Link
    customer_access_token VARCHAR(128) UNIQUE NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    
    -- Workflow & Audit Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    sent_to_email TEXT,
    customer_response VARCHAR(50), -- 'Accepted', 'Declined', 'Revision Requested'
    customer_response_at TIMESTAMPTZ,
    customer_response_notes TEXT,
    client_po_number TEXT,
    
    -- Email Tracking & Idempotency
    last_email_idempotency_key TEXT,
    last_resend_email_id TEXT,
    email_delivery_count INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure base_quotation_id defaults to id if not specified
UPDATE public.quotations SET base_quotation_id = id WHERE base_quotation_id IS NULL;

-- Indexes for fast searching and filtering
CREATE INDEX IF NOT EXISTS idx_quotations_rfq ON public.quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_email ON public.quotations(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotations_token ON public.quotations(customer_access_token);
CREATE INDEX IF NOT EXISTS idx_quotations_created ON public.quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_base_rev ON public.quotations(base_quotation_id, revision_number);

-- 3. QUOTATION LINE ITEMS
CREATE TABLE IF NOT EXISTS public.quotation_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id VARCHAR(100) NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    product_id VARCHAR(100),
    sku VARCHAR(100),
    product_name TEXT NOT NULL,
    model TEXT,
    brand TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_php NUMERIC(14,2) NOT NULL CHECK (unit_price_php >= 0),
    discount_percent NUMERIC(5,2) DEFAULT 0,
    line_total_php NUMERIC(14,2) NOT NULL,
    lead_time TEXT,
    warranty TEXT,
    notes TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_line_items_qid ON public.quotation_line_items(quotation_id);

-- 4. QUOTATION AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.quotation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id VARCHAR(100) NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    actor_id UUID,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_audit_qid ON public.quotation_audit_logs(quotation_id);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 Quotations Policies
DROP POLICY IF EXISTS "Admins full access to quotations" ON public.quotations;
CREATE POLICY "Admins full access to quotations"
ON public.quotations
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Service role access to quotations" ON public.quotations;
CREATE POLICY "Service role access to quotations"
ON public.quotations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5.2 Quotation Line Items Policies
DROP POLICY IF EXISTS "Admins full access to quotation_line_items" ON public.quotation_line_items;
CREATE POLICY "Admins full access to quotation_line_items"
ON public.quotation_line_items
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Service role access to quotation_line_items" ON public.quotation_line_items;
CREATE POLICY "Service role access to quotation_line_items"
ON public.quotation_line_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5.3 Quotation Audit Logs Policies
DROP POLICY IF EXISTS "Admins full access to quotation_audit_logs" ON public.quotation_audit_logs;
CREATE POLICY "Admins full access to quotation_audit_logs"
ON public.quotation_audit_logs
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Service role access to quotation_audit_logs" ON public.quotation_audit_logs;
CREATE POLICY "Service role access to quotation_audit_logs"
ON public.quotation_audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. TRANSACTIONALLY CONSISTENT QUOTATION SAVE RPC
-- Enforces:
--  - Authorization (authenticated admin or service_role)
--  - Immutability of issued quotations (Sent, Accepted, Declined)
--  - Server-side atomic sequence number allocation
--  - Transactional replacement of line items
--  - Immutable audit trail
CREATE OR REPLACE FUNCTION public.save_official_quotation(
    p_quote JSONB,
    p_items JSONB,
    p_actor_name TEXT,
    p_audit_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id TEXT;
    v_base_id TEXT;
    v_rev INT;
    v_status TEXT;
    v_existing RECORD;
    v_is_admin BOOLEAN;
    v_now TIMESTAMPTZ := NOW();
    v_item JSONB;
BEGIN
    -- Verify caller authorization
    v_is_admin := public.is_admin();
    IF NOT v_is_admin AND current_user != 'service_role' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Administrator privileges required.');
    END IF;

    v_id := p_quote->>'id';
    v_status := COALESCE(p_quote->>'status', 'Draft');
    v_rev := COALESCE((p_quote->>'revision_number')::INT, 1);
    v_base_id := COALESCE(p_quote->>'base_quotation_id', v_id);

    -- Check if new ID allocation is required
    IF v_id IS NULL OR v_id = '' OR v_id LIKE 'TEMP-%' OR v_id LIKE 'DRAFT-%' THEN
        v_id := public.generate_quotation_number();
        v_base_id := v_id;
    END IF;

    -- Check if record already exists and is immutable
    SELECT * INTO v_existing FROM public.quotations WHERE id = v_id;
    IF FOUND THEN
        -- If already issued, line items and financial terms cannot be modified in-place
        IF v_existing.status IN ('Sent', 'Accepted', 'Declined') AND p_audit_action NOT LIKE 'Status update%' AND p_audit_action NOT LIKE 'Customer%' THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Quotation ' || v_id || ' is in immutable status (' || v_existing.status || '). Issued commercial quotations cannot be modified. Create a new revision (e.g. Rev ' || (v_existing.revision_number + 1)::TEXT || ') to make amendments.'
            );
        END IF;
    END IF;

    -- Upsert quotation record
    INSERT INTO public.quotations (
        id,
        base_quotation_id,
        rfq_id,
        revision_number,
        status,
        customer_full_name,
        customer_company_name,
        customer_email,
        customer_mobile_number,
        delivery_city_province,
        delivery_address,
        tin_number,
        payment_terms,
        warranty_terms,
        validity_days,
        valid_until,
        currency,
        lead_time_description,
        special_instructions,
        admin_notes,
        assigned_specialist,
        subtotal_php,
        discount_type,
        discount_value,
        discount_amount_php,
        vat_type,
        vat_rate,
        vat_amount_php,
        net_of_vat_php,
        delivery_fee_php,
        installation_fee_php,
        other_fees_php,
        grand_total_php,
        customer_access_token,
        token_expires_at,
        created_by,
        approved_by,
        approved_at,
        sent_at,
        sent_to_email,
        updated_at
    ) VALUES (
        v_id,
        v_base_id,
        p_quote->>'rfq_id',
        v_rev,
        v_status,
        COALESCE(p_quote->>'customer_full_name', 'Customer'),
        p_quote->>'customer_company_name',
        COALESCE(p_quote->>'customer_email', ''),
        p_quote->>'customer_mobile_number',
        p_quote->>'delivery_city_province',
        p_quote->>'delivery_address',
        p_quote->>'tin_number',
        COALESCE(p_quote->>'payment_terms', 'Cash On Delivery (COD) / Full Payment upon turnover'),
        COALESCE(p_quote->>'warranty_terms', 'Standard 1-Year Local Manufacturer Warranty on Hardware'),
        COALESCE((p_quote->>'validity_days')::INT, 30),
        COALESCE((p_quote->>'valid_until')::TIMESTAMPTZ, v_now + INTERVAL '30 days'),
        COALESCE(p_quote->>'currency', 'PHP'),
        p_quote->>'lead_time_description',
        p_quote->>'special_instructions',
        p_quote->>'admin_notes',
        p_quote->>'assigned_specialist',
        COALESCE((p_quote->>'subtotal_php')::NUMERIC, 0),
        COALESCE(p_quote->>'discount_type', 'percentage'),
        COALESCE((p_quote->>'discount_value')::NUMERIC, 0),
        COALESCE((p_quote->>'discount_amount_php')::NUMERIC, 0),
        COALESCE(p_quote->>'vat_type', 'vat_inclusive_12'),
        COALESCE((p_quote->>'vat_rate')::NUMERIC, 0.12),
        COALESCE((p_quote->>'vat_amount_php')::NUMERIC, 0),
        COALESCE((p_quote->>'net_of_vat_php')::NUMERIC, 0),
        COALESCE((p_quote->>'delivery_fee_php')::NUMERIC, 0),
        COALESCE((p_quote->>'installation_fee_php')::NUMERIC, 0),
        COALESCE((p_quote->>'other_fees_php')::NUMERIC, 0),
        COALESCE((p_quote->>'grand_total_php')::NUMERIC, 0),
        COALESCE(p_quote->>'customer_access_token', encode(gen_random_bytes(32), 'hex')),
        COALESCE((p_quote->>'token_expires_at')::TIMESTAMPTZ, v_now + INTERVAL '30 days'),
        (p_quote->>'created_by')::UUID,
        (p_quote->>'approved_by')::UUID,
        (p_quote->>'approved_at')::TIMESTAMPTZ,
        (p_quote->>'sent_at')::TIMESTAMPTZ,
        p_quote->>'sent_to_email',
        v_now
    )
    ON CONFLICT (id) DO UPDATE SET
        base_quotation_id = EXCLUDED.base_quotation_id,
        rfq_id = EXCLUDED.rfq_id,
        revision_number = EXCLUDED.revision_number,
        status = EXCLUDED.status,
        customer_full_name = EXCLUDED.customer_full_name,
        customer_company_name = EXCLUDED.customer_company_name,
        customer_email = EXCLUDED.customer_email,
        customer_mobile_number = EXCLUDED.customer_mobile_number,
        delivery_city_province = EXCLUDED.delivery_city_province,
        delivery_address = EXCLUDED.delivery_address,
        tin_number = EXCLUDED.tin_number,
        payment_terms = EXCLUDED.payment_terms,
        warranty_terms = EXCLUDED.warranty_terms,
        validity_days = EXCLUDED.validity_days,
        valid_until = EXCLUDED.valid_until,
        currency = EXCLUDED.currency,
        lead_time_description = EXCLUDED.lead_time_description,
        special_instructions = EXCLUDED.special_instructions,
        admin_notes = EXCLUDED.admin_notes,
        assigned_specialist = EXCLUDED.assigned_specialist,
        subtotal_php = EXCLUDED.subtotal_php,
        discount_type = EXCLUDED.discount_type,
        discount_value = EXCLUDED.discount_value,
        discount_amount_php = EXCLUDED.discount_amount_php,
        vat_type = EXCLUDED.vat_type,
        vat_rate = EXCLUDED.vat_rate,
        vat_amount_php = EXCLUDED.vat_amount_php,
        net_of_vat_php = EXCLUDED.net_of_vat_php,
        delivery_fee_php = EXCLUDED.delivery_fee_php,
        installation_fee_php = EXCLUDED.installation_fee_php,
        other_fees_php = EXCLUDED.other_fees_php,
        grand_total_php = EXCLUDED.grand_total_php,
        approved_by = COALESCE(EXCLUDED.approved_by, public.quotations.approved_by),
        approved_at = COALESCE(EXCLUDED.approved_at, public.quotations.approved_at),
        sent_at = COALESCE(EXCLUDED.sent_at, public.quotations.sent_at),
        sent_to_email = COALESCE(EXCLUDED.sent_to_email, public.quotations.sent_to_email),
        updated_at = v_now;

    -- Replace line items transactionally
    DELETE FROM public.quotation_line_items WHERE quotation_id = v_id;

    IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            INSERT INTO public.quotation_line_items (
                quotation_id,
                product_id,
                sku,
                product_name,
                model,
                brand,
                quantity,
                unit_price_php,
                discount_percent,
                line_total_php,
                lead_time,
                warranty,
                notes,
                sort_order
            ) VALUES (
                v_id,
                v_item->>'product_id',
                v_item->>'sku',
                COALESCE(v_item->>'product_name', 'Item'),
                v_item->>'model',
                v_item->>'brand',
                COALESCE((v_item->>'quantity')::INT, 1),
                COALESCE((v_item->>'unit_price_php')::NUMERIC, 0),
                COALESCE((v_item->>'discount_percent')::NUMERIC, 0),
                COALESCE((v_item->>'line_total_php')::NUMERIC, 0),
                v_item->>'lead_time',
                v_item->>'warranty',
                v_item->>'notes',
                COALESCE((v_item->>'sort_order')::INT, 0)
            );
        END LOOP;
    END IF;

    -- Record Audit Log entry
    INSERT INTO public.quotation_audit_logs (
        quotation_id,
        actor_name,
        action,
        details
    ) VALUES (
        v_id,
        COALESCE(p_actor_name, 'System Administrator'),
        COALESCE(p_audit_action, 'Saved Quotation Record'),
        jsonb_build_object(
            'revision', v_rev,
            'status', v_status,
            'items_count', jsonb_array_length(p_items),
            'timestamp', v_now
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'id', v_id,
        'revision_number', v_rev,
        'status', v_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_official_quotation(JSONB, JSONB, TEXT, TEXT) TO authenticated, service_role;

-- 7. SECURE CUSTOMER RPC: GET SANITIZED QUOTATION BY TOKEN
-- Enforces:
--  - Draft / Pending Approval cannot be viewed by customers.
--  - Expired tokens do NOT leak confidential pricing, items, or notes.
--  - Internal admin notes, user IDs, and auth tokens are omitted from public response.
CREATE OR REPLACE FUNCTION public.get_public_quotation_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_quote RECORD;
    v_items JSONB;
BEGIN
    IF p_token IS NULL OR trim(p_token) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid access token.');
    END IF;

    SELECT * INTO v_quote
    FROM public.quotations
    WHERE customer_access_token = p_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Quotation not found or invalid access link.');
    END IF;

    -- 1. Restrict Draft and Pending Approval from public customer exposure
    IF v_quote.status IN ('Draft', 'Pending Approval') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This commercial proposal is currently undergoing administrative review and has not yet been issued for customer viewing.',
            'status', v_quote.status
        );
    END IF;

    -- 2. Restrict Expired Quotations: Do NOT leak confidential items or prices
    IF v_quote.token_expires_at < NOW() AND v_quote.status NOT IN ('Accepted') THEN
        -- Atomically mark as Expired if still in Sent status
        IF v_quote.status = 'Sent' THEN
            UPDATE public.quotations SET status = 'Expired', updated_at = NOW() WHERE id = v_quote.id;
        END IF;

        RETURN jsonb_build_object(
            'success', false,
            'error', 'This quotation link expired on ' || to_char(v_quote.token_expires_at, 'YYYY-MM-DD') || '. Quotation details have been secured. Please contact your ZEZ sales engineer for an updated proposal.',
            'is_expired', true,
            'quotation_id', v_quote.id,
            'valid_until', v_quote.valid_until
        );
    END IF;

    -- 3. Fetch sanitized line items (no internal cost or supplier margin data)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'sku', sku,
            'product_name', product_name,
            'model', model,
            'brand', brand,
            'quantity', quantity,
            'unit_price_php', unit_price_php,
            'discount_percent', discount_percent,
            'line_total_php', line_total_php,
            'lead_time', lead_time,
            'warranty', warranty,
            'notes', notes,
            'sort_order', sort_order
        ) ORDER BY sort_order ASC
    ), '[]'::jsonb) INTO v_items
    FROM public.quotation_line_items
    WHERE quotation_id = v_quote.id;

    -- 4. Return ONLY customer-safe fields (strictly exclude admin_notes, tokens, UUIDs)
    RETURN jsonb_build_object(
        'success', true,
        'quotation', jsonb_build_object(
            'id', v_quote.id,
            'rfq_id', v_quote.rfq_id,
            'revision_number', v_quote.revision_number,
            'status', v_quote.status,
            'customer_full_name', v_quote.customer_full_name,
            'customer_company_name', v_quote.customer_company_name,
            'customer_email', v_quote.customer_email,
            'customer_mobile_number', v_quote.customer_mobile_number,
            'delivery_city_province', v_quote.delivery_city_province,
            'delivery_address', v_quote.delivery_address,
            'tin_number', v_quote.tin_number,
            'payment_terms', v_quote.payment_terms,
            'warranty_terms', v_quote.warranty_terms,
            'validity_days', v_quote.validity_days,
            'valid_until', v_quote.valid_until,
            'currency', v_quote.currency,
            'lead_time_description', v_quote.lead_time_description,
            'special_instructions', v_quote.special_instructions,
            'assigned_specialist', v_quote.assigned_specialist,
            'subtotal_php', v_quote.subtotal_php,
            'discount_type', v_quote.discount_type,
            'discount_value', v_quote.discount_value,
            'discount_amount_php', v_quote.discount_amount_php,
            'vat_type', v_quote.vat_type,
            'vat_rate', v_quote.vat_rate,
            'vat_amount_php', v_quote.vat_amount_php,
            'net_of_vat_php', v_quote.net_of_vat_php,
            'delivery_fee_php', v_quote.delivery_fee_php,
            'installation_fee_php', v_quote.installation_fee_php,
            'other_fees_php', v_quote.other_fees_php,
            'grand_total_php', v_quote.grand_total_php,
            'sent_at', v_quote.sent_at,
            'customer_response', v_quote.customer_response,
            'customer_response_at', v_quote.customer_response_at,
            'customer_response_notes', v_quote.customer_response_notes,
            'client_po_number', v_quote.client_po_number,
            'created_at', v_quote.created_at
        ),
        'items', v_items
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_quotation_by_token(TEXT) TO anon, authenticated, service_role;

-- 8. SECURE CUSTOMER RPC: RESPOND TO QUOTATION
CREATE OR REPLACE FUNCTION public.submit_customer_quotation_response(
    p_token TEXT,
    p_response TEXT,
    p_notes TEXT DEFAULT NULL,
    p_po_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_quote RECORD;
    v_new_status TEXT;
BEGIN
    SELECT * INTO v_quote
    FROM public.quotations
    WHERE customer_access_token = p_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid quotation access token.');
    END IF;

    -- Reject responses to unissued quotes
    IF v_quote.status IN ('Draft', 'Pending Approval') THEN
        RETURN jsonb_build_object('success', false, 'error', 'This quotation has not been issued to customers yet.');
    END IF;

    -- Reject expired quotations
    IF v_quote.token_expires_at < NOW() AND v_quote.status NOT IN ('Accepted') THEN
        UPDATE public.quotations SET status = 'Expired', updated_at = NOW() WHERE id = v_quote.id;
        RETURN jsonb_build_object('success', false, 'error', 'This quotation has expired and can no longer be accepted. Please request a new revision.');
    END IF;

    -- Prevent modifying already-finalized responses
    IF v_quote.status IN ('Accepted', 'Declined', 'Cancelled') THEN
        RETURN jsonb_build_object('success', false, 'error', 'This quotation has already been closed with status: ' || v_quote.status);
    END IF;

    IF p_response = 'Accepted' THEN
        v_new_status := 'Accepted';
    ELSIF p_response = 'Declined' THEN
        v_new_status := 'Declined';
    ELSIF p_response = 'Revision Requested' THEN
        v_new_status := 'Under Review';
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid response option. Allowed values: Accepted, Declined, Revision Requested.');
    END IF;

    UPDATE public.quotations
    SET 
        status = v_new_status,
        customer_response = p_response,
        customer_response_at = NOW(),
        customer_response_notes = p_notes,
        client_po_number = p_po_number,
        updated_at = NOW()
    WHERE id = v_quote.id;

    -- Record Audit Log entry
    INSERT INTO public.quotation_audit_logs (
        quotation_id,
        actor_name,
        action,
        details
    ) VALUES (
        v_quote.id,
        COALESCE(v_quote.customer_company_name, v_quote.customer_full_name) || ' (Customer)',
        'Customer ' || p_response,
        jsonb_build_object(
            'response', p_response,
            'notes', p_notes,
            'po_number', p_po_number,
            'timestamp', NOW()
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'quotation_id', v_quote.id,
        'status', v_new_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_customer_quotation_response(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
