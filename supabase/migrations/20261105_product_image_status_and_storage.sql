-- ==============================================================================
-- ZEZ AUTOMATION CORPORATION - SUPABASE DATABASE MIGRATION
-- Migration Date: 2026-11-05
-- File: supabase/migrations/20261105_product_image_status_and_storage.sql
--
-- PURPOSE:
--   1. Add 'image_status' column to public.products if it does not already exist.
--   2. Restrict image_status to valid values: ('supplier-provided', 'manufacturer-matched', 'pending', 'illustrative').
--   3. Configure dedicated Supabase Storage bucket ('product-images') with secure RLS policies.
--   4. Update image_status, main_image, and gallery_images for all 46 consignment products.
--   5. Preserve all 46 products, SRP prices, SKUs, and quotation requests safely.
--   6. Fully idempotent and safe to rerun without duplicating or deleting records.
--   7. Provide verification queries at the end for immediate DBA review.
--
-- NOTE: DO NOT EXECUTE AUTOMATICALLY. Review in Supabase SQL Editor before applying.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. ADD 'image_status' COLUMN TO public.products (Idempotent)
-- ------------------------------------------------------------------------------
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_status VARCHAR(50) DEFAULT 'pending';

-- ------------------------------------------------------------------------------
-- 2. ENFORCE VALID VALUES VIA CHECK CONSTRAINT (Idempotent)
-- ------------------------------------------------------------------------------
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
-- 3. CONFIGURE DEDICATED SUPABASE STORAGE BUCKET: 'product-images'
-- ------------------------------------------------------------------------------
-- Ensure product-images storage bucket exists with 10MB file size limit and image MIME restrictions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/avif'];

-- Storage RLS: Public read access for product images
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Storage RLS: Admin-only upload, update, and deletion (restricted via public.is_admin())
DROP POLICY IF EXISTS "Admins manage product images storage" ON storage.objects;
CREATE POLICY "Admins manage product images storage"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin())
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. UPDATE ALL 46 CONSIGNMENT PRODUCTS BY SKU (Non-destructive & Idempotent)
-- ------------------------------------------------------------------------------
-- SKU 1/46: CLA04-UC5E-7035 [manufacturer-matched] - Official Linkbasic Manufacturer Asset
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-cla04-uc5e.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-cla04-uc5e.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CLA04-UC5E-7035';

