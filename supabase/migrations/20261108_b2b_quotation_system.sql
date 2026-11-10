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

-- 0. CALLER IDENTITY HELPER FOR SECURITY DEFINER FUNCTIONS
-- In PostgreSQL SECURITY DEFINER functions, current_user evaluates to the function owner (postgres).
-- To reliably identify the invoking role without relying on current_user, this helper inspects
-- session_user and PostgREST session JWT claims (role).
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
    v_jwt_role TEXT;
BEGIN
    -- 1. Direct superuser / maintenance session (e.g., Supabase SQL Editor, pg_cron)
    IF session_user IN ('postgres', 'supabase_admin') THEN
        RETURN true;
    END IF;

    -- 2. Direct session connection as service_role
    IF session_user = 'service_role' THEN
        RETURN true;
    END IF;

    -- 3. PostgREST JWT claim role passed by Edge Functions or service_role API callers
    v_jwt_role := COALESCE(
        NULLIF(current_setting('request.jwt.claim.role', true), ''),
        (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
        auth.role()
    );

    IF v_jwt_role = 'service_role' THEN
        RETURN true;
    END IF;

    RETURN false;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.is_service_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_service_role() TO anon, authenticated, service_role;

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
    -- Authorize service_role or active administrator (never check current_user)
    IF NOT (public.is_service_role() OR public.is_admin()) THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required to generate quotation number.';
    END IF;

    v_year := to_char(CURRENT_DATE, 'YYYY');
    v_seq := nextval('public.quotation_number_seq');
    v_number := 'ZEZ-Q-' || v_year || '-' || LPAD(v_seq::TEXT, 5, '0');
    RETURN v_number;
END;
$$;

-- Restrict execution strictly to administrators and service_role
REVOKE ALL ON FUNCTION public.generate_quotation_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_quotation_number() FROM anon;
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
    
    -- Commercial Terms (Configurable Approved Terms - Neutral Verified Defaults)
    payment_terms TEXT NOT NULL DEFAULT 'Standard commercial terms as specified in quotation / PO',
    warranty_terms TEXT NOT NULL DEFAULT 'Standard manufacturer warranty as specified per product line',
    validity_days INT NOT NULL DEFAULT 30,
    valid_until TIMESTAMPTZ NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'PHP',
    lead_time_description TEXT DEFAULT 'Subject to stock availability and logistics confirmation',
    special_instructions TEXT,
    admin_notes TEXT, -- Confidential internal staff remarks
    assigned_specialist TEXT, -- Dynamic assigned specialist (no hardcoded claims)
    
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
    
    -- Email Tracking, Concurrency Lock & Idempotency
    email_dispatch_status VARCHAR(30) NOT NULL DEFAULT 'idle', -- 'idle' | 'claiming' | 'sending' | 'sent' | 'failed'
    email_claim_token UUID,
    email_claim_expires_at TIMESTAMPTZ,
    email_claim_actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    last_email_idempotency_key TEXT,
    last_resend_email_id TEXT,
    email_delivery_count INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure schema compatibility for existing databases
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS email_dispatch_status VARCHAR(30) NOT NULL DEFAULT 'idle';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS email_claim_token UUID;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS email_claim_expires_at TIMESTAMPTZ;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS email_claim_actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Ensure base_quotation_id defaults to id if not specified
UPDATE public.quotations SET base_quotation_id = id WHERE base_quotation_id IS NULL;

-- Indexes for fast searching and filtering
CREATE INDEX IF NOT EXISTS idx_quotations_rfq ON public.quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_email ON public.quotations(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotations_token ON public.quotations(customer_access_token);
CREATE INDEX IF NOT EXISTS idx_quotations_created ON public.quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_base_rev ON public.quotations(base_quotation_id, revision_number);
CREATE INDEX IF NOT EXISTS idx_quotations_email_dispatch ON public.quotations(email_dispatch_status);
CREATE INDEX IF NOT EXISTS idx_quotations_claim_token ON public.quotations(email_claim_token);

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

-- 5.4 DIRECT TABLE UPDATE & IMMUTABILITY ENFORCEMENT TRIGGERS
-- Prevents direct table updates from bypassing quotation approval,
-- immutable issued versions, or email status rules.
CREATE OR REPLACE FUNCTION public.trg_enforce_quotation_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 1. Prevent inserting as 'Sent' directly without verified service_role email dispatch
        IF NEW.status = 'Sent' THEN
            IF NOT public.is_service_role() OR NEW.last_resend_email_id IS NULL OR trim(NEW.last_resend_email_id) = '' THEN
                RAISE EXCEPTION 'Cannot insert quotation with status Sent. Quotations must follow the official approval and email dispatch workflow.';
            END IF;
        END IF;

        -- 2. Prevent inserting as 'Approved' without administrator reference
        IF NEW.status = 'Approved' AND NEW.approved_by IS NULL THEN
            RAISE EXCEPTION 'Quotation % cannot be created with Approved status without approved_by administrator reference.', NEW.id;
        END IF;

        -- 3. Prevent inserting directly into closed terminal statuses
        IF NEW.status IN ('Accepted', 'Declined', 'Expired') THEN
            RAISE EXCEPTION 'Cannot insert quotation % directly into terminal status (%).', NEW.id, NEW.status;
        END IF;

        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        IF OLD.status IN ('Approved', 'Sent', 'Accepted', 'Declined') THEN
            RAISE EXCEPTION 'Cannot delete quotation % with status (%). Commercial records must be preserved for audit compliance. Cancel or revise instead.', OLD.id, OLD.status;
        END IF;
        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- 1. Prevent modification of terminal quotations
        IF OLD.status IN ('Accepted', 'Declined', 'Expired', 'Cancelled') THEN
            IF NEW.status != OLD.status THEN
                RAISE EXCEPTION 'Quotation % is in terminal status (%) and cannot transition to %.', OLD.id, OLD.status, NEW.status;
            END IF;
            IF NEW.subtotal_php != OLD.subtotal_php OR NEW.grand_total_php != OLD.grand_total_php 
               OR NEW.vat_amount_php != OLD.vat_amount_php OR NEW.customer_email != OLD.customer_email 
               OR NEW.payment_terms != OLD.payment_terms THEN
                RAISE EXCEPTION 'Commercial terms and pricing of quotation % are immutable in terminal status (%).', OLD.id, OLD.status;
            END IF;
        END IF;

        -- 2. Prevent tampering with pricing or commercial terms of issued quotations
        IF OLD.status IN ('Sent', 'Under Review') THEN
            IF NEW.subtotal_php != OLD.subtotal_php OR NEW.grand_total_php != OLD.grand_total_php 
               OR NEW.vat_amount_php != OLD.vat_amount_php OR NEW.discount_amount_php != OLD.discount_amount_php 
               OR NEW.payment_terms != OLD.payment_terms OR NEW.customer_email != OLD.customer_email 
               OR NEW.currency != OLD.currency THEN
                RAISE EXCEPTION 'Quotation % is in issued status (%). Commercial terms and pricing are immutable. Create a new revision to amend.', OLD.id, OLD.status;
            END IF;
        END IF;

        -- 3. Prevent direct leap from Draft to Sent without official approval
        IF OLD.status = 'Draft' AND NEW.status = 'Sent' THEN
            RAISE EXCEPTION 'Direct transition from Draft to Sent is forbidden on quotation %. Quotations must be officially Approved first.', OLD.id;
        END IF;

        -- 4. Prevent transition to Sent without verified email dispatch proof
        IF NEW.status = 'Sent' AND OLD.status != 'Sent' THEN
            IF NOT public.is_service_role() AND (NEW.last_resend_email_id IS NULL OR trim(NEW.last_resend_email_id) = '') THEN
                RAISE EXCEPTION 'Cannot mark quotation % as Sent without verified email dispatch proof (last_resend_email_id).', OLD.id;
            END IF;
        END IF;

        -- 5. Prevent marking Approved without administrator reference
        IF NEW.status = 'Approved' AND OLD.status != 'Approved' THEN
            IF NEW.approved_by IS NULL THEN
                RAISE EXCEPTION 'Quotation % cannot be marked Approved without approved_by administrator reference.', OLD.id;
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quotations_security_rules ON public.quotations;
CREATE TRIGGER trg_quotations_security_rules
    BEFORE INSERT OR UPDATE OR DELETE ON public.quotations
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_enforce_quotation_rules();

-- Line items immutability trigger
CREATE OR REPLACE FUNCTION public.trg_enforce_quotation_line_items_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_target_qid TEXT;
    v_q_status TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_target_qid := OLD.quotation_id;
    ELSE
        v_target_qid := NEW.quotation_id;
    END IF;

    SELECT status INTO v_q_status FROM public.quotations WHERE id = v_target_qid;
    IF v_q_status IN ('Sent', 'Accepted', 'Declined', 'Expired', 'Cancelled') THEN
        RAISE EXCEPTION 'Cannot modify or delete line items for quotation % in issued or closed status (%). Line items on issued quotations are immutable.', v_target_qid, v_q_status;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_quotation_line_items_immutability ON public.quotation_line_items;
CREATE TRIGGER trg_quotation_line_items_immutability
    BEFORE INSERT OR UPDATE OR DELETE ON public.quotation_line_items
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_enforce_quotation_line_items_immutability();

-- 6. TRANSACTIONALLY CONSISTENT QUOTATION SAVE RPC
-- Enforces:
--  - Authorization (authenticated admin or service_role; never trusts caller-supplied admin ID)
--  - Immutability of issued quotations (Sent, Accepted, Declined) checked on real values (not audit string)
--  - Server-side atomic sequence number allocation
--  - Transactional replacement of line items
--  - Immutable audit trail
--  - Status transition state machine validation
--  - Approval role enforcement (super_admin, operations_manager, sales_engineer)
CREATE OR REPLACE FUNCTION public.save_official_quotation(
    p_quote JSONB,
    p_items JSONB,
    p_actor_name TEXT DEFAULT NULL,
    p_audit_action TEXT DEFAULT NULL
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
    v_now TIMESTAMPTZ := NOW();
    v_item JSONB;
    v_actor_id UUID;
    v_actor_name TEXT;
    v_actor_role TEXT;
    v_admin_user RECORD;
    v_approved_by UUID := NULL;
    v_approved_at TIMESTAMPTZ := NULL;
BEGIN
    -- 1. Identity Resolution & Role Authorization (Never trust caller-supplied admin ID/role or current_user)
    IF public.is_service_role() THEN
        v_actor_id := (p_quote->>'actor_id')::UUID;
        v_actor_name := COALESCE(p_actor_name, 'Service Role Administrator');
        v_actor_role := 'super_admin';
    ELSE
        -- Must be authenticated
        IF auth.uid() IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Authenticated session required.');
        END IF;

        v_actor_id := auth.uid();
        SELECT id, full_name, email, role, is_active INTO v_admin_user
        FROM public.administrator_users
        WHERE id = v_actor_id AND is_active = true;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Active administrator account required.');
        END IF;

        v_actor_name := COALESCE(v_admin_user.full_name, v_admin_user.email, 'Administrator');
        v_actor_role := v_admin_user.role;

        -- Enforce that modifying/saving quotations requires super_admin, operations_manager, or sales_engineer
        IF v_actor_role NOT IN ('super_admin', 'operations_manager', 'sales_engineer') THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Forbidden: Administrator role (' || v_actor_role || ') does not have permission to modify quotations.'
            );
        END IF;
    END IF;

    v_id := p_quote->>'id';
    v_status := COALESCE(p_quote->>'status', 'Draft');
    v_rev := COALESCE((p_quote->>'revision_number')::INT, 1);
    v_base_id := p_quote->>'base_quotation_id';

    -- 2. Lookup existing record
    SELECT * INTO v_existing FROM public.quotations WHERE id = v_id;

    IF NOT FOUND THEN
        -- New quotation record being created: enforce server-assigned sequence number
        IF v_rev <= 1 THEN
            v_id := public.generate_quotation_number();
            v_base_id := v_id;
        ELSE
            -- Revisions > 1 must have an existing base quotation
            IF v_base_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.quotations WHERE id = v_base_id) THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'Invalid revision: Base quotation ' || COALESCE(v_base_id, 'NULL') || ' does not exist in system.'
                );
            END IF;
            -- Canonical revision format: {base_id}-R{rev}
            v_id := v_base_id || '-R' || v_rev::TEXT;
        END IF;
    ELSE
        -- Updating existing quotation
        v_base_id := COALESCE(v_existing.base_quotation_id, v_existing.id);
        v_rev := v_existing.revision_number;

        -- 3. Status Transition State Machine Validation
        IF v_existing.status IN ('Accepted', 'Declined', 'Expired', 'Cancelled') AND v_status != v_existing.status THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Quotation ' || v_id || ' is in terminal status (' || v_existing.status || ') and cannot be transitioned to ' || v_status || '. Please create a new revision to make updates.'
            );
        END IF;

        IF v_existing.status = 'Draft' AND v_status NOT IN ('Draft', 'Pending Approval', 'Approved', 'Cancelled') THEN
            RETURN jsonb_build_object('success', false, 'error', 'Invalid transition from Draft to ' || v_status || '. Drafts must move to Pending Approval, Approved, or Cancelled.');
        ELSIF v_existing.status = 'Pending Approval' AND v_status NOT IN ('Pending Approval', 'Draft', 'Approved', 'Cancelled') THEN
            RETURN jsonb_build_object('success', false, 'error', 'Invalid transition from Pending Approval to ' || v_status || '.');
        ELSIF v_existing.status = 'Approved' AND v_status NOT IN ('Approved', 'Draft', 'Sent', 'Cancelled') THEN
            RETURN jsonb_build_object('success', false, 'error', 'Invalid transition from Approved to ' || v_status || '. Approved quotations may only transition to Sent, Draft, or Cancelled.');
        ELSIF v_existing.status = 'Sent' AND v_status NOT IN ('Sent', 'Accepted', 'Declined', 'Under Review', 'Expired', 'Cancelled') THEN
            RETURN jsonb_build_object('success', false, 'error', 'Invalid transition from Sent to ' || v_status || '.');
        ELSIF v_existing.status = 'Under Review' AND v_status NOT IN ('Under Review', 'Accepted', 'Declined', 'Expired', 'Cancelled') THEN
            RETURN jsonb_build_object('success', false, 'error', 'Invalid transition from Under Review to ' || v_status || '.');
        END IF;

        -- 4. True Immutability Check (Never trust user-supplied audit action string!)
        IF v_existing.status IN ('Sent', 'Accepted', 'Declined', 'Expired', 'Cancelled') THEN
            IF (p_quote ? 'subtotal_php' AND (p_quote->>'subtotal_php')::NUMERIC != v_existing.subtotal_php)
               OR (p_quote ? 'grand_total_php' AND (p_quote->>'grand_total_php')::NUMERIC != v_existing.grand_total_php)
               OR (p_quote ? 'vat_amount_php' AND (p_quote->>'vat_amount_php')::NUMERIC != v_existing.vat_amount_php)
               OR (p_quote ? 'discount_amount_php' AND (p_quote->>'discount_amount_php')::NUMERIC != v_existing.discount_amount_php)
               OR (p_quote ? 'customer_email' AND (p_quote->>'customer_email') != v_existing.customer_email)
               OR (p_quote ? 'payment_terms' AND (p_quote->>'payment_terms') != v_existing.payment_terms)
               OR (p_quote ? 'currency' AND (p_quote->>'currency') != v_existing.currency)
               OR (p_items IS NOT NULL AND jsonb_array_length(p_items) > 0)
            THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'Quotation ' || v_id || ' is in immutable status (' || v_existing.status || '). Issued commercial quotations cannot be modified. Create a new revision to make amendments.'
                );
            END IF;
        END IF;
    END IF;

    -- 5. Enforce Approval Authorization & Set Real Approver
    IF v_status = 'Approved' THEN
        IF v_existing IS NULL OR v_existing.status != 'Approved' THEN
            IF v_actor_role NOT IN ('super_admin', 'operations_manager', 'sales_engineer') THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'Forbidden: Approving quotations requires super_admin, operations_manager, or sales_engineer role.'
                );
            END IF;
            v_approved_by := v_actor_id;
            v_approved_at := v_now;
        ELSE
            v_approved_by := v_existing.approved_by;
            v_approved_at := v_existing.approved_at;
        END IF;
    ELSIF v_existing IS NOT NULL THEN
        v_approved_by := v_existing.approved_by;
        v_approved_at := v_existing.approved_at;
    END IF;

    -- 6. Upsert quotation record
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
        COALESCE(p_quote->>'payment_terms', 'Standard commercial terms as specified in quotation / PO'),
        COALESCE(p_quote->>'warranty_terms', 'Standard manufacturer warranty as specified per product line'),
        COALESCE((p_quote->>'validity_days')::INT, 30),
        COALESCE((p_quote->>'valid_until')::TIMESTAMPTZ, v_now + INTERVAL '30 days'),
        COALESCE(p_quote->>'currency', 'PHP'),
        COALESCE(p_quote->>'lead_time_description', 'Subject to stock availability and logistics confirmation'),
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
        v_actor_id,
        v_approved_by,
        v_approved_at,
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
        approved_by = COALESCE(v_approved_by, public.quotations.approved_by),
        approved_at = COALESCE(v_approved_at, public.quotations.approved_at),
        sent_at = COALESCE(EXCLUDED.sent_at, public.quotations.sent_at),
        sent_to_email = COALESCE(EXCLUDED.sent_to_email, public.quotations.sent_to_email),
        updated_at = v_now;

    -- Replace line items ONLY if not in an issued/immutable status
    IF v_existing IS NULL OR v_existing.status NOT IN ('Sent', 'Accepted', 'Declined', 'Expired', 'Cancelled') THEN
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
    END IF;

    -- Record Audit Log entry
    INSERT INTO public.quotation_audit_logs (
        quotation_id,
        actor_id,
        actor_name,
        action,
        details
    ) VALUES (
        v_id,
        v_actor_id,
        v_actor_name,
        COALESCE(p_audit_action, 'Saved Quotation Record'),
        jsonb_build_object(
            'revision', v_rev,
            'status', v_status,
            'actor_role', v_actor_role,
            'items_count', jsonb_array_length(COALESCE(p_items, '[]'::jsonb)),
            'timestamp', v_now
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'id', v_id,
        'base_quotation_id', v_base_id,
        'revision_number', v_rev,
        'status', v_status
    );
END;
$$;

-- Restrict save_official_quotation to authenticated users and service_role
REVOKE ALL ON FUNCTION public.save_official_quotation(JSONB, JSONB, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_official_quotation(JSONB, JSONB, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_official_quotation(JSONB, JSONB, TEXT, TEXT) TO authenticated, service_role;

-- 6.1 ATOMIC EMAIL-SEND CLAIMING PROCEDURE
-- Restricted strictly to service_role (invoked via the authenticated Edge Function).
-- Row-locks quotation, creates persistent claim token, enforces Approved status,
-- and prevents duplicate concurrent sends.
CREATE OR REPLACE FUNCTION public.claim_quotation_for_email_send(
    p_quotation_id TEXT,
    p_actor_id UUID,
    p_is_resend BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_quote RECORD;
    v_items JSONB;
    v_actor RECORD;
    v_idempotency_key TEXT;
    v_claim_token UUID;
    v_claim_expires_at TIMESTAMPTZ;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- 1. Security check: Only service_role may invoke email-send claiming (never check current_user)
    IF NOT public.is_service_role() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: Email claiming is restricted to service_role via the secure Edge Function.'
        );
    END IF;

    -- 2. Validate actor privileges against real administrator directory
    SELECT id, role, is_active, full_name, email INTO v_actor
    FROM public.administrator_users
    WHERE id = p_actor_id AND is_active = true;

    IF NOT FOUND OR v_actor.role NOT IN ('super_admin', 'operations_manager', 'sales_engineer') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: Quotation dispatch requires active super_admin, operations_manager, or sales_engineer role.'
        );
    END IF;

    -- 3. Atomically lock quotation row
    SELECT * INTO v_quote
    FROM public.quotations
    WHERE id = p_quotation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Quotation ' || p_quotation_id || ' not found.');
    END IF;

    -- 4. Status validation (Only Approved quotations may be initially sent)
    IF v_quote.status IN ('Draft', 'Pending Approval') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot dispatch quotation in ' || v_quote.status || ' status. Only officially Approved quotations may be sent.'
        );
    END IF;

    IF v_quote.status IN ('Cancelled', 'Expired', 'Accepted', 'Declined') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot dispatch quotation with closed status: ' || v_quote.status || '. Create a new revision.'
        );
    END IF;

    -- Check if already sent and not authorized resend
    IF v_quote.status = 'Sent' AND COALESCE(v_quote.email_delivery_count, 0) > 0 AND NOT COALESCE(p_is_resend, false) THEN
        RETURN jsonb_build_object(
            'success', false,
            'already_sent', true,
            'error', 'Quotation ' || v_quote.id || ' was already dispatched on ' || to_char(v_quote.sent_at, 'YYYY-MM-DD HH24:MI:SS') || '. Explicit resend authorization required.',
            'last_resend_email_id', v_quote.last_resend_email_id
        );
    END IF;

    -- 5. Persistent Concurrency Lock: Prevent duplicate concurrent sends
    IF v_quote.email_dispatch_status = 'sending' 
       AND v_quote.email_claim_expires_at IS NOT NULL 
       AND v_quote.email_claim_expires_at > v_now THEN
        RETURN jsonb_build_object(
            'success', false,
            'in_progress', true,
            'error', 'Quotation email dispatch is currently in progress by another request. Please wait.',
            'claim_expires_at', v_quote.email_claim_expires_at
        );
    END IF;

    -- 6. Generate active claim token & stable collision-free server idempotency key
    v_claim_token := gen_random_uuid();
    v_claim_expires_at := v_now + INTERVAL '5 minutes';
    v_idempotency_key := 'zez_qsend_' || v_quote.id || '_r' || v_quote.revision_number || '_' || to_char(v_now, 'YYYYMMDD_HH24MISS') || '_' || encode(gen_random_bytes(6), 'hex');

    -- Record claim state in database
    UPDATE public.quotations
    SET email_dispatch_status = 'sending',
        email_claim_token = v_claim_token,
        email_claim_expires_at = v_claim_expires_at,
        email_claim_actor_id = p_actor_id,
        last_email_idempotency_key = v_idempotency_key,
        updated_at = v_now
    WHERE id = v_quote.id;

    -- 7. Fetch sanitized line items
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
        'claim_token', v_claim_token,
        'idempotency_key', v_idempotency_key,
        'quotation', to_jsonb(v_quote),
        'items', v_items
    );
