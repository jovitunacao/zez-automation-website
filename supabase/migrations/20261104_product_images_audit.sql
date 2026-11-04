-- ==============================================================================
-- ZEZ AUTOMATION CORPORATION - PRODUCT IMAGES AUDIT & ACCURACY MIGRATION
-- Migration Date: 2026-11-04
-- Target Table: public.products
--
-- PURPOSE:
--   1. Replace all generic Unsplash placeholders with exact manufacturer photographs
--      or clean neutral pending SVG placeholders.
--   2. Update main_image and gallery_images for all 46 consignment products strictly by SKU.
--   3. Preserve all product names, SKUs, models, brands, and SRP prices untouched.
--   4. Reviewable, idempotent, and non-destructive script (DO NOT RUN AUTOMATICALLY).
-- ==============================================================================

BEGIN;

-- Product 1: SKU CLA04-UC5E-7035 (manufacturer-matched - Official Linkbasic Manufacturer Asset)
UPDATE public.products
SET main_image = '/catalog/linkbasic-cla04-uc5e.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-cla04-uc5e.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CLA04-UC5E-7035';

-- Product 2: SKU CLA04-UC6-5015 (manufacturer-matched - Official Linkbasic Manufacturer Asset)
UPDATE public.products
SET main_image = '/catalog/linkbasic-cla04-uc6.png',
    gallery_images = ARRAY['/catalog/linkbasic-cla04-uc6.png'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CLA04-UC6-5015';

-- Product 3: SKU FCS11-2-F-LSZH (pending - ZEZ Neutral Cable Placeholder)
UPDATE public.products
SET main_image = '/catalog/cable-pending.svg',
    gallery_images = ARRAY['/catalog/cable-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'FCS11-2-F-LSZH';

-- Product 4: SKU OUS01 (manufacturer-matched - Official Linkbasic Manufacturer Asset)
UPDATE public.products
SET main_image = '/catalog/linkbasic-ous01.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-ous01.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'OUS01';

-- Product 5: SKU OUS02 (pending - ZEZ Neutral Equipment Placeholder)
UPDATE public.products
SET main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'OUS02';

-- Product 6: SKU TSDI-2PBOX-U (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-2pbox-u.jpg',
    gallery_images = ARRAY['/catalog/tsdi-2pbox-u.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-2PBOX-U';

-- Product 7: SKU JKA09-UC5E-A (pending - ZEZ Neutral Keystone Placeholder (Black))
UPDATE public.products
SET main_image = '/catalog/keystone-pending.svg',
    gallery_images = ARRAY['/catalog/keystone-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'JKA09-UC5E-A';

-- Product 8: SKU JKA09-UC5E-B (pending - ZEZ Neutral Keystone Placeholder (Blue))
UPDATE public.products
SET main_image = '/catalog/keystone-pending.svg',
    gallery_images = ARRAY['/catalog/keystone-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'JKA09-UC5E-B';

-- Product 9: SKU JKA09-UC6 (manufacturer-matched - Official Linkbasic Manufacturer Asset (White))
UPDATE public.products
SET main_image = '/catalog/linkbasic-jka09.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-jka09.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'JKA09-UC6';

-- Product 10: SKU JKA09-UC6-A (pending - ZEZ Neutral Keystone Placeholder (Black))
UPDATE public.products
SET main_image = '/catalog/keystone-pending.svg',
    gallery_images = ARRAY['/catalog/keystone-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'JKA09-UC6-A';

-- Product 11: SKU PNA24-KJ (manufacturer-matched - Official Linkbasic Manufacturer Asset)
UPDATE public.products
SET main_image = '/catalog/linkbasic-pna24-kj.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-pna24-kj.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'PNA24-KJ';

-- Product 12: SKU PNA24-UC6 (manufacturer-matched - Official Linkbasic Manufacturer Asset)
UPDATE public.products
SET main_image = '/catalog/linkbasic-pna24-uc6.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-pna24-uc6.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'PNA24-UC6';

-- Product 13: SKU CAA01-UC5E-1-B (manufacturer-matched - Official Linkbasic Manufacturer Asset)
UPDATE public.products
SET main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC5E-1-B';

-- Product 14: SKU CAA01-UC5E-2-B (manufacturer-matched - Official Linkbasic Manufacturer Asset)
UPDATE public.products
SET main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC5E-2-B';

-- Product 15: SKU CAA01-UC5E-3-B (manufacturer-matched - Official Linkbasic Manufacturer Asset)
UPDATE public.products
SET main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC5E-3-B';

-- Product 16: SKU CAA01-UC6-1-B (manufacturer-matched - Official Linkbasic Manufacturer Asset)
UPDATE public.products
SET main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-1-B';

-- Product 17: SKU CAA01-UC6-1-W (pending - ZEZ Neutral Patch Cord Placeholder (White))
UPDATE public.products
SET main_image = '/catalog/patchcord-pending.svg',
    gallery_images = ARRAY['/catalog/patchcord-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-1-W';

-- Product 18: SKU CAA01-UC6-2-B (manufacturer-matched - Official Linkbasic Manufacturer Asset)
UPDATE public.products
SET main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-2-B';

-- Product 19: SKU CAA01-UC6-2-W (pending - ZEZ Neutral Patch Cord Placeholder (White))
UPDATE public.products
SET main_image = '/catalog/patchcord-pending.svg',
    gallery_images = ARRAY['/catalog/patchcord-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-2-W';

-- Product 20: SKU CAA01-UC6-3-B (manufacturer-matched - Official Linkbasic Manufacturer Asset)
UPDATE public.products
SET main_image = '/catalog/linkbasic-caa01-blue.jpg',
    gallery_images = ARRAY['/catalog/linkbasic-caa01-blue.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-3-B';

-- Product 21: SKU CAA01-UC6-3-W (pending - ZEZ Neutral Patch Cord Placeholder (White))
UPDATE public.products
SET main_image = '/catalog/patchcord-pending.svg',
    gallery_images = ARRAY['/catalog/patchcord-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'CAA01-UC6-3-W';

-- Product 22: SKU TSDI-81000-42-LNS (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-81000-42-lns.jpg',
    gallery_images = ARRAY['/catalog/tsdi-81000-42-lns.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-81000-42-LNS';

-- Product 23: SKU TSDI-61100-42-LNS (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-61100-42-lns.jpg',
    gallery_images = ARRAY['/catalog/tsdi-61100-42-lns.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-61100-42-LNS';

-- Product 24: SKU TSDI-6800-28 (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-6800-28.jpg',
    gallery_images = ARRAY['/catalog/tsdi-6800-28.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-6800-28';

-- Product 25: SKU TSDI-WK14 (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-wk14.jpg',
    gallery_images = ARRAY['/catalog/tsdi-wk14.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-WK14';

-- Product 26: SKU TSDI-6600-10U (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-6600-10u.jpg',
    gallery_images = ARRAY['/catalog/tsdi-6600-10u.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-6600-10U';

-- Product 27: SKU TSDI-W647 (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-w647.jpg',
    gallery_images = ARRAY['/catalog/tsdi-w647.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-W647';

-- Product 28: SKU TSDI-PDU6-HOR (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-pdu6-hor.jpg',
    gallery_images = ARRAY['/catalog/tsdi-pdu6-hor.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-PDU6-HOR';

-- Product 29: SKU TSDI-PDU8HOR-SPD (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-pdu8hor-spd.jpg',
    gallery_images = ARRAY['/catalog/tsdi-pdu8hor-spd.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-PDU8HOR-SPD';

-- Product 30: SKU TSDI-HCM1 (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-hcm1.jpg',
    gallery_images = ARRAY['/catalog/tsdi-hcm1.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-HCM1';

-- Product 31: SKU TSDI-5451 (pending - ZEZ Neutral Equipment Placeholder)
UPDATE public.products
SET main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-5451';

-- Product 32: SKU TSDI-FDF-YYY-LC-SM(MM)-WM (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-fdf-yyy-lc-sm-mm--wm.jpg',
    gallery_images = ARRAY['/catalog/tsdi-fdf-yyy-lc-sm-mm--wm.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-FDF-YYY-LC-SM(MM)-WM';

-- Product 33: SKU FFC 55-2-S (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/ffc-55-2-s.jpg',
    gallery_images = ARRAY['/catalog/ffc-55-2-s.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'FFC 55-2-S';

-- Product 34: SKU FFC55-2 (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/ffc55-2.jpg',
    gallery_images = ARRAY['/catalog/ffc55-2.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'FFC55-2';

-- Product 35: SKU FAS50-1-1 (pending - ZEZ Neutral Equipment Placeholder)
UPDATE public.products
SET main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'FAS50-1-1';

-- Product 36: SKU TSDI-FB2P (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-fb2p.jpg',
    gallery_images = ARRAY['/catalog/tsdi-fb2p.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-FB2P';

-- Product 37: SKU TSDI-BLK (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-blk.jpg',
    gallery_images = ARRAY['/catalog/tsdi-blk.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-BLK';

-- Product 38: SKU TSDI-FB1 (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-fb1.jpg',
    gallery_images = ARRAY['/catalog/tsdi-fb1.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-FB1';

-- Product 39: SKU TSDI-FB2 (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-fb2.jpg',
    gallery_images = ARRAY['/catalog/tsdi-fb2.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-FB2';

-- Product 40: SKU TSDI-CAT6-RJ45-EZ (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-cat6-rj45-ez.jpg',
    gallery_images = ARRAY['/catalog/tsdi-cat6-rj45-ez.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-CAT6-RJ45-EZ';

-- Product 41: SKU TSDI-CAT6-EZ-TOOL (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-cat6-ez-tool.jpg',
    gallery_images = ARRAY['/catalog/tsdi-cat6-ez-tool.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-CAT6-EZ-TOOL';

-- Product 42: SKU TSDI-CNM6 (pending - ZEZ Neutral Equipment Placeholder)
UPDATE public.products
SET main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-CNM6';

-- Product 43: SKU TSDI-VELCRO (pending - ZEZ Neutral Equipment Placeholder)
UPDATE public.products
SET main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-VELCRO';

-- Product 44: SKU TSDI-WM100*200-EZ-5 (pending - ZEZ Neutral Equipment Placeholder)
UPDATE public.products
SET main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-WM100*200-EZ-5';

-- Product 45: SKU TSDI-WM100*300-EZ-5 (pending - ZEZ Neutral Equipment Placeholder)
UPDATE public.products
SET main_image = '/catalog/image-pending.svg',
    gallery_images = ARRAY['/catalog/image-pending.svg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-WM100*300-EZ-5';

-- Product 46: SKU TSDI-KK34 (supplier-provided - Supplier Consignment Package)
UPDATE public.products
SET main_image = '/catalog/tsdi-kk34.jpg',
    gallery_images = ARRAY['/catalog/tsdi-kk34.jpg'],
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE sku = 'TSDI-KK34';

COMMIT;
-- ==============================================================================
-- End of Migration 20261104_product_images_audit.sql (46 SKUs processed)
-- ==============================================================================
