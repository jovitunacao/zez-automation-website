# ZEZ Automation Corporation – B2B ICT E-Commerce & Quotation Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev/)
[![Supabase Ready](https://img.shields.io/badge/Supabase-PostgreSQL-emerald.svg)](https://supabase.com/)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployment%20Ready-black.svg)](https://vercel.com/)

A modern, responsive, and production-grade B2B e-commerce platform and quotation portal built for **ZEZ Automation Corporation**, a premier Philippine-based ICT equipment and technology supplies distributor headquartered in Ortigas Center, Pasig City.

---

## 🌟 Key Features

1. **Enterprise Hardware Catalog**:
   - 12 comprehensive categories: *Computers & Laptops*, *Networking Equipment*, *Servers & Storage*, *CCTV & Surveillance*, *Structured Cabling*, *Printers & Scanners*, *UPS & Power Solutions*, *Computer Components*, *Peripherals & Accessories*, *Wireless & Connectivity*, *Racks & Cabinets*, and *Software & Licensing*.
   - Filter by category, manufacturer/brand (Cisco, Ubiquiti, Hikvision, APC, etc.), stock status (*In Stock*, *Pre-Order*), and price range slider (PHP).
   - Instant search with live dropdown suggestions and keyboard navigation.
   - Grid and List layout switcher.

2. **Core B2B Request for Quotation (RFQ) Engine**:
   - Slide-over Quotation Cart with item quantity controls and custom project notes.
   - B2B checkout form with corporate validation: Company Name, BIR Tax ID (TIN), Authorized Officer, Delivery City/Province, Customer Type (*Enterprise*, *Contractor*, *Government*, *School*, *Hospital*), and Target Timeline.
   - Generates unique reference IDs (e.g., `ZEZ-RFQ-2026-XXXX`).
   - Does **not** require upfront payment integration.
   - Generates an official, printable **Pro-Forma Quotation Slip** with ZEZ letterhead, SEC/TIN registration, 12% EVAT calculation, 30-day price validity terms, and browser PDF printing.

3. **Customer Procurement Portal**:
   - Guest browsing and corporate email sign-in.
   - Real-time status tracking (*New*, *Under Review*, *Quotation Prepared*, *Quotation Sent*, *Accepted*, *Closed*).
   - One-click *Re-Quote Items* to duplicate prior bills-of-materials into the cart.
   - Customer profile management for saved corporate delivery locations and procurement officer information.

4. **Operations & Admin Dashboard**:
   - Overview metrics: Total products, active RFQs, pending reviews, and pipeline value.
   - Quotation manager: Filter by status, search by client/reference, update progress, append internal staff notes, and print quotation slips.
   - Product catalog CRUD: Add new hardware models, edit specs, update pricing, toggle stock status, and feature items.
   - Site settings manager: Configure corporate hotlines, Viber support, sales email, Pasig warehouse address, and public announcement banners.

5. **Additional Utilities**:
   - Side-by-side product specification comparison tool (up to 4 products).
   - Floating B2B Corporate Desk shortcut for direct phone/Viber/email/quote access.
   - Built-in OpenGraph cards, Twitter cards, and Schema.org `WholesaleStore` JSON-LD structured data.

---

## 🏗️ Project Architecture

```
├── .env.example              # Environment variables template (safe to commit)
├── .gitignore                # Comprehensive Git ignore rules (protects credentials)
├── index.html                # HTML entry point with SEO & JSON-LD structured data
├── metadata.json             # AI Studio applet metadata
├── package.json              # Project dependencies and npm scripts
├── tsconfig.json             # TypeScript configuration
├── vercel.json               # Vercel deployment & SPA routing rewrites configuration
├── vite.config.ts            # Vite & Tailwind CSS v4 configuration
├── supabase/
│   └── schema.sql            # PostgreSQL DDL schema with RLS security policies
└── src/
    ├── App.tsx               # Root view router and provider mount
    ├── main.tsx              # React DOM entry point
    ├── index.css             # Tailwind CSS v4 design tokens and print styles
    ├── types/
    │   └── index.ts          # Core TypeScript interfaces (Products, RFQs, Brands, Categories)
    ├── lib/
    │   └── supabase.ts       # Safe Supabase client initialization
    ├── services/
    │   └── supabaseService.ts# Cloud PostgreSQL sync service for RFQs and inquiries
    ├── context/
    │   └── AppContext.tsx    # State management (Catalog, Cart, RFQ pipeline, Settings)
    ├── data/
    │   ├── categories.ts     # 12 detailed ICT categories
    │   ├── brands.ts         # Supported manufacturers and descriptions
    │   └── sampleProducts.ts # 26+ enterprise demonstration products with specs
    ├── components/
    │   ├── brand/
    │   │   └── Logo.tsx      # Vector SVG brand logo of ZEZ Automation Corporation
    │   ├── layout/
    │   │   ├── Header.tsx    # Sticky header with instant search & navigation
    │   │   └── Footer.tsx    # Corporate footer with assurance badges & contacts
    │   ├── quote/
    │   │   ├── QuotationDrawer.tsx    # Slide-in quotation cart drawer
    │   │   └── QuotationSlipModal.tsx # Printable official B2B pro-forma quotation slip
    │   ├── compare/
    │   │   └── ProductCompareModal.tsx# Multi-product spec comparison modal
    │   └── common/
    │       └── FloatingActionContact.tsx# Quick-call & corporate sales desk shortcut
    └── views/
        ├── HomeView.tsx            # Corporate homepage with hero, categories, & brands
        ├── ShopView.tsx            # B2B shopping catalog with sidebar filters
        ├── CategoriesView.tsx      # Visual category directory with subcategories
        ├── BrandsView.tsx          # Brand directory and partner listing
        ├── ProductDetailView.tsx   # Detailed specs, gallery, accessories, & datasheets
        ├── RfqCheckoutView.tsx     # RFQ submission form and confirmation screen
        ├── CustomerAccountView.tsx # Quotation tracking & reorder history
        ├── AdminDashboardView.tsx  # Staff back-office portal
        ├── AboutUsView.tsx         # Corporate history, mission, & logistics
        └── ContactUsView.tsx       # Pasig headquarters, branch directory, & inquiry form
```

---

## 🚀 Getting Started Locally

### Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### Installation

1. **Clone or download the repository**:
   ```bash
   git clone https://github.com/your-username/zez-automation.git
   cd zez-automation
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example template to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
   *(See the Environment Configuration section below).*

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run the production build check**:
   ```bash
   npm run build
   ```

6. **Type-check and lint**:
   ```bash
   npm run lint
   ```

---

## 🔐 Environment Variables Configuration

The application uses standard Vite client environment variables prefixed with `VITE_`.

| Variable | Required | Description |
| :--- | :---: | :--- |
| `VITE_SUPABASE_URL` | Optional | Your Supabase project URL (e.g., `https://xyz.supabase.co`). When omitted, the app operates in local offline demo mode. |
| `VITE_SUPABASE_ANON_KEY` | Optional | Your Supabase public anonymous API key (safe for browser usage). |
| `APP_URL` | Optional | Public canonical production domain (e.g., `https://zezautomation.ph`). |
| `GEMINI_API_KEY` | Optional | API key for server-side Gemini AI features (if used). |

> ⚠️ **Security Notice**: Never commit `.env` or `.env.local` to Git. Only commit `.env.example`. Never expose Supabase `service_role` secret keys in client-side code.

---

## 🗄️ Supabase PostgreSQL Setup

The project includes a ready-to-run database schema in `supabase/schema.sql`.

### Setup Instructions:

1. Create a free project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** in your Supabase dashboard.
3. Open `supabase/schema.sql` from this repository, copy its contents, paste them into the SQL Editor, and click **Run**.
4. The script provisions:
   - `categories` (with subcategories array)
   - `brands` (with origin countries & product counts)
   - `products` (with structured JSONB specifications & SKUs)
   - `quotation_requests` (with client details, assigned engineer, & status)
   - `quotation_items` (foreign keyed to quotation requests)
   - `customer_inquiries` (contact form messages)
   - `site_settings` (configurable hotline, address, & announcement banners)
   - Performance indexes on SKUs, brands, categories, and timestamps
   - **Row Level Security (RLS)** policies allowing public catalog browsing and atomic `submit_quotation_request` RPC.

5. **(Optional) Seed 46 Actual Consignment Products**:
   - After executing `schema.sql`, open `supabase/consignment_seed.sql`.
   - Run the script to populate the 46 official catalog products (cabling, server cabinets, rack PDUs, wire mesh).
   - The script is idempotent using `ON CONFLICT (sku) DO UPDATE`, completely safe against duplicate SKUs.
   - Strictly contains public Suggested Retail Prices (SRP) in PHP net of VAT; supplier costs are excluded.

6. In your Supabase Dashboard, go to **Project Settings** → **API**.
7. Copy the **Project URL** and the **anon / public** key.
8. Paste them into your `.env` file or Vercel Environment Variables:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```

*Note: If Supabase is not yet configured or seeded, the application seamlessly falls back to the embedded 46 consignment products in `src/data/consignmentProducts.ts` with local RFQ cart persistence.*

---

## 🌐 Deploying to Vercel

The repository is configured for one-click deployment on [Vercel](https://vercel.com).

### Method A: Deploy via GitHub & Vercel Dashboard (Recommended)

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: Initial commit of ZEZ Automation Corporation platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/zez-automation.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **Add New** → **Project**.
4. Import your `zez-automation` GitHub repository.
5. In the **Configure Project** screen:
   - **Framework Preset**: Vite (detected automatically)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Expand **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-public-key`
   - `APP_URL` = `https://your-custom-domain.vercel.app`
7. Click **Deploy**. Vercel will build and deploy your application.

### Method B: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
# Follow the interactive prompts, then deploy to production:
vercel --prod
```

### Single Page Application (SPA) Routing

`vercel.json` is included in the project root:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
This ensures refreshing pages or sharing direct URLs (e.g. `/shop`, `/account`) correctly serves the client app without 404 errors.

---

## 🏢 Brand & Corporate Details

- **Company**: ZEZ Automation Corporation
- **Industry**: ICT Distribution, IT Hardware, Networking Equipment, Security Systems, Technology Solutions
- **Brand Colors**:
  - Primary Red: `#B5121B`
  - Dark Red: `#8F1018`
  - Charcoal: `#292F36`
  - Graphite Gray: `#5E646D`
  - Light Gray: `#F4F5F7`
- **Headquarters**: Pasig City, Metro Manila, Philippines
- **Hotline**: `(02) 8800-9390` | **Mobile/Viber**: `+63 917 800 9390`
- **Sales Inquiries**: `sales@zezautomation.ph`

---

## 📄 License & Disclaimer

All product models, specifications, and manufacturer trademarks (Cisco, Ubiquiti, Hikvision, APC, etc.) belong to their respective copyright holders and are presented for commercial catalog reference. Prices shown in demonstration mode are reference sample prices; final pricing is established upon official quotation issuance.
