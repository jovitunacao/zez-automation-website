# ZEZ product catalog — integration into updated November 1 GitHub revision

Repository: https://github.com/jovitunacao/zez-automation-website

**Read `GEMINI_INTEGRATION_PROMPT.md`** and supply this ZIP to Google AI Studio. This is a merge-ready catalog package, not a production database migration that has already run.

## Contents and counts
- 46 distinct SKUs, sourced from the October 29 consignment workbook. Public price = SRP, not purchase price.
- 36 structured cabling, 8 racks/cabinets, 2 UPS/power products.
- `src/data/consignmentProducts.ts` — 46 typed `Product` objects.
- `public/catalog/` — 20 Excel-embedded supplier images; every local path verified in this package.
- 1 manufacturer-matched URL and 25 illustrative images needing exact-model validation or placeholders.
- `supabase/consignment_seed.sql` — SKU-idempotent product data seed, **not the baseline schema**.
- `public-catalog.csv` — price and image verification audit.

## Safe integration order
1. Preserve latest Gemini repairs to `supabase/schema.sql`, `src/services/supabaseService.ts`, `src/context/AppContext.tsx`, RFQ, and admin auth; merge this catalog into those files.
2. Add the new product TS module and local images.
3. Use the consignment array as the local catalog fallback; retain Supabase as production source. Ensure brand filter adds Linkbasic and handles unspecified manufacturers.
4. Validate the UI and compile. Only after separately reviewing, installing, and testing the baseline schema may the consignment seed run against Supabase.
5. Verify 46 products are actually visible in a fresh browser session, with correct per-unit prices. Check RFQ cart and final persistence independently.

## Cautions
- No secret, private cost data or consignment counts should be published.
- Product availability not verified; show `Contact for Availability`.
- Supplier and manufacturer images should be checked for permission to publish; category illustrations are not exact product photos.
- Review business information; earlier code contained invented Pasig contact details.
- GitHub connector could read code but returned HTTP 403 `Resource not accessible by integration` for creating a branch; upload this ZIP through Google AI Studio, not direct ChatGPT GitHub writes.
