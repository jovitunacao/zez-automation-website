# ZEZ Automation Corporation — integrate actual consignment products into latest GitHub code

You have already completed the recent Phase 4 Supabase/RFQ/security corrections. Do not undo them or rewrite the storefront design.

Integrate the attached `ZEZ_Product_Catalog_Integration.zip` into the *current* Google AI Studio project synced to GitHub repo `jovitunacao/zez-automation-website` (branch main), merging with current source files instead of replacing them wholesale.

## Required inputs
- `src/data/consignmentProducts.ts`: 46 distinct products with exact part numbers, names, and public SRPs sourced from the October 29 consignment spreadsheet.
- `public/catalog/*.jpg`: 20 corresponding supplier images extracted from the spreadsheet.
- `supabase/consignment_seed.sql`: idempotent on-conflict SKU-based product seed, for use only after the reviewed `supabase/schema.sql` baseline is installed.
- `public-catalog.csv` and `IMAGE_NOTES.txt`: import cross-check and image sourcing/verification notes.

## Requirements
1. Add `src/data/consignmentProducts.ts` and the 20 images to the existing project at the supplied relative paths. Confirm there are exactly 46 unique SKUs and all local `/catalog/` image paths resolve.
2. In `src/context/AppContext.tsx`, retain the existing secure Supabase fetching and admin authentication. Use the real `CONSIGNMENT_PRODUCTS` as the **local/demo catalog fallback** rather than fictitious `SAMPLE_PRODUCTS`, but the authoritative production catalog must load from Supabase. Do not overwrite existing RFQ/CRUD/security changes.
3. Ensure all catalog listings, detail pages, global search, categories, brand filters, price displays, and Add to Quote work with these products. Map the 36 structured cabling, 8 racks/cabinets, and 2 UPS/power products correctly to existing category IDs.
4. Show the spreadsheet **SRP in Philippine pesos**, respecting the spreadsheet's sales unit (piece, meter, reel, etc.). NEVER expose supplier purchase prices, cost margins, consignment totals, inventory quantities, or the raw private spreadsheet in the frontend, build artifacts, or public GitHub repository.
5. Exactly 20 items have supplier photos, 1 item has a model-matched image, and 25 items use illustrative category imagery pending verification. Preserve this distinction in the import audit; do not claim illustrative imagery is the actual product. For public storefront release, replace all illustrative images with accurate licensed exact-item photos or a neutral 'image coming soon' placeholder. Do not scrape copyrighted product images without appropriate usage rights.
6. Treat brands marked `Manufacturer to verify` as unspecified, not as an actual manufacturer. Add `Linkbasic` to the visible brand filter/catalog if the existing brand list doesn't contain it. Do not imply authorized reseller status.
7. Mark every imported item's availability `Contact for Availability` unless inventory is confirmed. Don't infer real stock from consignment quantities. Do not invent technical specifications or warranty terms; preserve available product descriptions and units.
8. Prepare Supabase import using only the `supabase/consignment_seed.sql` supplied; review its compatibility with the latest live schema. The SQL must avoid duplicates on rerun. Do not run any SQL yet. Do not reset the database or alter the recently corrected secure `submit_quotation_request(payload JSONB)` RPC, its RLS, auth, or storage policies.
9. Do not publish fabricated company address, telephone, registration, or customer RFQs from demo data. Preserve current pending corrections for these details.
10. Test the TypeScript check/build if available; verify 46 products, SKU uniqueness, category filtering, image paths, quoted unit prices, RFQ item details and database migration preview. Describe tests actually run and remaining failures. Do not claim live database import before verified.
11. Sync the merged project to the existing GitHub repo when ready, ideally via a review branch/pull request instead of overwriting concurrent changes.

## Deliverables
- Catalog integrated into current React app without UI regressions.
- Image files bundled and correctly referenced.
- Supabase seed ready for separate execution after approval.
- Clear change summary and test evidence.
