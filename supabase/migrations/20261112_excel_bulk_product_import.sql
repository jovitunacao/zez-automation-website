-- ==============================================================================
-- ZEZ AUTOMATION CORPORATION - ADDITIVE MIGRATION: EXCEL BULK PRODUCT IMPORT
-- Migration Date: 2026-11-12
-- File: supabase/migrations/20261112_excel_bulk_product_import.sql
--
-- PURPOSE:
--   1. Ensures 'price_display_mode' and 'sales_unit' exist on public.products table.
--   2. Ensures unique index on public.products(sku) for idempotent bulk upsert operations.
--   3. Creates dedicated 'product_import_audit_logs' table for recording administrator
--      bulk import actions, row counts, filename, and execution summary.
--   4. RLS: Restricts import audit logs access strictly to authenticated administrators.
--
-- IMPORTANT:
--   DO NOT EXECUTE AUTOMATICALLY IN PRODUCTION.
--   Review in Supabase SQL Editor prior to manual deployment.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. ADDITIVE COLUMNS ON public.products (Idempotent)
-- ------------------------------------------------------------------------------
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS price_display_mode VARCHAR(20) DEFAULT 'hidden' NOT NULL;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sales_unit VARCHAR(50) DEFAULT 'unit' NOT NULL;

-- Ensure check constraint for price_display_mode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'products_price_display_mode_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
    ADD CONSTRAINT products_price_display_mode_check
    CHECK (price_display_mode IN ('hidden', 'public', 'starting'));
  END IF;
END $$;

-- Ensure unique index on products(sku) for atomic upsert resolution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'products'
      AND indexname = 'products_sku_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX products_sku_unique_idx ON public.products (LOWER(TRIM(sku)));
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. CREATE public.product_import_audit_logs TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_import_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_email VARCHAR(255) NOT NULL,
    admin_role VARCHAR(50) DEFAULT 'admin',
    filename VARCHAR(255) NOT NULL,
    import_mode VARCHAR(50) NOT NULL CHECK (import_mode IN ('upsert', 'create_only', 'update_only', 'skip_duplicates')),
    total_rows INTEGER NOT NULL DEFAULT 0,
    created_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    error_summary JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for administrative query performance
CREATE INDEX IF NOT EXISTS idx_import_audit_logs_created_at 
ON public.product_import_audit_logs (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.product_import_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated administrators can read import audit logs
CREATE POLICY "Admins can view product import audit logs"
ON public.product_import_audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Policy: Authenticated administrators can insert import audit logs
CREATE POLICY "Admins can insert product import audit logs"
ON public.product_import_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

COMMIT;
