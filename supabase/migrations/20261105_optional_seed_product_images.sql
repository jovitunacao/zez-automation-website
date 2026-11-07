-- ==============================================================================
-- ZEZ AUTOMATION CORPORATION - OPTIONAL PRODUCT IMAGES & STATUS SYNC
-- Migration Date: 2026-11-05
-- File: supabase/migrations/20261105_optional_seed_product_images.sql
--
-- PURPOSE:
--   Optional sync script to update the 46 consignment products with their verified
--   intake photography mappings and image_status tags.
--
-- SAFEGUARD NOTE (DO NOT OVERWRITE MANUALLY EDITED DATA):
--   Each UPDATE statement includes a safety condition:
--   AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%')
--   This ensures that any product photograph or metadata that an administrator
--   has already uploaded, edited, or customized in the Admin Dashboard is NOT
--   overwritten!
--
-- DO NOT EXECUTE AUTOMATICALLY. Review in Supabase SQL Editor before applying.
-- ==============================================================================

BEGIN;

-- Product 1/46: CLA04-UC5E-7035 (CAT 5E 4PR UTP Lan Cable, Solid, Gray 305m/re)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-cla04-uc5e.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-cla04-uc5e.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CLA04-UC5E-7035'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 2/46: CLA04-UC6-5015 (CAT6 UTP solid cable, 24AWG, 305M, blue(RAL50)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-cla04-uc6.png',
    gallery_images = ARRAY['/catalog/linkbasic-cla04-uc6.png'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CLA04-UC6-5015'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 3/46: FCS11-2-F-LSZH (Single Mode indoor Drop Cable 2 Core, (3000m/)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/cable-pending.svg',
    gallery_images = ARRAY['/catalog/cable-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'FCS11-2-F-LSZH'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 4/46: OUS01 (US Style Face Plate, 1 Port Non Shuttered, wh)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-ous01.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-ous01.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'OUS01'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 5/46: OUS02 (US Style Face Plate, 2 Ports Non Shuttered, w)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'OUS02'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 6/46: TSDI-2PBOX-U (2 ports wall mount box (can accept 2ports sim)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-2pbox-u.jpg',
    gallery_images = ARRAY['/catalog/tsdi-2pbox-u.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-2PBOX-U'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 7/46: JKA09-UC5E-A (CAT5E UTP Keystone Mod. Jack BLACK 180°)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/keystone-pending.svg',
    gallery_images = ARRAY['/catalog/keystone-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'JKA09-UC5E-A'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 8/46: JKA09-UC5E-B (CAT5E UTP Keystone Mod. Jack BLUE 180°)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/keystone-pending.svg',
    gallery_images = ARRAY['/catalog/keystone-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'JKA09-UC5E-B'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 9/46: JKA09-UC6 (CAT6 UTP Keystone Jack, white, 180 degrees)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-jka09.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-jka09.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'JKA09-UC6'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 10/46: JKA09-UC6-A (CAT6 UTP Keystone Jack, black, 180 degrees)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/keystone-pending.svg',
    gallery_images = ARRAY['/catalog/keystone-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'JKA09-UC6-A'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 11/46: PNA24-KJ (Empty 24 Ports Patch Panel)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-pna24-kj.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-pna24-kj.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'PNA24-KJ'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 12/46: PNA24-UC6 (CAT6 24 Ports Patch Panel, Jack Style (loaded)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-pna24-uc6.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-pna24-uc6.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'PNA24-UC6'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 13/46: CAA01-UC5E-1-B (CAT5E Patch Cord 1 meter, Blue)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC5E-1-B'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 14/46: CAA01-UC5E-2-B (CAT5E Patch Cord 2 meter, Blue)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC5E-2-B'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 15/46: CAA01-UC5E-3-B (CAT5E Patch Cord 3 meter, Blue)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC5E-3-B'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 16/46: CAA01-UC6-1-B (CAT6 Patch Cord 1 meter, Blue)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-1-B'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 17/46: CAA01-UC6-1-W (CAT6 UTP Patch Cord 1 meter, WHITE)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/patchcord-pending.svg',
    gallery_images = ARRAY['/catalog/patchcord-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-1-W'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 18/46: CAA01-UC6-2-B (CAT6 UTP Patch Cord 2 meters, Blue)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-2-B'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 19/46: CAA01-UC6-2-W (CAT6 UTPPatch Cord 2 meters, WHITE)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/patchcord-pending.svg',
    gallery_images = ARRAY['/catalog/patchcord-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-2-W'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 20/46: CAA01-UC6-3-B (CAT6 Patch Cord 3 meters, Blue)
UPDATE public.products
SET image_status = 'manufacturer-matched',
    main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-3-B'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 21/46: CAA01-UC6-3-W (CAT6 UTP Patch Cord 3 meters, WHITE)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/patchcord-pending.svg',
    gallery_images = ARRAY['/catalog/patchcord-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-3-W'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 22/46: TSDI-81000-42-LNS (W=800 x D=1000 x H=42RU DATA CABINET; FRONT P)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-81000-42-lns.jpg',
    gallery_images = ARRAY['/catalog/tsdi-81000-42-lns.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-81000-42-LNS'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 23/46: TSDI-61100-42-LNS (LNS series network cabinet(W600 X D1100 X H42)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-61100-42-lns.jpg',
    gallery_images = ARRAY['/catalog/tsdi-61100-42-lns.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-61100-42-LNS'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 24/46: TSDI-6800-28 (FREE STANDING CABINET Cabinet (28U), W=600mm,)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-6800-28.jpg',
    gallery_images = ARRAY['/catalog/tsdi-6800-28.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-6800-28'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 25/46: TSDI-WK14 (W-600mm, D-600mm, H-730mm,(14U) CLEAR Glass f)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-wk14.jpg',
    gallery_images = ARRAY['/catalog/tsdi-wk14.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-WK14'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 26/46: TSDI-6600-10U (LNS (W600 X D600 X H10U) Knock down construct)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-6600-10u.jpg',
    gallery_images = ARRAY['/catalog/tsdi-6600-10u.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-6600-10U'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 27/46: TSDI-W647 (W-600mm, D-400mm, H-420mm, (7U) Wall cabinet,)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-w647.jpg',
    gallery_images = ARRAY['/catalog/tsdi-w647.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-W647'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 28/46: TSDI-PDU6-HOR (6 Ports Universal Outlet, HORIZONTAL PDU, 220)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-pdu6-hor.jpg',
    gallery_images = ARRAY['/catalog/tsdi-pdu6-hor.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-PDU6-HOR'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 29/46: TSDI-PDU8HOR-SPD (Horizontal Universal PDU 8 way w/ 3 prong inp)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-pdu8hor-spd.jpg',
    gallery_images = ARRAY['/catalog/tsdi-pdu8hor-spd.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-PDU8HOR-SPD'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 30/46: TSDI-HCM1 (1RU Horizontal Cable Manager FRONT ONLY with )
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-hcm1.jpg',
    gallery_images = ARRAY['/catalog/tsdi-hcm1.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-HCM1'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 31/46: TSDI-5451 (CANTELIVER TRAY FOR 2 POST/4 POST OPEN BAY RA)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-5451'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 32/46: TSDI-FDF-YYY-LC-SM(MM)-WM (MINI WALL MOUNT FDF FIBER BOX (EMPTY) (Can ac)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-fdf-yyy-lc-sm-mm--wm.jpg',
    gallery_images = ARRAY['/catalog/tsdi-fdf-yyy-lc-sm-mm--wm.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-FDF-YYY-LC-SM(MM)-WM'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 33/46: FFC 55-2-S (LC adapter SM Duplex)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/ffc-55-2-s.jpg',
    gallery_images = ARRAY['/catalog/ffc-55-2-s.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'FFC 55-2-S'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 34/46: FFC55-2 (LC adapter duplex OM3)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/ffc55-2.jpg',
    gallery_images = ARRAY['/catalog/ffc55-2.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'FFC55-2'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 35/46: FAS50-1-1 (SM LC pigtail ( simplex), 1meter)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'FAS50-1-1'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 36/46: TSDI-FB2P ((empty) Data Pop up floor socket (W: 101mm, D)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-fb2p.jpg',
    gallery_images = ARRAY['/catalog/tsdi-fb2p.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-FB2P'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 37/46: TSDI-BLK (Blank insert for Pop Up)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-blk.jpg',
    gallery_images = ARRAY['/catalog/tsdi-blk.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-BLK'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 38/46: TSDI-FB1 (1port insert for Pop Up (only accept keystone)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-fb1.jpg',
    gallery_images = ARRAY['/catalog/tsdi-fb1.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-FB1'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 39/46: TSDI-FB2 (2portS insert for Pop Up (only accept keyston)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-fb2.jpg',
    gallery_images = ARRAY['/catalog/tsdi-fb2.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-FB2'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 40/46: TSDI-CAT6-RJ45-EZ (Cat6 EZ RJ45 connector (Pass thru)w/ boots, w)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-cat6-rj45-ez.jpg',
    gallery_images = ARRAY['/catalog/tsdi-cat6-rj45-ez.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-CAT6-RJ45-EZ'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 41/46: TSDI-CAT6-EZ-TOOL (EZ RJ45 crimping tool)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-cat6-ez-tool.jpg',
    gallery_images = ARRAY['/catalog/tsdi-cat6-ez-tool.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-CAT6-EZ-TOOL'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 42/46: TSDI-CNM6 (Cage Nut M6)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-CNM6'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 43/46: TSDI-VELCRO (VELCRO TIES W-20MM, /MTR)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-VELCRO'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 44/46: TSDI-WM100*200-EZ-5 (Environmentally Friendly Electro-Galvanized C)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-WM100*200-EZ-5'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 45/46: TSDI-WM100*300-EZ-5 (Environmentally Friendly Electro-Galvanized C)
UPDATE public.products
SET image_status = 'pending',
    main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-WM100*300-EZ-5'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

-- Product 46/46: TSDI-KK34 (Wire mesh connector/coupler)
UPDATE public.products
SET image_status = 'supplier-provided',
    main_image = '/catalog/tsdi-kk34.jpg',
    gallery_images = ARRAY['/catalog/tsdi-kk34.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-KK34'
  AND (image_status IS NULL OR image_status = 'pending' OR main_image LIKE '%unsplash%' OR main_image LIKE '%placeholder%');

COMMIT;

-- Verification: Check image status breakdown across products table
SELECT 
  image_status, 
  COUNT(*) AS product_count 
FROM public.products 
GROUP BY image_status 
ORDER BY product_count DESC;