-- SKU 2/46: CLA04-UC6-5015 [manufacturer-matched] - Official Linkbasic Manufacturer Asset
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-cla04-uc6.png',
    gallery_images = ARRAY['/catalog/linkbasic-cla04-uc6.png'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CLA04-UC6-5015';

-- SKU 3/46: FCS11-2-F-LSZH [pending] - ZEZ Neutral Cable Spool Placeholder
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/cable-pending.svg',
    gallery_images = ARRAY['/catalog/cable-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'FCS11-2-F-LSZH';

-- SKU 4/46: OUS01 [manufacturer-matched] - Official Linkbasic Manufacturer Asset (1-Port White)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-ous01.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-ous01.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'OUS01';

-- SKU 5/46: OUS02 [pending] - ZEZ Neutral Equipment Placeholder (2-Port White)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'OUS02';

-- SKU 6/46: TSDI-2PBOX-U [supplier-provided] - Supplier Consignment Intake Asset
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-2pbox-u.jpg',
    gallery_images = ARRAY['/catalog/tsdi-2pbox-u.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-2PBOX-U';

-- SKU 7/46: JKA09-UC5E-A [pending] - ZEZ Neutral Keystone Placeholder (Black)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/keystone-pending.svg',
    gallery_images = ARRAY['/catalog/keystone-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'JKA09-UC5E-A';

-- SKU 8/46: JKA09-UC5E-B [pending] - ZEZ Neutral Keystone Placeholder (Blue)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/keystone-pending.svg',
    gallery_images = ARRAY['/catalog/keystone-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'JKA09-UC5E-B';

-- SKU 9/46: JKA09-UC6 [manufacturer-matched] - Official Linkbasic Manufacturer Asset (White 180°)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-jka09.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-jka09.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'JKA09-UC6';

-- SKU 10/46: JKA09-UC6-A [pending] - ZEZ Neutral Keystone Placeholder (Black)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/keystone-pending.svg',
    gallery_images = ARRAY['/catalog/keystone-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'JKA09-UC6-A';

-- SKU 11/46: PNA24-KJ [manufacturer-matched] - Official Linkbasic Manufacturer Asset (24P Unloaded)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-pna24-kj.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-pna24-kj.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'PNA24-KJ';

-- SKU 12/46: PNA24-UC6 [manufacturer-matched] - Official Linkbasic Manufacturer Asset (24P Loaded)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-pna24-uc6.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-pna24-uc6.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'PNA24-UC6';

-- SKU 13/46: CAA01-UC5E-1-B [manufacturer-matched] - Official Linkbasic Manufacturer Asset (1m Blue)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC5E-1-B';

-- SKU 14/46: CAA01-UC5E-2-B [manufacturer-matched] - Official Linkbasic Manufacturer Asset (2m Blue)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC5E-2-B';

-- SKU 15/46: CAA01-UC5E-3-B [manufacturer-matched] - Official Linkbasic Manufacturer Asset (3m Blue)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC5E-3-B';

-- SKU 16/46: CAA01-UC6-1-B [manufacturer-matched] - Official Linkbasic Manufacturer Asset (1m Blue)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-1-B';

-- SKU 17/46: CAA01-UC6-1-W [pending] - ZEZ Neutral Patch Cord Placeholder (1m White)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/patchcord-pending.svg',
    gallery_images = ARRAY['/catalog/patchcord-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-1-W';

-- SKU 18/46: CAA01-UC6-2-B [manufacturer-matched] - Official Linkbasic Manufacturer Asset (2m Blue)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-2-B';

-- SKU 19/46: CAA01-UC6-2-W [pending] - ZEZ Neutral Patch Cord Placeholder (2m White)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/patchcord-pending.svg',
    gallery_images = ARRAY['/catalog/patchcord-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-2-W';

-- SKU 20/46: CAA01-UC6-3-B [manufacturer-matched] - Official Linkbasic Manufacturer Asset (3m Blue)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-3-B';

-- SKU 21/46: CAA01-UC6-3-W [pending] - ZEZ Neutral Patch Cord Placeholder (3m White)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/patchcord-pending.svg',
    gallery_images = ARRAY['/catalog/patchcord-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-3-W';

-- SKU 22/46: TSDI-81000-42-LNS [supplier-provided] - Supplier Consignment Intake Asset (42RU 800x1000)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-81000-42-lns.jpg',
    gallery_images = ARRAY['/catalog/tsdi-81000-42-lns.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-81000-42-LNS';

-- SKU 23/46: TSDI-61100-42-LNS [supplier-provided] - Supplier Consignment Intake Asset (42RU 600x1100)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-61100-42-lns.jpg',
    gallery_images = ARRAY['/catalog/tsdi-61100-42-lns.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-61100-42-LNS';

-- SKU 24/46: TSDI-6800-28 [supplier-provided] - Supplier Consignment Intake Asset (28RU 600x800)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-6800-28.jpg',
    gallery_images = ARRAY['/catalog/tsdi-6800-28.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-6800-28';

-- SKU 25/46: TSDI-WK14 [supplier-provided] - Supplier Consignment Intake Asset (14RU Wall)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-wk14.jpg',
    gallery_images = ARRAY['/catalog/tsdi-wk14.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-WK14';

-- SKU 26/46: TSDI-6600-10U [supplier-provided] - Supplier Consignment Intake Asset (10RU Knock Down)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-6600-10u.jpg',
    gallery_images = ARRAY['/catalog/tsdi-6600-10u.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-6600-10U';

-- SKU 27/46: TSDI-W647 [supplier-provided] - Supplier Consignment Intake Asset (7RU Wall)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-w647.jpg',
    gallery_images = ARRAY['/catalog/tsdi-w647.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-W647';

-- SKU 28/46: TSDI-PDU6-HOR [supplier-provided] - Supplier Consignment Intake Asset (6-Port PDU)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-pdu6-hor.jpg',
    gallery_images = ARRAY['/catalog/tsdi-pdu6-hor.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-PDU6-HOR';

-- SKU 29/46: TSDI-PDU8HOR-SPD [supplier-provided] - Supplier Consignment Intake Asset (8-Port PDU Surge)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-pdu8hor-spd.jpg',
    gallery_images = ARRAY['/catalog/tsdi-pdu8hor-spd.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-PDU8HOR-SPD';

-- SKU 30/46: TSDI-HCM1 [supplier-provided] - Supplier Consignment Intake Asset (1RU Cable Manager)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-hcm1.jpg',
    gallery_images = ARRAY['/catalog/tsdi-hcm1.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-HCM1';

-- SKU 31/46: TSDI-5451 [pending] - ZEZ Neutral Equipment Placeholder (Cantilever 1RU)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-5451';

-- SKU 32/46: TSDI-FDF-YYY-LC-SM(MM)-WM [supplier-provided] - Supplier Consignment Intake Asset (Mini FDF)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-fdf-yyy-lc-sm-mm--wm.jpg',
    gallery_images = ARRAY['/catalog/tsdi-fdf-yyy-lc-sm-mm--wm.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-FDF-YYY-LC-SM(MM)-WM';

-- SKU 33/46: FFC 55-2-S [supplier-provided] - Supplier Consignment Intake Asset (LC SM Duplex)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/ffc-55-2-s.jpg',
    gallery_images = ARRAY['/catalog/ffc-55-2-s.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'FFC 55-2-S';

-- SKU 34/46: FFC55-2 [supplier-provided] - Supplier Consignment Intake Asset (LC OM3 Duplex)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/ffc55-2.jpg',
    gallery_images = ARRAY['/catalog/ffc55-2.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'FFC55-2';

-- SKU 35/46: FAS50-1-1 [pending] - ZEZ Neutral Equipment Placeholder (LC SM Pigtail 1m)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'FAS50-1-1';

-- SKU 36/46: TSDI-FB2P [supplier-provided] - Supplier Consignment Intake Asset (2-Port Fiber Box)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-fb2p.jpg',
    gallery_images = ARRAY['/catalog/tsdi-fb2p.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-FB2P';

-- SKU 37/46: TSDI-BLK [supplier-provided] - Supplier Consignment Intake Asset (Blank Panel)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-blk.jpg',
    gallery_images = ARRAY['/catalog/tsdi-blk.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-BLK';

-- SKU 38/46: TSDI-FB1 [supplier-provided] - Supplier Consignment Intake Asset (1-Port Fiber Box)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-fb1.jpg',
    gallery_images = ARRAY['/catalog/tsdi-fb1.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-FB1';

-- SKU 39/46: TSDI-FB2 [supplier-provided] - Supplier Consignment Intake Asset (2-Port Fiber Box)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-fb2.jpg',
    gallery_images = ARRAY['/catalog/tsdi-fb2.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-FB2';

-- SKU 40/46: TSDI-CAT6-RJ45-EZ [supplier-provided] - Supplier Consignment Intake Asset (Cat6 EZ RJ45)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-cat6-rj45-ez.jpg',
    gallery_images = ARRAY['/catalog/tsdi-cat6-rj45-ez.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-CAT6-RJ45-EZ';

-- SKU 41/46: TSDI-CAT6-EZ-TOOL [supplier-provided] - Supplier Consignment Intake Asset (EZ Crimping Tool)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-cat6-ez-tool.jpg',
    gallery_images = ARRAY['/catalog/tsdi-cat6-ez-tool.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-CAT6-EZ-TOOL';

-- SKU 42/46: TSDI-CNM6 [pending] - ZEZ Neutral Equipment Placeholder (M6 Cage Nuts)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-CNM6';

-- SKU 43/46: TSDI-VELCRO [pending] - ZEZ Neutral Equipment Placeholder (Velcro 20mmx5m)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-VELCRO';

-- SKU 44/46: TSDI-WM100*200-EZ-5 [pending] - ZEZ Neutral Equipment Placeholder (Mesh Tray 100x200)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-WM100*200-EZ-5';

-- SKU 45/46: TSDI-WM100*300-EZ-5 [pending] - ZEZ Neutral Equipment Placeholder (Mesh Tray 100x300)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-WM100*300-EZ-5';

-- SKU 46/46: TSDI-KK34 [supplier-provided] - Supplier Consignment Intake Asset (Fiber Joint Box)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-kk34.jpg',
    gallery_images = ARRAY['/catalog/tsdi-kk34.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-KK34';

COMMIT;

-- ==============================================================================
-- 5. VERIFICATION QUERIES (Run these queries to verify migration results)
-- ==============================================================================

-- Verification Query 1: Total products count and image status breakdown
-- Expected result:
--   supplier-provided    : 20
--   pending              : 14
--   manufacturer-matched : 12
--   Total                : 46 (or 46 + any admin-created items)
SELECT 
  image_status,
  COUNT(*) AS product_count
FROM public.products
GROUP BY image_status
ORDER BY product_count DESC;

-- Verification Query 2: Verify all 46 consignment SKUs have their assigned status and image
SELECT 
  sku, 
  brand, 
  name, 
  image_status, 
  main_image,
  price_php
FROM public.products
ORDER BY 
  CASE image_status
    WHEN 'supplier-provided' THEN 1
    WHEN 'manufacturer-matched' THEN 2
    WHEN 'pending' THEN 3
    ELSE 4
  END,
  sku;

-- Verification Query 3: Confirm storage bucket configuration
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'product-images';

-- Verification Query 4: Confirm storage RLS policies
SELECT 
  policyname, 
  cmd, 
  roles 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%product images%';
