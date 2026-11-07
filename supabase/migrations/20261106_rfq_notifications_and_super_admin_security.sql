-- ==============================================================================
-- ZEZ AUTOMATION CORPORATION - PHASE 4 DATABASE MIGRATION (FINAL PRODUCTION HARDENING)
-- Migration Date: 2026-11-06
-- File: supabase/migrations/20261106_rfq_notifications_and_super_admin_security.sql
--
-- PURPOSE:
--   1. Restrict administrator management strictly to authorized Super Admins.
--   2. Add 'receive_rfq_notifications' preference to administrator_users.
--   3. Safeguard against deleting or deactivating the last active Super Admin.
--   4. Prevent privilege escalation (non-super admins cannot alter roles, active status, or profiles).
--   5. Create 'rfq_notification_logs' table with bounded retries and crash-recovery support.
--   6. Create 'email_quota_tracking' table to respect Resend Free tier limits (100/day, 3,000/month).
--   7. Implement transaction-safe email quota reservation (reserve_email_quota) and release RPCs.
--   8. Implement crash-recovery atomic row claiming (claim_pending_rfq_notifications) using FOR UPDATE SKIP LOCKED.
--   9. Secure server-side dispatch (dispatch_rfq_notification_server) storing credentials in private schema or vault.
--  10. Restrict execution of privileged SECURITY DEFINER functions so ordinary authenticated users cannot manipulate queues or quotas.
--  11. Ensure customer RFQ submission NEVER fails or aborts if email delivery encounters errors.
--
-- DO NOT EXECUTE AUTOMATICALLY. Review in Supabase SQL Editor before applying.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. EXTEND administrator_users TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.administrator_users
ADD COLUMN IF NOT EXISTS receive_rfq_notifications BOOLEAN DEFAULT true NOT NULL;

-- ------------------------------------------------------------------------------
-- 2. SECURITY DEFINER HELPER: public.is_super_admin()
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.administrator_users 
        WHERE id = auth.uid() 
          AND role = 'super_admin' 
          AND is_active = true
    );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. TIGHTEN ROW LEVEL SECURITY ON public.administrator_users
-- ------------------------------------------------------------------------------
ALTER TABLE public.administrator_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view and manage admin users" ON public.administrator_users;
DROP POLICY IF EXISTS "Admins view administrator directory" ON public.administrator_users;
DROP POLICY IF EXISTS "Super admins insert administrators" ON public.administrator_users;
DROP POLICY IF EXISTS "Super admins update administrators" ON public.administrator_users;
DROP POLICY IF EXISTS "Admins update administrator records" ON public.administrator_users;
DROP POLICY IF EXISTS "Super admins delete administrators" ON public.administrator_users;

-- 3.1 SELECT: Any active administrator can view the administrator directory
CREATE POLICY "Admins view administrator directory"
ON public.administrator_users
FOR SELECT
TO authenticated
USING (public.is_admin());

-- 3.2 INSERT: Strictly Super Admins (or service_role)
CREATE POLICY "Super admins insert administrators"
ON public.administrator_users
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

-- 3.3 UPDATE: Super Admins can update any admin; regular admins can only update their own record
CREATE POLICY "Admins update administrator records"
ON public.administrator_users
FOR UPDATE
TO authenticated
USING (public.is_super_admin() OR (auth.uid() = id AND public.is_admin()))
WITH CHECK (public.is_super_admin() OR (auth.uid() = id AND public.is_admin()));

