-- ==============================================================================
-- ZEZ AUTOMATION CORPORATION - STORAGE-ONLY SETUP MIGRATION
-- Migration Date: 2026-11-05
-- File: supabase/migrations/20261105_storage_setup.sql
--
-- PURPOSE:
--   1. Create and configure dedicated 'product-images' Supabase Storage bucket.
--   2. Restrict allowed MIME types strictly to JPG, PNG, and WebP.
--   3. Enforce 10 MB maximum file size limit (10485760 bytes).
--   4. Allow public read access so customers and visitors can view product photos.
--   5. Restrict upload (INSERT), replace (UPDATE), and remove (DELETE) actions
--      exclusively to authenticated, active administrators via public.is_admin().
--   6. Ensure 'image_status' column exists on public.products (without touching data).
--   7. Zero modifications to existing product records or manually edited catalog data.
--
-- DO NOT EXECUTE AUTOMATICALLY. Review in Supabase SQL Editor before applying.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. ENSURE 'image_status' COLUMN EXISTS ON public.products (Idempotent Schema Check)
-- ------------------------------------------------------------------------------
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_status VARCHAR(50) DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'products_image_status_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
    ADD CONSTRAINT products_image_status_check
    CHECK (image_status IN ('supplier-provided', 'manufacturer-matched', 'pending', 'illustrative'));
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. CREATE / UPDATE 'product-images' STORAGE BUCKET
--    Strictly JPG, PNG, WebP with 10 MB max size and public read enabled
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types
)
VALUES (
  'product-images',
  'product-images',
  true,                  -- Public read access for storefront customers
  10485760,              -- 10 MB limit (10 * 1024 * 1024 bytes)
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- ------------------------------------------------------------------------------
-- 3. STORAGE ROW LEVEL SECURITY (RLS) POLICIES
--    Enable RLS on storage.objects to protect bucket contents
-- ------------------------------------------------------------------------------
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3.1 Public Read Access (Storefront Visitors, Customers, Quotation Inquiries)
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 3.2 Administrator Upload Policy (Authenticated, Active Admins Only)
DROP POLICY IF EXISTS "Active admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated admins to upload product images" ON storage.objects;
CREATE POLICY "Active admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.is_admin()
);

-- 3.3 Administrator Update / Replace Policy (Authenticated, Active Admins Only)
DROP POLICY IF EXISTS "Active admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated admins to update product images" ON storage.objects;
CREATE POLICY "Active admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'product-images'
  AND public.is_admin()
);

-- 3.4 Administrator Delete Policy (Authenticated, Active Admins Only)
DROP POLICY IF EXISTS "Active admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated admins to delete product images" ON storage.objects;
CREATE POLICY "Active admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.is_admin()
);

COMMIT;

-- ==============================================================================
-- VERIFICATION QUERIES (Run these after executing the migration above)
-- ==============================================================================

-- Verification 1: Confirm product-images bucket exists with 10MB limit and JPG/PNG/WebP types
SELECT 
  id, 
  name, 
  public, 
  file_size_limit AS max_bytes_limit,
  ROUND(file_size_limit / 1048576.0, 1) AS max_mb_limit,
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'product-images';

-- Verification 2: Confirm the 4 storage RLS policies protecting product-images
SELECT 
  policyname, 
  cmd AS operation, 
  roles,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%product images%'
ORDER BY cmd;

-- Verification 3: Confirm public.products table has image_status column
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'products' 
  AND column_name = 'image_status';
