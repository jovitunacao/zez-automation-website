-- ==============================================================================
-- ZEZ AUTOMATION CORPORATION - COMPLETE SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- ICT Equipment & Technology Supplies Distributor (Pasig City, Metro Manila)
--
-- Compatibility: Supabase SQL Editor / PostgreSQL 15+
-- Features:
--   1. Categories & Subcategories
--   2. Manufacturers & Brands
--   3. Products, SKUs, Structured JSONB Specs, Pricing, & Stock Availability
--   4. Customer Profiles (linked to auth.users)
--   5. Administrator Accounts & RBAC helper (is_admin())
--   6. Quotation Requests (RFQ) & Itemized Lines
--   7. General Presales Inquiries & Contact Forms
--   8. Site Settings & Company Contact Information
--   9. Supabase Storage Buckets (product-images & product-datasheets)
--  10. Row Level Security (RLS) Policies protecting customer privacy
--  11. Complete Seed Data for 12 Categories, Brands, and Initial Products
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ADMINISTRATOR ACCOUNTS & RBAC (Role-Based Access Control)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.administrator_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'sales_engineer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Security definer function to verify if current session is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.administrator_users 
        WHERE id = auth.uid() 
          AND is_active = true
    );
$$;

-- ------------------------------------------------------------------------------
-- 2. CUSTOMER PROFILES (Registered Corporate Procurement Officers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(100) NOT NULL,
    delivery_city_province VARCHAR(255) DEFAULT 'Metro Manila',
    delivery_address TEXT,
    tin_number VARCHAR(100),
    customer_type VARCHAR(100) DEFAULT 'Company',
    preferred_contact_method VARCHAR(50) DEFAULT 'Email',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. PRODUCT CATEGORIES & SUBCATEGORIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id VARCHAR(100) PRIMARY KEY, -- slug style identifier e.g. 'networking-equipment'
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    item_count INTEGER DEFAULT 0,
    image_url TEXT,
    icon_name VARCHAR(100),
    subcategories TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. ICT MANUFACTURERS & BRANDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brands (
    id VARCHAR(100) PRIMARY KEY, -- slug identifier e.g. 'cisco'
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    origin_country VARCHAR(100),
    description TEXT,
    product_count INTEGER DEFAULT 0,
    website TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. PRODUCTS & TECHNICAL SPECIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'prod-01' or UUID
    sku VARCHAR(100) NOT NULL UNIQUE,
    model VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    category_id VARCHAR(100) REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name VARCHAR(255) NOT NULL,
    short_description TEXT,
    full_description TEXT,
    price_php NUMERIC(12, 2), -- Distributor sample/reference price
    is_price_negotiable BOOLEAN DEFAULT true,
    stock_status VARCHAR(50) DEFAULT 'In Stock' NOT NULL CHECK (
        stock_status IN ('In Stock', 'Pre-Order (5-7 Days)', 'Low Stock', 'Contact for Availability')
    ),
    lead_time_days INTEGER DEFAULT 1,
    warranty VARCHAR(255) DEFAULT '1-Year Warranty',
    is_featured BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    is_demo BOOLEAN DEFAULT false,
    image_status VARCHAR(50) DEFAULT 'pending' CHECK (
        image_status IN ('supplier-provided', 'manufacturer-matched', 'pending', 'illustrative')
    ),
    main_image TEXT NOT NULL,
    gallery_images TEXT[] DEFAULT '{}',
    key_specs TEXT[] DEFAULT '{}',
    specifications JSONB DEFAULT '[]'::jsonb, -- structured category specifications
    included_accessories TEXT[] DEFAULT '{}',
    datasheet_url TEXT,
    datasheet_file_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. QUOTATION REQUESTS (RFQs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotation_requests (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'ZEZ-RFQ-2026-9041'
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous/guest corporate requests
    status VARCHAR(50) DEFAULT 'New' NOT NULL CHECK (
        status IN ('New', 'Under Review', 'Quotation Prepared', 'Quotation Sent', 'Accepted', 'Declined', 'Closed')
    ),
    customer_full_name VARCHAR(255) NOT NULL,
    customer_company_name VARCHAR(255),
    customer_email VARCHAR(255) NOT NULL,
    customer_mobile_number VARCHAR(100) NOT NULL,
    delivery_city_province VARCHAR(255) NOT NULL,
    delivery_address TEXT,
    tin_number VARCHAR(100),
    customer_type VARCHAR(100) DEFAULT 'Company',
    preferred_contact_method VARCHAR(50) DEFAULT 'Email',
    target_delivery_date DATE,
    additional_requirements TEXT,
    total_estimated_php NUMERIC(14, 2),
    is_demo BOOLEAN DEFAULT false,
    admin_notes TEXT,
    assigned_specialist VARCHAR(255) DEFAULT 'Marco Rivera (Enterprise Account Manager)',
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 7. QUOTATION LINE ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_request_id VARCHAR(100) NOT NULL REFERENCES public.quotation_requests(id) ON DELETE CASCADE,
    product_id VARCHAR(100) REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    main_image TEXT,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit_price_php NUMERIC(12, 2),
    subtotal_php NUMERIC(14, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 8. CUSTOMER CONTACT INQUIRIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100) NOT NULL,
    department VARCHAR(150) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Resolved', 'Archived')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 9. SITE SETTINGS & HOTLINES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'current',
    company_name VARCHAR(255) DEFAULT 'ZEZ Automation Corporation',
    tagline VARCHAR(255) DEFAULT 'Powering Business Through Technology',
    phone_primary VARCHAR(100) DEFAULT '(02) 8800-9390',
    phone_secondary VARCHAR(100) DEFAULT '+63 917 800 9390',
    mobile_viber VARCHAR(100) DEFAULT '+63 917 800 9390',
    email_sales VARCHAR(255) DEFAULT 'sales@zezautomation.ph',
    email_support VARCHAR(255) DEFAULT 'support@zezautomation.ph',
    office_address TEXT DEFAULT 'Unit 1402, Corporate Center, Emerald Avenue, Ortigas Center, Pasig City, Metro Manila 1605 Philippines',
    operating_hours VARCHAR(255) DEFAULT 'Mon - Fri: 8:30 AM - 5:30 PM (PST)',
    banner_announcement TEXT DEFAULT 'Direct Corporate ICT Procurement & Project Pricing Available for Q4 2026. Submit your RFQ today.',
    is_banner_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 10. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(is_published);
CREATE INDEX IF NOT EXISTS idx_quotations_email ON public.quotation_requests(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotations_user ON public.quotation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotation_requests(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created ON public.quotation_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotation_items_rfq ON public.quotation_items(quotation_request_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_created ON public.customer_inquiries(created_at DESC);

-- ------------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.administrator_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 11.1 Administrator Users Policy
DROP POLICY IF EXISTS "Admins can view and manage admin users" ON public.administrator_users;
CREATE POLICY "Admins can view and manage admin users" 
ON public.administrator_users 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- 11.2 Customer Profiles Policy
-- Customers can view & edit their own profile; admins can view all profiles
DROP POLICY IF EXISTS "Users view own profile" ON public.customer_profiles;
CREATE POLICY "Users view own profile" 
ON public.customer_profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own profile" ON public.customer_profiles;
CREATE POLICY "Users update own profile" 
ON public.customer_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.customer_profiles;
CREATE POLICY "Users insert own profile" 
ON public.customer_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 11.3 Public Catalog (Categories, Brands, Products, Site Settings)
-- Public read access for active published items
DROP POLICY IF EXISTS "Public read published categories" ON public.categories;
CREATE POLICY "Public read published categories" 
ON public.categories 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Public read published brands" ON public.brands;
CREATE POLICY "Public read published brands" 
ON public.brands 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Public read published products" ON public.products;
CREATE POLICY "Public read published products" 
ON public.products 
FOR SELECT 
USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Public read site settings" ON public.site_settings;
CREATE POLICY "Public read site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Product and Catalog mutations restricted exclusively to authenticated administrators
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" 
ON public.categories 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage brands" ON public.brands;
CREATE POLICY "Admins manage brands" 
ON public.brands 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products" 
ON public.products 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings" 
ON public.site_settings 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- 11.4 Quotation Requests (RFQs) Security
-- Direct table INSERT is strictly limited to authenticated administrators.
-- Anonymous visitors and procurement customers MUST submit RFQs via submit_quotation_request().
DROP POLICY IF EXISTS "Anyone can submit RFQ" ON public.quotation_requests;
DROP POLICY IF EXISTS "Admins insert quotation requests" ON public.quotation_requests;
CREATE POLICY "Admins insert quotation requests" 
ON public.quotation_requests 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

-- Customers can view only their own RFQs (matched by user_id or verified JWT email); Admins view all
DROP POLICY IF EXISTS "Customers view own RFQs or Admins view all" ON public.quotation_requests;
CREATE POLICY "Customers view own RFQs or Admins view all" 
ON public.quotation_requests 
FOR SELECT 
USING (
    public.is_admin() 
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.jwt() ->> 'email' IS NOT NULL AND customer_email = auth.jwt() ->> 'email')
);

-- Only authenticated administrators can edit quotation statuses, specialist assignment, or notes
DROP POLICY IF EXISTS "Admins update RFQs" ON public.quotation_requests;
CREATE POLICY "Admins update RFQs" 
ON public.quotation_requests 
FOR UPDATE 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete RFQs" ON public.quotation_requests;
CREATE POLICY "Admins delete RFQs" 
ON public.quotation_requests 
FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- 11.5 Quotation Line Items Security
-- Direct table INSERT is strictly limited to authenticated administrators.
-- Line items for public RFQs are inserted exclusively within submit_quotation_request().
-- This prevents malicious actors from inserting orphaned items or corrupting unrelated RFQs.
DROP POLICY IF EXISTS "Anyone can insert quotation items" ON public.quotation_items;
DROP POLICY IF EXISTS "Admins insert quotation items" ON public.quotation_items;
CREATE POLICY "Admins insert quotation items" 
ON public.quotation_items 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

-- Line items readable only if user has verified access to the parent quotation request
DROP POLICY IF EXISTS "Read quotation items if can read quotation request" ON public.quotation_items;
CREATE POLICY "Read quotation items if can read quotation request" 
ON public.quotation_items 
FOR SELECT 
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.quotation_requests qr
        WHERE qr.id = quotation_items.quotation_request_id
          AND (
            (auth.uid() IS NOT NULL AND qr.user_id = auth.uid())
            OR (auth.jwt() ->> 'email' IS NOT NULL AND qr.customer_email = auth.jwt() ->> 'email')
          )
    )
);

DROP POLICY IF EXISTS "Admins manage quotation items" ON public.quotation_items;
CREATE POLICY "Admins manage quotation items" 
ON public.quotation_items 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- 11.6 Customer Contact Inquiries Security
-- Anyone can submit inquiry; only admins can view
DROP POLICY IF EXISTS "Anyone can submit contact inquiry" ON public.customer_inquiries;
CREATE POLICY "Anyone can submit contact inquiry" 
ON public.customer_inquiries 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins view and manage contact inquiries" ON public.customer_inquiries;
CREATE POLICY "Admins view and manage contact inquiries" 
ON public.customer_inquiries 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 11.7 ATOMIC QUOTATION SUBMISSION STORED PROCEDURE
-- Validated SECURITY DEFINER function with strict payload validation.
-- Enforces:
--   1. Server-generated unique reference number (e.g. ZEZ-RFQ-2026-XXXXX)
--   2. Verified user identity (auth.uid() if authenticated, NULL if guest)
--   3. Quantity and format validations (no zero/negative quantities)
--   4. Server-controlled administrative fields (status='New', admin_notes=NULL)
--   5. Guaranteed atomic transaction (all-or-nothing rollback on failure)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_quotation_request(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_rfq_id VARCHAR(100);
    v_user_id UUID;
    v_total_calc NUMERIC(14, 2) := 0;
    v_qty INTEGER;
    v_unit_price NUMERIC(12, 2);
    item JSONB;
    total_items INTEGER := 0;
BEGIN
    -- 1. Validate customer contact information
    IF payload->>'customer_full_name' IS NULL OR length(trim(payload->>'customer_full_name')) < 2 THEN
        RAISE EXCEPTION 'Customer full name must be at least 2 characters long';
    END IF;

    IF payload->>'customer_email' IS NULL OR trim(payload->>'customer_email') NOT LIKE '%@%.%' THEN
        RAISE EXCEPTION 'A valid email address is required (e.g., procurement@company.ph)';
    END IF;

    IF payload->>'customer_mobile_number' IS NULL OR length(trim(payload->>'customer_mobile_number')) < 7 THEN
        RAISE EXCEPTION 'A valid contact telephone or mobile number is required';
    END IF;

    -- 2. Validate items array
    IF payload->'items' IS NULL OR jsonb_typeof(payload->'items') <> 'array' OR jsonb_array_length(payload->'items') = 0 THEN
        RAISE EXCEPTION 'At least one equipment item is required to submit a quotation request';
    END IF;

    -- 3. Verify user identity securely from active session (cannot be spoofed from client payload)
    v_user_id := auth.uid();

    -- 4. Server-generate collision-resistant official reference number
    v_rfq_id := 'ZEZ-RFQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
    WHILE EXISTS (SELECT 1 FROM public.quotation_requests WHERE id = v_rfq_id) LOOP
        v_rfq_id := 'ZEZ-RFQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
    END LOOP;

    -- 5. Pre-validate item quantities and compute total estimated value
    FOR item IN SELECT * FROM jsonb_array_elements(payload->'items')
    LOOP
        v_qty := (item->>'quantity')::INTEGER;
        IF v_qty IS NULL OR v_qty <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity for item "%". Quantity must be 1 or greater.', COALESCE(item->>'product_name', 'Equipment');
        END IF;

        IF item->>'product_name' IS NULL OR trim(item->>'product_name') = '' THEN
            RAISE EXCEPTION 'Equipment product name is required for all line items';
        END IF;

        IF item->>'unit_price_php' IS NOT NULL AND trim(item->>'unit_price_php') <> '' THEN
            v_total_calc := v_total_calc + ((item->>'unit_price_php')::NUMERIC * v_qty);
        END IF;
    END LOOP;

    -- 6. Insert master quotation header with enforced server-controlled administrative defaults
    INSERT INTO public.quotation_requests (
        id,
        user_id,
        status,
        customer_full_name,
        customer_company_name,
        customer_email,
        customer_mobile_number,
        delivery_city_province,
        delivery_address,
        tin_number,
        customer_type,
        preferred_contact_method,
        target_delivery_date,
        additional_requirements,
        total_estimated_php,
        is_demo,
        admin_notes,
        assigned_specialist,
        valid_until,
        created_at,
        updated_at
    ) VALUES (
        v_rfq_id,
        v_user_id,
        'New', -- Enforce initial status 'New'
        trim(payload->>'customer_full_name'),
        NULLIF(trim(payload->>'customer_company_name'), ''),
        lower(trim(payload->>'customer_email')),
        trim(payload->>'customer_mobile_number'),
        COALESCE(NULLIF(trim(payload->>'delivery_city_province'), ''), 'Metro Manila'),
        NULLIF(trim(payload->>'delivery_address'), ''),
        NULLIF(trim(payload->>'tin_number'), ''),
        COALESCE(NULLIF(trim(payload->>'customer_type'), ''), 'Company'),
        COALESCE(NULLIF(trim(payload->>'preferred_contact_method'), ''), 'Email'),
        CASE 
            WHEN payload->>'target_delivery_date' IS NOT NULL AND trim(payload->>'target_delivery_date') <> '' 
            THEN (payload->>'target_delivery_date')::DATE 
            ELSE NULL 
        END,
        NULLIF(trim(payload->>'additional_requirements'), ''),
        v_total_calc,
        false, -- Server enforces is_demo = false for real database submissions
        NULL, -- Public callers cannot populate administrator notes
        'Marco Rivera (Enterprise Account Manager)',
        (CURRENT_DATE + INTERVAL '30 days')::DATE,
        NOW(),
        NOW()
    );

    -- 7. Insert all equipment line items atomically
    FOR item IN SELECT * FROM jsonb_array_elements(payload->'items')
    LOOP
        v_qty := (item->>'quantity')::INTEGER;
        v_unit_price := CASE 
            WHEN item->>'unit_price_php' IS NOT NULL AND trim(item->>'unit_price_php') <> '' 
            THEN (item->>'unit_price_php')::NUMERIC 
            ELSE NULL 
        END;

        INSERT INTO public.quotation_items (
            quotation_request_id,
            product_id,
            product_name,
            model,
            brand,
            sku,
            main_image,
            quantity,
            unit_price_php,
            subtotal_php,
            notes
        ) VALUES (
            v_rfq_id,
            NULLIF(trim(item->>'product_id'), ''),
            trim(item->>'product_name'),
            COALESCE(NULLIF(trim(item->>'model'), ''), 'Standard Model'),
            COALESCE(NULLIF(trim(item->>'brand'), ''), 'Generic'),
            COALESCE(NULLIF(trim(item->>'sku'), ''), 'ZEZ-ITEM'),
            NULLIF(trim(item->>'main_image'), ''),
            v_qty,
            v_unit_price,
            CASE WHEN v_unit_price IS NOT NULL THEN (v_unit_price * v_qty) ELSE NULL END,
            NULLIF(trim(item->>'notes'), '')
        );
        total_items := total_items + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'rfq_id', v_rfq_id,
        'items_count', total_items,
        'total_estimated_php', v_total_calc,
        'created_at', NOW()
    );
END;
$$;

-- Secure minimal permissions for submit_quotation_request RPC
REVOKE ALL ON FUNCTION public.submit_quotation_request(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_quotation_request(JSONB) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 12. SUPABASE STORAGE BUCKETS (Product Images & Datasheets)
-- ------------------------------------------------------------------------------
-- Insert storage buckets if not already existing
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-datasheets', 'product-datasheets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: Public read access
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public read product datasheets" ON storage.objects;
CREATE POLICY "Public read product datasheets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-datasheets');

-- Storage RLS: Upload & delete restricted to authenticated administrators
DROP POLICY IF EXISTS "Admins manage product images storage" ON storage.objects;
CREATE POLICY "Admins manage product images storage" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (bucket_id = 'product-images' AND public.is_admin()) 
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins manage product datasheets storage" ON storage.objects;
CREATE POLICY "Admins manage product datasheets storage" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (bucket_id = 'product-datasheets' AND public.is_admin()) 
WITH CHECK (bucket_id = 'product-datasheets' AND public.is_admin());

-- ------------------------------------------------------------------------------
-- 13. SEED INITIAL SITE SETTINGS
-- ------------------------------------------------------------------------------
INSERT INTO public.site_settings (
    id,
    company_name,
    tagline,
    phone_primary,
    phone_secondary,
    mobile_viber,
    email_sales,
    email_support,
    office_address,
    operating_hours,
    banner_announcement,
    is_banner_active
) VALUES (
    'current',
    'ZEZ Automation Corporation',
    'Powering Business Through Technology',
    '(02) 8800-9390',
    '+63 917 800 9390',
    '+63 917 800 9390',
    'sales@zezautomation.ph',
    'support@zezautomation.ph',
    'Unit 1402, Corporate Center, Emerald Avenue, Ortigas Center, Pasig City, Metro Manila 1605 Philippines',
    'Mon - Fri: 8:30 AM - 5:30 PM (PST)',
    'Direct Corporate ICT Procurement & Project Pricing Available for Q4 2026. Submit your RFQ today.',
    true
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 14. SEED CATEGORIES (All 12 Official Hardware Categories)
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, description, item_count, image_url, icon_name, subcategories)
VALUES
('networking-equipment', 'Networking Equipment', 'networking-equipment', 'Enterprise managed switches, core routers, firewall appliances, and transceivers for mission-critical infrastructure.', 48, 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80', 'Network', ARRAY['Managed Switches', 'PoE+ Switches', 'Enterprise Routers', 'Firewalls & Security Gateways', 'SFP / Fiber Transceivers']),
('servers-storage', 'Servers & Storage', 'servers-storage', 'Rackmount servers, enterprise NAS arrays, SAN storage appliances, and high-density compute nodes.', 32, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80', 'Server', ARRAY['1U / 2U Rack Servers', 'Tower Servers', 'Network Attached Storage (NAS)', 'Enterprise Hard Drives', 'SAN Controllers']),
('cctv-surveillance', 'CCTV & Surveillance', 'cctv-surveillance', 'Commercial IP cameras, AI-powered NVRs, PTZ dome systems, and biometric security surveillance gear.', 42, 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80', 'Camera', ARRAY['IP Bullet Cameras', 'PTZ Dome Cameras', 'Network Video Recorders (NVR)', 'Access Control Systems', 'Surveillance HDDs']),
('ups-power-solutions', 'UPS & Power Solutions', 'ups-power-solutions', 'Online double-conversion UPS, rackmount power distribution units (PDU), and surge protection systems.', 26, 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80', 'Zap', ARRAY['On-Line Double Conversion UPS', 'Line-Interactive UPS', 'Rackmount PDUs', 'Automatic Transfer Switches', 'Replacement Battery Packs']),
('structured-cabling', 'Structured Cabling', 'structured-cabling', 'Certified Cat6 / Cat6A UTP cabling, patch cords, patch panels, keystone jacks, and fiber optic trunks.', 38, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', 'Cable', ARRAY['Cat6 UTP Cable 305m', 'Cat6A Shielded Cable', '24/48-Port Patch Panels', 'Fiber Optic Patch Cords', 'Modular Keystone Jacks']),
('racks-cabinets', 'Racks & Cabinets', 'racks-cabinets', 'Data center server racks, wall-mount network enclosures, cable management trays, and cooling fans.', 22, 'https://images.unsplash.com/photo-1544197150-199123fa6d8d?auto=format&fit=crop&w=800&q=80', 'Layers', ARRAY['42U Server Rack Cabinets', '24U Enclosures', '6U/9U/12U Wall Mount Racks', 'Horizontal Cable Managers', 'Rackmount Fan Trays']),
('wireless-connectivity', 'Wireless & Connectivity', 'wireless-connectivity', 'Enterprise Wi-Fi 6 / 6E access points, point-to-point wireless bridges, and high-gain external antennas.', 29, 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80', 'Wifi', ARRAY['Ceiling-Mount Access Points', 'Outdoor Long-Range APs', 'Point-to-Point Wireless Bridges', 'Mesh Wi-Fi Systems', 'PoE Injectors']),
('computers-laptops', 'Computers & Laptops', 'computers-laptops', 'Corporate business laptops, enterprise desktop workstations, all-in-one PCs, and rugged field terminals.', 35, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80', 'Laptop', ARRAY['Enterprise Business Laptops', 'Desktop Workstations', 'Mini Commercial PCs', 'All-in-One PCs', 'Mobile Workstations']),
('computer-components', 'Computer Components', 'computer-components', 'Server processors, ECC registered DDR4/DDR5 memory, enterprise SSDs, and industrial power supplies.', 40, 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80', 'Cpu', ARRAY['Intel Xeon / Core Processors', 'ECC Server RAM Modules', 'NVMe PCIe Enterprise SSDs', 'Raid Controller Cards', 'Industrial Power Supplies']),
('printers-scanners', 'Printers & Scanners', 'printers-scanners', 'High-volume office laser printers, heavy-duty document scanners, barcode label printers, and genuine toners.', 20, 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80', 'Printer', ARRAY['Enterprise Laser MFPs', 'Sheet-fed Document Scanners', 'Thermal Barcode Printers', 'Original OEM Toners & Drums']),
('peripherals-accessories', 'Peripherals & Accessories', 'peripherals-accessories', 'Conference room 4K cameras, commercial display monitors, KVM switches, and ergonomic office input devices.', 31, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80', 'MousePointer', ARRAY['Video Conference Bar Systems', 'KVM Rack Consoles', 'Commercial IPS Monitors', 'Wireless Business Keyboards & Mice', 'Docking Stations']),
('software-licensing', 'Software & Licensing', 'software-licensing', 'Enterprise operating systems, virtualization licenses, firewall security subscriptions, and commercial office suites.', 16, 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80', 'ShieldCheck', ARRAY['Microsoft Windows Server CALs', 'VMware vSphere Virtualization', 'Firewall Threat Protection Subscriptions', 'Microsoft 365 Business Plans'])
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 15. SEED BRANDS
-- ------------------------------------------------------------------------------
INSERT INTO public.brands (id, name, slug, origin_country, description, product_count, website)
VALUES
('cisco', 'Cisco', 'cisco', 'USA', 'Industry-leading enterprise switches, routing engines, and cybersecurity infrastructure.', 14, 'https://www.cisco.com'),
('ubiquiti', 'Ubiquiti', 'ubiquiti', 'USA', 'High-performance UniFi networking, EdgeMAX routers, and UISP wireless ISP hardware.', 18, 'https://ui.com'),
('hikvision', 'Hikvision', 'hikvision', 'Global', 'Smart commercial CCTV video surveillance, DarkFighter IP cameras, and AI-powered NVRs.', 16, 'https://www.hikvision.com'),
('apc', 'APC by Schneider', 'apc', 'USA', 'Uninterruptible power supplies (UPS), rack PDUs, and data center critical power backup systems.', 12, 'https://www.apc.com'),
('dahua', 'Dahua Technology', 'dahua', 'Global', 'Intelligent security solutions, WizSense IP video cameras, and thermal surveillance.', 11, 'https://www.dahuasecurity.com'),
('tp-link', 'TP-Link Omada', 'tp-link', 'Global', 'Software-defined networking (SDN) business access points, multi-WAN routers, and PoE switches.', 15, 'https://www.tp-link.com'),
('synology', 'Synology', 'synology', 'Taiwan', 'Enterprise Network Attached Storage (NAS), private cloud backup, and surveillance station hardware.', 9, 'https://www.synology.com'),
('mikrotik', 'MikroTik', 'mikrotik', 'Latvia', 'RouterBOARD carrier-class routing, Cloud Router Switches (CRS), and RouterOS networking gear.', 10, 'https://mikrotik.com'),
('dell', 'Dell Technologies', 'dell', 'USA', 'PowerEdge rack servers, Latitude commercial laptops, and precision workstation computers.', 13, 'https://www.dell.com'),
('lenovo', 'Lenovo Think', 'lenovo', 'Global', 'ThinkPad business laptops, ThinkCentre workstations, and ThinkSystem rack servers.', 12, 'https://www.lenovo.com'),
('hp', 'HP Enterprise', 'hp', 'USA', 'LaserJet enterprise multifunctional printers, ProLiant compute, and business hardware.', 8, 'https://www.hp.com'),
('asus', 'ASUS Business', 'asus', 'Taiwan', 'ExpertBook commercial laptops, corporate motherboards, and mini business PCs.', 7, 'https://www.asus.com'),
('panduit', 'Panduit', 'panduit', 'USA', 'Industrial-grade structured cabling, Category 6A UTP cable reels, and fiber patch panels.', 6, 'https://www.panduit.com'),
('commscope', 'CommScope Systimax', 'commscope', 'USA', 'Enterprise telecommunications infrastructure, patch cords, and certified cabling systems.', 6, 'https://www.commscope.com')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 16. SEED CORE PRODUCTS
-- ------------------------------------------------------------------------------
INSERT INTO public.products (
    id, sku, model, name, brand, category_id, category_name,
    short_description, full_description, price_php, is_price_negotiable,
    stock_status, lead_time_days, warranty, is_featured, is_new_arrival, is_published,
    main_image, gallery_images, key_specs, specifications, included_accessories,
    datasheet_file_name
) VALUES
(
    'prod-01',
    'ZEZ-CS-9200L-24P',
    'C9200L-24P-4G-E',
    'Cisco Catalyst 9200L 24-Port Gigabit PoE+ Managed Switch',
    'Cisco',
    'networking-equipment',
    'Networking Equipment',
    'Enterprise 24-port Gigabit Ethernet switch with 370W PoE+ power budget and 4x 1G SFP uplinks.',
    'The Cisco Catalyst 9200L Series switches extend the power of intent-based networking to broader deployments. Features 24 10/100/1000 PoE+ ports, Layer 3 routing, dual redundant power supply options, and enterprise ASIC architecture for branch and campus networks.',
    89500.00,
    true,
    'In Stock',
    1,
    '3-Year Cisco Enhanced Limited Lifetime Hardware Warranty (E-LLW)',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80'],
    ARRAY['24x 10/100/1000 Gigabit Ethernet PoE+ Ports', '370W Total PoE Power Budget', '4x 1G SFP Fixed Uplink Ports', '56 Gbps Switching Capacity / 41.66 Mpps Forwarding', 'Cisco DNA Network Essentials Support'],
    '[
        {"category": "Networking", "label": "Port Count", "value": "24x 10/100/1000 Mbps RJ45"},
        {"category": "Networking", "label": "PoE Standard", "value": "802.3at / 802.3af PoE+ (Up to 30W per port)"},
        {"category": "Networking", "label": "PoE Power Budget", "value": "370 Watts"},
        {"category": "Performance", "label": "Switching Capacity", "value": "56 Gbps"},
        {"category": "Management", "label": "Management", "value": "Cisco IOS XE, Web UI, CLI, SNMP"}
    ]'::jsonb,
    ARRAY['Rackmount brackets & screws', 'Console cable', 'AC power cord'],
    'Cisco-Catalyst-9200L-Datasheet.pdf'
),
(
    'prod-02',
    'ZEZ-UB-UDM-SE',
    'UDM-SE',
    'Ubiquiti UniFi Dream Machine Special Edition (UDM-SE)',
    'Ubiquiti',
    'networking-equipment',
    'Networking Equipment',
    'All-in-one 10G enterprise router, 8-port PoE switch, UniFi OS gateway, and integrated NVR.',
    'The UniFi Dream Machine Special Edition is an all-in-one enterprise network gateway and security console. Built with 8 integrated PoE/PoE+ ports, a 2.5 GbE WAN port, dual 10G SFP+ ports, and an integrated 128 GB SSD for UniFi Protect NVR storage.',
    38900.00,
    false,
    'In Stock',
    1,
    '1-Year Ubiquiti Manufacturer Warranty',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1544197150-199123fa6d8d?auto=format&fit=crop&w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1544197150-199123fa6d8d?auto=format&fit=crop&w=800&q=80'],
    ARRAY['8x GbE RJ45 Ports (6x PoE, 2x PoE+)', '1x 2.5 GbE RJ45 WAN Port + 1x 10G SFP+ WAN', '1x 10G SFP+ LAN Port', '3.5 Gbps Routing with IDS/IPS Deep Packet Inspection', 'Integrated 128GB SSD + 3.5" HDD NVR Bay'],
    '[
        {"category": "Routing", "label": "IDS/IPS Throughput", "value": "3.5 Gbps"},
        {"category": "Networking", "label": "LAN Ports", "value": "8x GbE RJ45 (6x PoE, 2x PoE+)"},
        {"category": "Storage", "label": "Onboard Storage", "value": "128 GB Integrated SSD + 1x 3.5\" HDD Bay"}
    ]'::jsonb,
    ARRAY['1U Rackmount ears & screw kit', 'Power cable', 'Quick Start Guide'],
    'Ubiquiti-UDM-SE-Datasheet.pdf'
),
(
    'prod-03',
    'ZEZ-UB-U6-ENT',
    'U6-Enterprise',
    'Ubiquiti UniFi U6 Enterprise Wi-Fi 6E Access Point',
    'Ubiquiti',
    'wireless-connectivity',
    'Wireless & Connectivity',
    'Tri-band Wi-Fi 6E ceiling access point supporting 6 GHz band and 2.5 GbE uplink.',
    'High-density enterprise access point engineered for massive multi-client environments such as conference halls and corporate campuses. Leverages the clean 6 GHz band with up to 10.2 Gbps aggregate throughput over 10 spatial streams.',
    21500.00,
    true,
    'In Stock',
    1,
    '1-Year Ubiquiti Manufacturer Warranty',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80'],
    ARRAY['Tri-Band Wi-Fi 6E (2.4 GHz, 5 GHz, 6 GHz)', '10.2 Gbps Aggregate Over-the-Air Throughput', '1x 2.5 GbE RJ45 Uplink Port', '600+ Concurrent Client Capacity', 'Powered via 802.3at PoE+'],
    '[
        {"category": "Wireless", "label": "Bands", "value": "2.4 GHz, 5 GHz, 6 GHz"},
        {"category": "Networking", "label": "Uplink", "value": "1x 2.5 GbE RJ45 Port"},
        {"category": "Power", "label": "Power Input", "value": "802.3at PoE+ (22W Max)"}
    ]'::jsonb,
    ARRAY['Ceiling & wall mounting bracket', 'Mounting hardware kit'],
    'UniFi-U6-Enterprise-Datasheet.pdf'
),
(
    'prod-04',
    'ZEZ-HK-DS2646G2',
    'DS-2CD2646G2-IZS',
    'Hikvision 4MP AcuSense DarkFighter Motorized Varifocal Bullet IP Camera',
    'Hikvision',
    'cctv-surveillance',
    'CCTV & Surveillance',
    'Commercial 4MP bullet camera with DarkFighter ultra-low light tech, 2.8-12mm motorized zoom, and AcuSense AI.',
    'Equipped with Hikvision AcuSense and DarkFighter technology, providing clear color surveillance even in challenging ultra-low-light environments. Deep learning algorithms distinguish humans and vehicles from false alarm triggers with IP67/IK10 ratings.',
    14800.00,
    true,
    'In Stock',
    1,
    '2-Year Hikvision Authorized Warranty',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80'],
    ARRAY['4 MP High-Resolution (2688 × 1520 @ 30 fps)', '2.8 to 12 mm Motorized Varifocal Zoom Lens', 'DarkFighter 0.003 Lux Ultra-Low Light Imaging', 'AcuSense Human & Vehicle Classification', '60m IR Night Vision / IP67 & IK10'],
    '[
        {"category": "Optics", "label": "Sensor", "value": "1/2.7\" Progressive Scan CMOS"},
        {"category": "Lens", "label": "Varifocal", "value": "2.8 mm to 12 mm (FOV 108° to 30°)"},
        {"category": "Protection", "label": "Rating", "value": "IP67 Weatherproof / IK10 Vandal Resistant"}
    ]'::jsonb,
    ARRAY['Weatherproof junction connector', 'Drill template', 'Mounting screws'],
    'Hikvision-DS-2CD2646G2-IZS.pdf'
),
(
    'prod-06',
    'ZEZ-APC-SURT3000',
    'SURT3000XLI',
    'APC Smart-UPS RT 3000VA 230V On-Line Double-Conversion UPS',
    'APC',
    'ups-power-solutions',
    'UPS & Power Solutions',
    'High-density, double-conversion on-line power protection with scalable runtime for servers and voice/data networks.',
    'Delivers genuine double-conversion online power protection, ensuring zero transfer time to battery when utility power fluctuates or fails. Perfect for critical enterprise servers and core network switches.',
    94800.00,
    true,
    'In Stock',
    1,
    '2-Year APC by Schneider Electric Factory Warranty',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'],
    ARRAY['3000VA / 2100W Pure Sine Wave Output', 'True On-Line Double Conversion (Zero Transfer Time)', '230V Nominal with ±1% Voltage Regulation', 'SmartSlot for Network Management Card', 'Tower / 3U Rack Convertible'],
    '[
        {"category": "Power", "label": "Capacity", "value": "3000VA / 2100 Watts"},
        {"category": "Topology", "label": "Topology", "value": "Double Conversion On-Line (0ms transfer)"},
        {"category": "Form", "label": "Form Factor", "value": "3U Rack / Tower Convertible"}
    ]'::jsonb,
    ARRAY['Rack mounting support rails', 'Smart UPS signaling cable', 'User manual'],
    'APC-Smart-UPS-RT-3000VA.pdf'
),
(
    'prod-07',
    'ZEZ-SYN-DS1821P',
    'DS1821+',
    'Synology DiskStation DS1821+ 8-Bay Enterprise NAS',
    'Synology',
    'servers-storage',
    'Servers & Storage',
    'High-capacity 8-bay desktop NAS powered by AMD Ryzen Quad-Core with dual M.2 NVMe SSD cache slots.',
    'Designed for SMBs and data-intensive IT environments, providing up to 108 TB of raw capacity across 8 drive bays, expandable to 18 bays with two DX517 units.',
    68500.00,
    true,
    'In Stock',
    1,
    '3-Year Synology Manufacturer Warranty',
    true,
    false,
    true,
    'https://images.unsplash.com/photo-1597852074816-d933c4d2b988?auto=format&fit=crop&w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1597852074816-d933c4d2b988?auto=format&fit=crop&w=800&q=80'],
    ARRAY['8x 3.5"/2.5" SATA HDD/SSD Hot-Swappable Bays', 'AMD Ryzen Quad-Core 2.2 GHz Processor', '4GB DDR4 ECC RAM (Expandable to 32GB)', 'Dual M.2 2280 NVMe SSD Cache Slots', '4x Gigabit LAN Ports with Link Aggregation'],
    '[
        {"category": "Compute", "label": "CPU", "value": "AMD Ryzen V1500B 4-core 2.2 GHz"},
        {"category": "Memory", "label": "System Memory", "value": "4 GB DDR4 ECC (Expandable to 32 GB)"},
        {"category": "Bays", "label": "Drive Bays", "value": "8 Bays (Expandable to 18 Bays)"}
    ]'::jsonb,
    ARRAY['AC power adapter', '2x RJ-45 LAN cables', 'Drive bay lock keys'],
    'Synology-DS1821+-Datasheet.pdf'
),
(
    'prod-08',
    'ZEZ-DELL-R450',
    'PowerEdge R450',
    'Dell PowerEdge R450 1U Dual-Socket Rack Server',
    'Dell',
    'servers-storage',
    'Servers & Storage',
    'Dense 1U enterprise server powered by 3rd Gen Intel Xeon Scalable Processors for virtualization and corporate workloads.',
    'The Dell EMC PowerEdge R450 is a two-socket 1U server offering processing power, storage density, and enterprise manageability via iDRAC9 for edge computing and virtualization clusters.',
    198000.00,
    true,
    'Pre-Order (5-7 Days)',
    7,
    '3-Year Dell ProSupport & Next Business Day Onsite Service',
    true,
    true,
    true,
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80'],
    ARRAY['Dual 3rd Gen Intel Xeon Silver 4314 (16C/32T)', '64GB (2x32GB) DDR4 3200MHz ECC Registered RDIMMs', 'PERC H755 RAID Controller with 8GB Cache', '4x 3.5" Hot-Plug SAS/SATA Drive Chassis', 'Dual 800W Titanium Redundant Power Supplies'],
    '[
        {"category": "Processor", "label": "CPU Model", "value": "Intel Xeon Silver 4314 2.4G 16C/32T"},
        {"category": "Memory", "label": "RAM Config", "value": "64GB DDR4 3200MT/s RDIMM"},
        {"category": "Management", "label": "Remote", "value": "iDRAC9 Enterprise 15G"}
    ]'::jsonb,
    ARRAY['ReadyRails sliding rack rails', 'Cable management arm', '2x C13-C14 cords'],
    'Dell-PowerEdge-R450-Spec-Sheet.pdf'
)
ON CONFLICT (id) DO NOTHING;

-- Mark demonstration catalog products explicitly so they are distinguishable from live production inventory
UPDATE public.products 
SET is_demo = true 
WHERE id IN ('prod-01', 'prod-02', 'prod-03', 'prod-04', 'prod-05', 'prod-06', 'prod-07', 'prod-08');

-- ==============================================================================
-- INSTRUCTIONS TO CREATE YOUR FIRST PRODUCTION ADMINISTRATOR ACCOUNT:
-- 1. Create a user in Supabase Studio -> Authentication -> Users (e.g. admin@zezautomation.ph)
-- 2. Copy the generated User UID (e.g. '00000000-0000-0000-0000-000000000000')
-- 3. Execute the following SQL query in the Supabase SQL Editor:
--
--    INSERT INTO public.administrator_users (id, email, full_name, role, is_active)
--    VALUES (
--      'PASTE_USER_UUID_HERE',
--      'admin@zezautomation.ph',
--      'Engr. Eduardo Z. (Managing Director)',
--      'super_admin',
--      true
--    );
-- ==============================================================================
