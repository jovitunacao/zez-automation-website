-- ==============================================================================
-- ZEZ AUTOMATION CORPORATION — B2B QUOTATION SYSTEM MIGRATION
-- Migration: 20261108_b2b_quotation_system.sql
-- Description:
--   Creates production-ready enterprise quotation management tables, line items,
--   atomic sequence numbering, audit logging, and customer response workflows.
--
-- COMPATIBILITY:
--   - Additive and non-destructive.
--   - Does NOT modify existing quotation_requests (RFQs), products, or accounts.
--   - Enforces strict Row Level Security (RLS) restricting internal pricing
--     and customer data to authorized administrators.
-- ==============================================================================

-- 1. ATOMIC QUOTATION NUMBER GENERATOR
CREATE SEQUENCE IF NOT EXISTS public.quotation_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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
    id VARCHAR(100) PRIMARY KEY, -- e.g. ZEZ-Q-2026-00001
    rfq_id VARCHAR(100) REFERENCES public.quotation_requests(id) ON DELETE SET NULL,
    revision_number INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    -- Status values: 'Draft', 'Pending Approval', 'Approved', 'Sent', 'Accepted', 'Declined', 'Expired', 'Cancelled'
    
    -- Customer & Commercial Target
    customer_full_name TEXT NOT NULL,
    customer_company_name TEXT,
    customer_email TEXT NOT NULL,
    customer_mobile_number TEXT,
    delivery_city_province TEXT,
    delivery_address TEXT,
    tin_number TEXT,
    
    -- Commercial Terms
    payment_terms TEXT NOT NULL DEFAULT '30 Days Net upon approval',
    warranty_terms TEXT NOT NULL DEFAULT 'Standard 1-Year Local Manufacturer Warranty',
    validity_days INT NOT NULL DEFAULT 30,
    valid_until TIMESTAMPTZ NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'PHP',
    lead_time_description TEXT DEFAULT '1-3 business days within regional hubs / 3-5 days provincial freight',
    special_instructions TEXT,
    admin_notes TEXT,
    assigned_specialist TEXT DEFAULT 'Marco Rivera (Enterprise Account Manager)',
    
    -- Pricing Breakdown (Decimal-Safe Numeric)
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
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast searching and filtering
CREATE INDEX IF NOT EXISTS idx_quotations_rfq ON public.quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_email ON public.quotations(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotations_token ON public.quotations(customer_access_token);
CREATE INDEX IF NOT EXISTS idx_quotations_created ON public.quotations(created_at DESC);

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
-- Authenticated active administrators have full access
DROP POLICY IF EXISTS "Admins full access to quotations" ON public.quotations;
CREATE POLICY "Admins full access to quotations"
ON public.quotations
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Service role full access
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

-- 6. SECURE CUSTOMER RPC: GET QUOTATION BY EXPIRING TOKEN
-- Anonymous visitors can only read a quotation if they possess the valid, unexpired customer_access_token.
CREATE OR REPLACE FUNCTION public.get_public_quotation_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_quote RECORD;
    v_items JSONB;
BEGIN
    SELECT * INTO v_quote
    FROM public.quotations
    WHERE customer_access_token = p_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Quotation not found or invalid access link.');
    END IF;

    IF v_quote.token_expires_at < NOW() AND v_quote.status NOT IN ('Accepted', 'Declined') THEN
        -- Mark as expired
        UPDATE public.quotations SET status = 'Expired', updated_at = NOW() WHERE id = v_quote.id;
        v_quote.status := 'Expired';
    END IF;

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

    RETURN jsonb_build_object(
        'success', true,
        'quotation', to_jsonb(v_quote),
        'items', v_items
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_quotation_by_token(TEXT) TO anon, authenticated, service_role;

-- 7. SECURE CUSTOMER RPC: RESPOND TO QUOTATION
CREATE OR REPLACE FUNCTION public.submit_customer_quotation_response(
    p_token TEXT,
    p_response TEXT,
    p_notes TEXT DEFAULT NULL,
    p_po_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_quote RECORD;
    v_new_status TEXT;
BEGIN
    SELECT * INTO v_quote
    FROM public.quotations
    WHERE customer_access_token = p_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid quotation token.');
    END IF;

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
        RETURN jsonb_build_object('success', false, 'error', 'Invalid response option: must be Accepted, Declined, or Revision Requested');
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

    -- Record Audit Log
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
            'ip_timestamp', NOW()
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