END;
$$;

-- Restrict to service_role ONLY
REVOKE ALL ON FUNCTION public.claim_quotation_for_email_send(TEXT, UUID, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_quotation_for_email_send(TEXT, UUID, BOOLEAN) FROM anon;
REVOKE ALL ON FUNCTION public.claim_quotation_for_email_send(TEXT, UUID, BOOLEAN) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_quotation_for_email_send(TEXT, UUID, BOOLEAN) TO service_role;

-- 6.2 FINALIZE QUOTATION EMAIL SEND PROCEDURE
-- Restricted to service_role. Requires matching active claim token and validates Resend ID.
DROP FUNCTION IF EXISTS public.finalize_quotation_email_send(TEXT, UUID, TEXT, TEXT, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.finalize_quotation_email_send(
    p_quotation_id TEXT,
    p_claim_token UUID,
    p_actor_id UUID,
    p_resend_id TEXT,
    p_idempotency_key TEXT,
    p_recipient TEXT,
    p_pdf_attached BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_quote RECORD;
    v_actor_name TEXT := 'System Administrator';
    v_now TIMESTAMPTZ := NOW();
    v_next_count INT;
BEGIN
    -- 1. Security check: Only service_role may finalize email dispatches (never check current_user)
    IF NOT public.is_service_role() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: Email finalization is restricted to service_role.'
        );
    END IF;

    -- 2. Validate Resend result
    IF p_resend_id IS NULL OR trim(p_resend_id) = '' OR length(trim(p_resend_id)) < 4 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or missing Resend delivery ID.'
        );
    END IF;

    -- 3. Lock row and verify claim token
    SELECT * INTO v_quote FROM public.quotations WHERE id = p_quotation_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Quotation ' || p_quotation_id || ' not found.');
    END IF;

    -- Durable idempotency check: If already finalized with this exact Resend delivery ID
    -- (handles network failure on return path from database finalization)
    IF v_quote.status = 'Sent' AND v_quote.last_resend_email_id = p_resend_id THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_finalized', true,
            'delivery_count', v_quote.email_delivery_count,
            'resend_id', p_resend_id,
            'status', 'Sent'
        );
    END IF;

    IF v_quote.email_claim_token IS NULL OR v_quote.email_claim_token != p_claim_token THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Claim token mismatch or expired. Concurrent dispatch collision avoided.'
        );
    END IF;

    IF v_quote.email_claim_expires_at IS NOT NULL AND v_quote.email_claim_expires_at < v_now THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Quotation email claim has expired.'
        );
    END IF;

    IF p_actor_id IS NOT NULL THEN
        SELECT COALESCE(full_name, email) INTO v_actor_name FROM public.administrator_users WHERE id = p_actor_id;
    END IF;

    v_next_count := COALESCE(v_quote.email_delivery_count, 0) + 1;

    -- 4. Finalize quotation into Sent status and release claim
    UPDATE public.quotations
    SET status = 'Sent',
        email_dispatch_status = 'sent',
        email_claim_token = NULL,
        email_claim_expires_at = NULL,
        sent_at = v_now,
        sent_to_email = p_recipient,
        last_resend_email_id = p_resend_id,
        last_email_idempotency_key = p_idempotency_key,
        email_delivery_count = v_next_count,
        updated_at = v_now
    WHERE id = p_quotation_id;

    -- 5. Audit Log
    INSERT INTO public.quotation_audit_logs (
        quotation_id,
        actor_id,
        actor_name,
        action,
        details
    ) VALUES (
        p_quotation_id,
        p_actor_id,
        v_actor_name,
        'Quotation Dispatched via Email',
        jsonb_build_object(
            'recipient', p_recipient,
            'resend_id', p_resend_id,
            'idempotency_key', p_idempotency_key,
            'delivery_count', v_next_count,
            'pdf_attached', p_pdf_attached,
            'sent_at', v_now
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'delivery_count', v_next_count,
        'resend_id', p_resend_id,
        'status', 'Sent'
    );
END;
$$;

-- Restrict to service_role ONLY
REVOKE ALL ON FUNCTION public.finalize_quotation_email_send(TEXT, UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_quotation_email_send(TEXT, UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM anon;
REVOKE ALL ON FUNCTION public.finalize_quotation_email_send(TEXT, UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_quotation_email_send(TEXT, UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN) TO service_role;

-- 6.3 FAIL / RELEASE QUOTATION EMAIL CLAIM PROCEDURE
-- Restores status to 'failed' and releases claim token if Resend fails.
CREATE OR REPLACE FUNCTION public.fail_quotation_email_send(
    p_quotation_id TEXT,
    p_claim_token UUID,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_quote RECORD;
BEGIN
    IF NOT public.is_service_role() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Releasing claim is restricted to service_role.');
    END IF;

    SELECT * INTO v_quote FROM public.quotations WHERE id = p_quotation_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Quotation not found.');
    END IF;

    -- If token matches, release claim and mark failed
    IF v_quote.email_claim_token IS NOT NULL AND v_quote.email_claim_token = p_claim_token THEN
        UPDATE public.quotations
        SET email_dispatch_status = 'failed',
            email_claim_token = NULL,
            email_claim_expires_at = NULL,
            updated_at = NOW()
        WHERE id = p_quotation_id;

        INSERT INTO public.quotation_audit_logs (
            quotation_id,
            actor_name,
            action,
            details
        ) VALUES (
            p_quotation_id,
            'System Dispatcher',
            'Quotation Email Dispatch Failed',
            jsonb_build_object(
                'error', COALESCE(p_error_message, 'Unknown error during dispatch'),
                'timestamp', NOW()
            )
        );

        RETURN jsonb_build_object('success', true, 'status', 'failed');
    END IF;

    RETURN jsonb_build_object('success', false, 'error', 'Claim token did not match current active claim.');
END;
$$;

-- Restrict to service_role ONLY
REVOKE ALL ON FUNCTION public.fail_quotation_email_send(TEXT, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_quotation_email_send(TEXT, UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.fail_quotation_email_send(TEXT, UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.fail_quotation_email_send(TEXT, UUID, TEXT) TO service_role;

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

    -- 1. Restrict Draft, Pending Approval, Approved (unissued), and Cancelled from public customer exposure
    IF v_quote.status IN ('Draft', 'Pending Approval', 'Approved') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This commercial proposal has not yet been officially issued for customer viewing.',
            'status', v_quote.status
        );
    END IF;

    IF v_quote.status = 'Cancelled' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This commercial quotation has been cancelled and is no longer accessible.',
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

REVOKE ALL ON FUNCTION public.get_public_quotation_by_token(TEXT) FROM PUBLIC;
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

    -- Restrict responses strictly to valid, unexpired, officially sent quotations
    IF v_quote.status NOT IN ('Sent', 'Under Review') THEN
        IF v_quote.status IN ('Draft', 'Pending Approval', 'Approved') THEN
            RETURN jsonb_build_object('success', false, 'error', 'This quotation has not been officially sent to the customer yet.');
        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'This quotation is closed with status ' || v_quote.status || ' and cannot receive customer responses.');
        END IF;
    END IF;

    -- Reject expired quotations
    IF v_quote.token_expires_at < NOW() THEN
        UPDATE public.quotations SET status = 'Expired', updated_at = NOW() WHERE id = v_quote.id;
        RETURN jsonb_build_object('success', false, 'error', 'This quotation has expired and can no longer be accepted. Please request a new revision.');
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

REVOKE ALL ON FUNCTION public.submit_customer_quotation_response(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_customer_quotation_response(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