-- 3.4 DELETE: Strictly Super Admins
CREATE POLICY "Super admins delete administrators"
ON public.administrator_users
FOR DELETE
TO authenticated
USING (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 4. PRIVILEGE ESCALATION & LAST SUPER ADMIN SAFEGUARD TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_administrator_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_active_super_admins INTEGER;
    v_is_caller_super_admin BOOLEAN;
BEGIN
    v_is_caller_super_admin := public.is_super_admin();

    -- On UPDATE:
    IF TG_OP = 'UPDATE' THEN
        -- Prevent non-super-admins from changing their role, is_active status, or modifying other admins
        IF NOT v_is_caller_super_admin THEN
            IF NEW.id <> auth.uid() THEN
                RAISE EXCEPTION 'Access Denied: Only Super Admins can modify other administrator accounts.';
            END IF;
            IF NEW.role <> OLD.role THEN
                RAISE EXCEPTION 'Access Denied: Only Super Admins can assign or alter administrative roles.';
            END IF;
            IF NEW.is_active <> OLD.is_active THEN
                RAISE EXCEPTION 'Access Denied: Administrators cannot deactivate their own administrative accounts.';
            END IF;
            IF NEW.email <> OLD.email THEN
                RAISE EXCEPTION 'Access Denied: Email address cannot be modified directly.';
            END IF;
            IF NEW.full_name <> OLD.full_name THEN
                RAISE EXCEPTION 'Access Denied: Profile name cannot be modified directly by standard administrators.';
            END IF;
        END IF;

        -- Safeguard: If deactivating or demoting a Super Admin, verify at least one other active Super Admin remains
        IF OLD.role = 'super_admin' AND OLD.is_active = true AND (NEW.role <> 'super_admin' OR NEW.is_active = false) THEN
            SELECT COUNT(*) INTO v_active_super_admins
            FROM public.administrator_users
            WHERE role = 'super_admin' AND is_active = true AND id <> OLD.id;

            IF v_active_super_admins < 1 THEN
                RAISE EXCEPTION 'Action Rejected: Cannot deactivate or demote the last active Super Admin account. Maintain at least one active Super Admin.';
            END IF;
        END IF;

        NEW.updated_at := TIMEZONE('utc'::text, NOW());
        RETURN NEW;
    END IF;

    -- On DELETE:
    IF TG_OP = 'DELETE' THEN
        IF NOT v_is_caller_super_admin THEN
            RAISE EXCEPTION 'Access Denied: Only Super Admins can delete administrator accounts.';
        END IF;

        IF OLD.role = 'super_admin' AND OLD.is_active = true THEN
            SELECT COUNT(*) INTO v_active_super_admins
            FROM public.administrator_users
            WHERE role = 'super_admin' AND is_active = true AND id <> OLD.id;

            IF v_active_super_admins < 1 THEN
                RAISE EXCEPTION 'Action Rejected: Cannot delete the last active Super Admin account.';
            END IF;
        END IF;

        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_administrator_integrity ON public.administrator_users;
CREATE TRIGGER trg_protect_administrator_integrity
BEFORE UPDATE OR DELETE ON public.administrator_users
FOR EACH ROW
EXECUTE FUNCTION public.protect_administrator_integrity();

-- ------------------------------------------------------------------------------
-- 5. RFQ NOTIFICATION DELIVERY LOGS TABLE (public.rfq_notification_logs)
--    Tracks every individual alert dispatch, attempt count, and status
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rfq_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id VARCHAR(100) NOT NULL REFERENCES public.quotation_requests(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_role VARCHAR(50),
    admin_id UUID REFERENCES public.administrator_users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    resend_id VARCHAR(255),
    attempt_count INTEGER DEFAULT 0 NOT NULL,
    max_attempts INTEGER DEFAULT 3 NOT NULL,
    last_attempt_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    customer_summary JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT rfq_notification_unique_recipient UNIQUE (rfq_id, recipient_email)
);

-- Ensure allowed status values include 'processing'
ALTER TABLE public.rfq_notification_logs DROP CONSTRAINT IF EXISTS rfq_notification_logs_status_check;
ALTER TABLE public.rfq_notification_logs ADD CONSTRAINT rfq_notification_logs_status_check 
    CHECK (status IN ('pending', 'queued', 'processing', 'sent', 'failed', 'retrying', 'quota_exceeded', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_rfq_notif_rfq_id ON public.rfq_notification_logs(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_notif_status ON public.rfq_notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_rfq_notif_created ON public.rfq_notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rfq_notif_email ON public.rfq_notification_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_rfq_notif_processing ON public.rfq_notification_logs(status, last_attempt_at);

-- Enable RLS on notification logs
ALTER TABLE public.rfq_notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view notification delivery logs" ON public.rfq_notification_logs;
CREATE POLICY "Admins view notification delivery logs"
ON public.rfq_notification_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Super admins manage notification delivery logs" ON public.rfq_notification_logs;
CREATE POLICY "Super admins manage notification delivery logs"
ON public.rfq_notification_logs
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 6. EMAIL QUOTA TRACKING TABLE (Resend Free Tier: 100/day, 3,000/month)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_quota_tracking (
    date_key DATE PRIMARY KEY DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Manila'),
    sent_count INTEGER DEFAULT 0 NOT NULL,
    failed_count INTEGER DEFAULT 0 NOT NULL,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.email_quota_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view email quota tracking" ON public.email_quota_tracking;
CREATE POLICY "Admins view email quota tracking"
ON public.email_quota_tracking
FOR SELECT
TO authenticated
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. TRANSACTION-SAFE QUOTA RESERVATION & RELEASE FUNCTIONS
--    Restricted to service_role to prevent unauthorized quota manipulation
-- ------------------------------------------------------------------------------

-- 7.1 reserve_email_quota: Atomically checks and reserves quota slots before sending
CREATE OR REPLACE FUNCTION public.reserve_email_quota(
    p_count INTEGER DEFAULT 1,
    p_date DATE DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Manila')
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_first_day_of_month DATE;
    v_today_reserved INTEGER := 0;
    v_month_reserved INTEGER := 0;
    v_daily_limit CONSTANT INTEGER := 100;
    v_monthly_limit CONSTANT INTEGER := 3000;
    v_new_daily INTEGER;
    v_new_monthly INTEGER;
BEGIN
    -- Security guard: Restrict execution to service_role or Super Admins
    IF current_user <> 'service_role' AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied: reserve_email_quota can only be invoked by service_role.';
    END IF;

    v_first_day_of_month := DATE_TRUNC('month', p_date);

    -- Ensure row exists for target date
    INSERT INTO public.email_quota_tracking (
        date_key,
        sent_count,
        failed_count,
        created_at,
        updated_at
    ) VALUES (
        p_date,
        0,
        0,
        TIMEZONE('utc'::text, NOW()),
        TIMEZONE('utc'::text, NOW())
    ) ON CONFLICT (date_key) DO NOTHING;

    -- Lock rows for this month with FOR UPDATE to eliminate concurrent reservation race conditions
    PERFORM 1
    FROM public.email_quota_tracking
    WHERE date_key >= v_first_day_of_month
    FOR UPDATE;

    SELECT COALESCE(sent_count, 0) INTO v_today_reserved
    FROM public.email_quota_tracking
    WHERE date_key = p_date;

    SELECT COALESCE(SUM(sent_count), 0) INTO v_month_reserved
    FROM public.email_quota_tracking
    WHERE date_key >= v_first_day_of_month;

    -- Evaluate daily ceiling
    IF (v_today_reserved + p_count) > v_daily_limit THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', format('Daily Resend Free limit reached (%s/%s used today).', v_today_reserved, v_daily_limit),
            'today_sent', v_today_reserved,
            'month_sent', v_month_reserved,
            'daily_limit', v_daily_limit,
            'monthly_limit', v_monthly_limit
        );
    END IF;

    -- Evaluate monthly ceiling
    IF (v_month_reserved + p_count) > v_monthly_limit THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', format('Monthly Resend Free limit reached (%s/%s used this month).', v_month_reserved, v_monthly_limit),
            'today_sent', v_today_reserved,
            'month_sent', v_month_reserved,
            'daily_limit', v_daily_limit,
            'monthly_limit', v_monthly_limit
        );
    END IF;

    -- Atomically reserve quota by incrementing sent_count
    UPDATE public.email_quota_tracking
    SET sent_count = sent_count + p_count,
        last_sent_at = TIMEZONE('utc'::text, NOW()),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE date_key = p_date
    RETURNING sent_count INTO v_new_daily;

    v_new_monthly := v_month_reserved + p_count;

    RETURN jsonb_build_object(
        'allowed', true,
        'reserved_count', p_count,
        'today_sent', v_new_daily,
        'month_sent', v_new_monthly,
        'daily_limit', v_daily_limit,
        'monthly_limit', v_monthly_limit
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_email_quota(INTEGER, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_email_quota(INTEGER, DATE) TO service_role;

-- 7.2 release_email_quota: Releases reserved quota if delivery encounters an unrecoverable failure
CREATE OR REPLACE FUNCTION public.release_email_quota(
    p_count INTEGER DEFAULT 1,
    p_date DATE DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Manila')
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF current_user <> 'service_role' AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied: release_email_quota can only be invoked by service_role.';
    END IF;

    UPDATE public.email_quota_tracking
    SET sent_count = GREATEST(0, sent_count - p_count),
        failed_count = failed_count + p_count,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE date_key = p_date;
END;
$$;

REVOKE ALL ON FUNCTION public.release_email_quota(INTEGER, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_email_quota(INTEGER, DATE) TO service_role;

-- 7.3 check_email_quota: Read-only quota check
CREATE OR REPLACE FUNCTION public.check_email_quota(
    p_date DATE DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Manila')
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_first_day_of_month DATE;
    v_today_sent INTEGER := 0;
    v_month_sent INTEGER := 0;
    v_daily_limit CONSTANT INTEGER := 100;
    v_monthly_limit CONSTANT INTEGER := 3000;
BEGIN
    IF current_user <> 'service_role' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: check_email_quota can only be invoked by authorized administrators or service_role.';
    END IF;

    v_first_day_of_month := DATE_TRUNC('month', p_date);

    SELECT COALESCE(sent_count, 0) INTO v_today_sent
    FROM public.email_quota_tracking
    WHERE date_key = p_date;

    SELECT COALESCE(SUM(sent_count), 0) INTO v_month_sent
    FROM public.email_quota_tracking
    WHERE date_key >= v_first_day_of_month;

    RETURN jsonb_build_object(
        'date_key', p_date,
        'today_sent', v_today_sent,
        'month_sent', v_month_sent,
        'daily_limit', v_daily_limit,
        'monthly_limit', v_monthly_limit,
        'can_send', (v_today_sent < v_daily_limit AND v_month_sent < v_monthly_limit),
        'reason', CASE 
            WHEN v_today_sent >= v_daily_limit THEN format('Daily Resend Free limit (%s/%s) reached.', v_today_sent, v_daily_limit)
            WHEN v_month_sent >= v_monthly_limit THEN format('Monthly Resend Free limit (%s/%s) reached.', v_month_sent, v_monthly_limit)
            ELSE 'OK'
        END
    );
END;
$$;

REVOKE ALL ON FUNCTION public.check_email_quota(DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_quota(DATE) TO service_role;

-- 7.4 increment_email_quota_counter: Standalone counter increment helper
CREATE OR REPLACE FUNCTION public.increment_email_quota_counter(
    p_date DATE DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Manila')
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Delegates to reserve_email_quota for consistent concurrency-safe semantics
    RETURN public.reserve_email_quota(1, p_date);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_email_quota_counter(DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_email_quota_counter(DATE) TO service_role;

-- ------------------------------------------------------------------------------
-- 8. ATOMIC ROW CLAIMING & CRASH RECOVERY RPC
--    Uses FOR UPDATE SKIP LOCKED and recovers jobs stuck in 'processing' (> 5 mins)
--    Restricted to service_role
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_pending_rfq_notifications(
    p_rfq_id VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    rfq_id VARCHAR,
    recipient_email VARCHAR,
    recipient_name VARCHAR,
    recipient_role VARCHAR,
    admin_id UUID,
    status VARCHAR,
    resend_id VARCHAR,
    attempt_count INTEGER,
    max_attempts INTEGER,
    last_attempt_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    customer_summary JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Security guard: Restricted to service_role or Super Admins
    IF current_user <> 'service_role' AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied: claim_pending_rfq_notifications can only be invoked by service_role.';
    END IF;

    -- 1. Crash recovery sweep: Mark abandoned processing rows that reached max_attempts as failed
    UPDATE public.rfq_notification_logs
    SET status = 'failed',
        error_message = 'Notification job timed out in processing state and reached maximum retry attempts.',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE status = 'processing'
      AND last_attempt_at < (TIMEZONE('utc'::text, NOW()) - INTERVAL '5 minutes')
      AND attempt_count >= max_attempts;

    -- 2. Claim pending, retrying, OR crashed jobs (> 5 mins old) within attempt budget
    RETURN QUERY
    WITH selected AS (
        SELECT logs.id
        FROM public.rfq_notification_logs logs
        WHERE (p_rfq_id IS NULL OR logs.rfq_id = p_rfq_id)
          AND (
              logs.status IN ('pending', 'retrying')
              OR (
                  logs.status = 'processing' 
                  AND logs.last_attempt_at < (TIMEZONE('utc'::text, NOW()) - INTERVAL '5 minutes')
              )
          )
          AND logs.attempt_count < logs.max_attempts
        ORDER BY logs.created_at ASC
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.rfq_notification_logs l
    SET status = 'processing',
        last_attempt_at = TIMEZONE('utc'::text, NOW()),
        attempt_count = l.attempt_count + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    FROM selected
    WHERE l.id = selected.id
    RETURNING 
        l.id,
        l.rfq_id,
        l.recipient_email,
        l.recipient_name,
        l.recipient_role,
        l.admin_id,
        l.status,
        l.resend_id,
        l.attempt_count,
        l.max_attempts,
        l.last_attempt_at,
        l.sent_at,
        l.error_message,
        l.customer_summary,
        l.created_at,
        l.updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_pending_rfq_notifications(VARCHAR, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_rfq_notifications(VARCHAR, INTEGER) TO service_role;

-- ------------------------------------------------------------------------------
-- 9. SECURE STORAGE FOR DISPATCH CREDENTIALS & SERVER-SIDE pg_net DISPATCH
--    Stores webhook secret in a dedicated 'private' schema inaccessible to clients
-- ------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

CREATE TABLE IF NOT EXISTS private.app_secrets (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
REVOKE ALL ON TABLE private.app_secrets FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE private.app_secrets TO postgres, service_role;

CREATE OR REPLACE FUNCTION public.dispatch_rfq_notification_server(p_rfq_id VARCHAR)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions, pg_temp
AS $$
DECLARE
    v_url TEXT;
    v_secret TEXT;
    v_body JSONB;
BEGIN
    -- 1. Attempt to read from Supabase Vault (if vault extension is enabled)
    BEGIN
        SELECT decrypted_secret INTO v_url
        FROM vault.decrypted_secrets
        WHERE name = 'notify_rfq_url'
        LIMIT 1;

        SELECT decrypted_secret INTO v_secret
        FROM vault.decrypted_secrets
        WHERE name = 'notify_webhook_secret'
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        -- Vault not initialized or table inaccessible
    END;

    -- 2. Attempt to read from private.app_secrets (protected private schema)
    IF v_url IS NULL OR v_url = '' THEN
        BEGIN
            SELECT value INTO v_url FROM private.app_secrets WHERE key = 'notify_rfq_url' LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
        END;
    END IF;

    IF v_secret IS NULL OR v_secret = '' THEN
        BEGIN
            SELECT value INTO v_secret FROM private.app_secrets WHERE key = 'notify_webhook_secret' LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
        END;
    END IF;

    -- 3. Fallback to custom database settings
    IF v_url IS NULL OR v_url = '' THEN
        v_url := current_setting('app.settings.notify_rfq_url', true);
    END IF;
    IF v_secret IS NULL OR v_secret = '' THEN
        v_secret := current_setting('app.settings.notify_webhook_secret', true);
    END IF;

    -- If URL is configured, invoke non-blocking async HTTP POST via pg_net
    IF v_url IS NOT NULL AND v_url <> '' THEN
        v_body := jsonb_build_object('rfq_id', p_rfq_id);
        
        PERFORM net.http_post(
            url := v_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-webhook-secret', COALESCE(v_secret, '')
            ),
            body := v_body,
            timeout_milliseconds := 5000
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Never abort transaction if server dispatch encounters an error
    RAISE WARNING '[ZEZ Notification Dispatch] Server-side HTTP dispatch note: %', SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_rfq_notification_server(VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_rfq_notification_server(VARCHAR) TO service_role;

-- ------------------------------------------------------------------------------
-- 10. ATOMIC DATABASE TRIGGER: AUTOMATIC RFQ NOTIFICATION QUEUEING & DISPATCH
--     Queues notifications for all active, notification-enabled admins whenever
--     an RFQ is created. Never blocks RFQ creation if an error occurs.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.queue_rfq_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin RECORD;
    v_summary JSONB;
    v_items_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_items_count
    FROM public.quotation_items
    WHERE quotation_request_id = NEW.id;

    v_summary := jsonb_build_object(
        'customer_name', NEW.customer_full_name,
        'company_name', COALESCE(NEW.customer_company_name, 'Direct Client'),
        'customer_email', NEW.customer_email,
        'customer_mobile', NEW.customer_mobile_number,
        'total_estimated_php', NEW.total_estimated_php,
        'delivery_city_province', NEW.delivery_city_province,
        'items_count', v_items_count
    );

    -- Find all active administrators whose roles permit RFQ access and notifications are enabled
    FOR v_admin IN 
        SELECT id, email, full_name, role 
        FROM public.administrator_users
        WHERE is_active = true 
          AND receive_rfq_notifications = true
          AND role IN ('super_admin', 'admin', 'sales_engineer')
    LOOP
        INSERT INTO public.rfq_notification_logs (
            rfq_id,
            recipient_email,
            recipient_name,
            recipient_role,
            admin_id,
            status,
            customer_summary,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            v_admin.email,
            v_admin.full_name,
            v_admin.role,
            v_admin.id,
            'pending',
            v_summary,
            TIMEZONE('utc'::text, NOW()),
            TIMEZONE('utc'::text, NOW())
        )
        ON CONFLICT (rfq_id, recipient_email) DO NOTHING;
    END LOOP;

    -- Asynchronously invoke server-side dispatcher if pg_net is configured
    PERFORM public.dispatch_rfq_notification_server(NEW.id);

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Safeguard: Log warning but never abort customer RFQ submission!
    RAISE WARNING '[ZEZ Notification Queue] Error queuing RFQ notifications for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_queue_rfq_notifications ON public.quotation_requests;
CREATE TRIGGER trg_queue_rfq_notifications
AFTER INSERT ON public.quotation_requests
FOR EACH ROW
EXECUTE FUNCTION public.queue_rfq_notifications();

-- ------------------------------------------------------------------------------
-- 11. HELPER RPC: get_notification_stats()
--     Protected: Only authorized active administrators can view metrics
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_notification_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_today_date DATE;
    v_first_day_of_month DATE;
    v_today_sent INTEGER := 0;
    v_month_sent INTEGER := 0;
    v_pending_count INTEGER := 0;
    v_failed_count INTEGER := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only authorized administrators can view notification metrics.';
    END IF;

    v_today_date := (CURRENT_DATE AT TIME ZONE 'Asia/Manila');
    v_first_day_of_month := DATE_TRUNC('month', v_today_date);

    SELECT COUNT(*) INTO v_today_sent
    FROM public.rfq_notification_logs
    WHERE status = 'sent'
      AND (sent_at AT TIME ZONE 'Asia/Manila')::DATE = v_today_date;

    SELECT COUNT(*) INTO v_month_sent
    FROM public.rfq_notification_logs
    WHERE status = 'sent'
      AND (sent_at AT TIME ZONE 'Asia/Manila')::DATE >= v_first_day_of_month;

    SELECT COUNT(*) INTO v_pending_count
    FROM public.rfq_notification_logs
    WHERE status IN ('pending', 'queued', 'processing', 'retrying');

    SELECT COUNT(*) INTO v_failed_count
    FROM public.rfq_notification_logs
    WHERE status IN ('failed', 'quota_exceeded');

    RETURN jsonb_build_object(
        'today_sent_count', v_today_sent,
        'month_sent_count', v_month_sent,
        'pending_count', v_pending_count,
        'failed_count', v_failed_count,
        'daily_limit', 100,        -- Resend Free daily quota
        'monthly_limit', 3000,     -- Resend Free monthly quota
        'today_date_ph', v_today_date,
        'refreshed_at', TIMEZONE('utc'::text, NOW())
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_notification_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_notification_stats() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 12. HELPER RPC: retry_failed_rfq_notification(p_log_id UUID)
--     Protected: Only authorized active administrators can trigger retries
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.retry_failed_rfq_notification(p_log_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_row public.rfq_notification_logs%ROWTYPE;
BEGIN
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: Must be an authorized administrator.');
    END IF;

    SELECT * INTO v_row
    FROM public.rfq_notification_logs
    WHERE id = p_log_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Notification log not found.');
    END IF;

    UPDATE public.rfq_notification_logs
    SET status = 'pending',
        error_message = NULL,
        attempt_count = 0,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_log_id;

    RETURN jsonb_build_object('success', true, 'log_id', p_log_id, 'new_status', 'pending');
END;
$$;

REVOKE ALL ON FUNCTION public.retry_failed_rfq_notification(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.retry_failed_rfq_notification(UUID) TO authenticated, service_role;

COMMIT;

-- ==============================================================================
-- INSTRUCTIONS FOR CONFIGURING NOTIFY_WEBHOOK_SECRET & AUTOMATIC DISPATCH
-- ==============================================================================
--
-- OPTION A: SUPABASE DATABASE WEBHOOK (RECOMMENDED - ZERO SECRETS IN SQL)
-- ------------------------------------------------------------------------------
-- 1. In Supabase Dashboard, navigate to Database -> Webhooks -> "Create a new webhook".
-- 2. Name: "dispatch-rfq-notifications"
-- 3. Table: "quotation_requests"
-- 4. Events: check [Insert]
-- 5. Type: Supabase Edge Function
-- 6. Function: "notify-rfq"
-- 7. HTTP Headers: Add header "x-webhook-secret" with your secret value.
--
-- OPTION B: SECURE DATABASE STORAGE (USING private.app_secrets)
-- ------------------------------------------------------------------------------
-- Run this in Supabase SQL Editor (replace with your actual project URL and a random secret):
--
-- CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
--
-- INSERT INTO private.app_secrets (key, value) VALUES
--   ('notify_rfq_url', 'https://<your-project-ref>.supabase.co/functions/v1/notify-rfq'),
--   ('notify_webhook_secret', '<your-random-32-char-secret>')
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
--
-- (Note: Ordinary authenticated users cannot read or write to private.app_secrets)
--
-- ==============================================================================
-- VERIFICATION QUERIES (Run these after applying the migration above)
-- ==============================================================================

-- Verification 1: Confirm permissions on privileged functions
SELECT 
    proname, 
    prosecdef,
    proacl
FROM pg_proc 
WHERE proname IN (
    'claim_pending_rfq_notifications', 
    'reserve_email_quota',
    'release_email_quota',
    'check_email_quota',
    'dispatch_rfq_notification_server'
);

-- Verification 2: Check administrator_users RLS policies
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'administrator_users';

-- Verification 3: Confirm tables exist
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name IN ('rfq_notification_logs', 'email_quota_tracking', 'app_secrets');
