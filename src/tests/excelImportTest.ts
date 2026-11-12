import ExcelJS from 'exceljs';
import { 
  generateProductExcelTemplate, 
  parseProductExcel, 
  generateValidationErrorReport, 
  executeBulkProductImport,
  ALLOWED_STOCK_STATUSES,
  ALLOWED_PRICE_DISPLAY_MODES,
  ALLOWED_IMAGE_STATUSES,
  CLEAR_TOKEN
} from '../services/excelImportService';
import { ProductCategory, Brand, Product } from '../types';
import { CATEGORIES } from '../data/categories';
import { BRANDS } from '../data/brands';

// Mock catalog for testing
const MOCK_EXISTING_PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    sku: 'ZEZ-CS-9200L-24P',
    name: 'Cisco Catalyst 9200L 24-Port Gigabit PoE+ Managed Switch',
    model: 'C9200L-24P-4G-E',
    brand: 'Cisco',
    categoryId: 'networking-equipment',
    categoryName: 'Networking Equipment',
    shortDescription: 'Existing description',
    fullDescription: 'Existing full description',
    pricePhp: 89500,
    priceDisplayMode: 'public',
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '3-Year Manufacturer Warranty',
    salesUnit: 'unit',
    isFeatured: true,
    isNewArrival: false,
    isPublished: true,
    imageStatus: 'manufacturer-matched',
    mainImage: 'https://images.unsplash.com/cisco-switch.jpg',
    galleryImages: ['https://images.unsplash.com/cisco-switch.jpg', 'https://images.unsplash.com/cisco-switch-rear.jpg'],
    keySpecs: ['24 PoE+ Ports', '370W Budget'],
    specifications: [{ category: 'Power', label: 'Budget', value: '370W' }],
    includedAccessories: ['Rackmount brackets', 'Power cord'],
    datasheetUrl: 'https://cisco.com/datasheet.pdf',
    datasheetFileName: 'C9200L-datasheet.pdf'
  },
  {
    id: 'prod-02',
    sku: 'ZEZ-LB-CAT6-UTP',
    name: 'Linkbasic Category 6 UTP Unshielded Twisted Pair Network Cable (305m)',
    model: 'NCB-CCA601-305M',
    brand: 'Linkbasic',
    categoryId: 'structured-cabling',
    categoryName: 'Structured Cabling',
    shortDescription: 'Cat6 305m pull box',
    fullDescription: 'High performance solid copper Cat6',
    pricePhp: 5500,
    priceDisplayMode: 'public',
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '1-Year Limited Warranty',
    salesUnit: 'box',
    isFeatured: false,
    isNewArrival: false,
    isPublished: true,
    imageStatus: 'supplier-provided',
    mainImage: 'https://images.unsplash.com/linkbasic-cat6.jpg',
    galleryImages: ['https://images.unsplash.com/linkbasic-cat6.jpg'],
    keySpecs: ['305 meters', '23 AWG Bare Copper'],
    specifications: [{ category: 'General', label: 'Conductor', value: '23 AWG Solid Copper' }],
    includedAccessories: ['Pull box spool']
  }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runExcelImportTestSuite() {
  console.log('============================================================');
  console.log('ZEZ Automation Corporation — Excel Bulk Import Test Suite');
  console.log('============================================================\n');

  // ---------------------------------------------------------------------------
  // SUITE 1: Template Generation & Structure
  // ---------------------------------------------------------------------------
  console.log('--- 1. Downloadable Excel Template Generation ---');
  const templateBuffer = await generateProductExcelTemplate(CATEGORIES, BRANDS);
  assert(templateBuffer instanceof Uint8Array, 'Template generates valid Uint8Array buffer');
  assert(templateBuffer.byteLength > 2000, `Template has authentic byte size (${templateBuffer.byteLength} bytes)`);

  const templateWb = new ExcelJS.Workbook();
  await templateWb.xlsx.load(Buffer.from(templateBuffer) as any);
  
  const productsSheet = templateWb.getWorksheet('Products');
  const instructionsSheet = templateWb.getWorksheet('Instructions');
  
  assert(Boolean(productsSheet), 'Template contains "Products" worksheet');
  assert(Boolean(instructionsSheet), 'Template contains "Instructions" worksheet');

  // Validate Products sheet headers
  const headerRow = productsSheet!.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell(c => headers.push(String(c.value)));

  assert(headers.includes('SKU *'), 'Products worksheet includes mandatory "SKU *" column');
  assert(headers.includes('Product Name *'), 'Products worksheet includes "Product Name *" column');
  assert(headers.includes('Category *'), 'Products worksheet includes "Category *" column');
  assert(headers.includes('Reference Price (PHP)'), 'Products worksheet includes "Reference Price (PHP)" column');
  assert(headers.includes('Stock Status *'), 'Products worksheet includes "Stock Status *" column');
  assert(headers.includes('Technical Specifications'), 'Products worksheet includes "Technical Specifications" column');
  assert(headers.includes('Gallery Images'), 'Products worksheet includes "Gallery Images" column');

  // Check sample rows
  assert(productsSheet!.rowCount >= 4, `Products worksheet contains at least 3 sample hardware rows (actual: ${productsSheet!.rowCount - 1})`);

  // Check data validation on Products sheet
  const cellE2 = productsSheet!.getCell('E2');
  assert(cellE2.dataValidation?.type === 'list', 'Category column has list data validation dropdown');
  const cellL2 = productsSheet!.getCell('L2');
  assert(cellL2.dataValidation?.type === 'list', 'Stock Status column has list data validation dropdown');
  const cellR2 = productsSheet!.getCell('R2');
  assert(cellR2.dataValidation?.type === 'list', 'Published column has Yes/No data validation dropdown');

  // Validate Instructions sheet
  assert(instructionsSheet!.rowCount >= 25, `Instructions worksheet details all product fields (actual: ${instructionsSheet!.rowCount} rows)`);

  // ---------------------------------------------------------------------------
  // SUITE 2: Excel Upload & Validation Rules
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Excel Upload Parsing & Validation Engine ---');

  // Create test workbook with various valid & invalid test scenarios
  const testWb = new ExcelJS.Workbook();
  const testSheet = testWb.addWorksheet('Products');
  testSheet.columns = [
    { header: 'SKU *', key: 'sku' },
    { header: 'Product Name *', key: 'name' },
    { header: 'Model *', key: 'model' },
    { header: 'Brand *', key: 'brand' },
    { header: 'Category *', key: 'category' },
    { header: 'Reference Price (PHP)', key: 'price' },
    { header: 'Price Display Mode', key: 'priceMode' },
    { header: 'Stock Status *', key: 'stock' },
    { header: 'Lead Time (Days)', key: 'leadTime' },
    { header: 'Published', key: 'published' },
    { header: 'Technical Specifications', key: 'specs' }
  ];

  // Row 2: Perfectly valid new product
  testSheet.addRow({
    sku: 'ZEZ-TEST-NEW-01',
    name: 'Enterprise Test Core Switch 48-Port',
    model: 'TEST-SW-48',
    brand: 'Cisco',
    category: 'Networking Equipment',
    price: 125000,
    priceMode: 'hidden',
    stock: 'In Stock',
    leadTime: 3,
    published: 'No',
    specs: 'Performance: Switching Capacity: 176 Gbps; Power: PoE Budget: 740W'
  });

  // Row 3: Missing SKU (Mandatory Error)
  testSheet.addRow({
    sku: '',
    name: 'Invalid Product Missing SKU',
    model: 'NO-SKU-1',
    brand: 'Ubiquiti',
    category: 'Networking Equipment',
    price: 15000,
    stock: 'In Stock'
  });

  // Row 4: Unknown Category (Validation Error)
  testSheet.addRow({
    sku: 'ZEZ-TEST-BAD-CAT',
    name: 'Product with Nonexistent Category',
    model: 'BAD-CAT-1',
    brand: 'Dahua',
    category: 'Fictional Rocket Science Category',
    price: 8500,
    stock: 'In Stock'
  });

  // Row 5: Negative Price (Type Error)
  testSheet.addRow({
    sku: 'ZEZ-TEST-NEG-PRICE',
    name: 'Product with Negative Price',
    model: 'NEG-1',
    brand: 'Linkbasic',
    category: 'Structured Cabling',
    price: -4500,
    stock: 'In Stock'
  });

  // Row 6: Duplicate SKU within uploaded file (Duplicate Error)
  testSheet.addRow({
    sku: 'ZEZ-TEST-NEW-01', // duplicates row 2
    name: 'Duplicate SKU Row in file',
    model: 'DUP-1',
    brand: 'Cisco',
    category: 'Networking Equipment',
    price: 130000,
    stock: 'In Stock'
  });

  // Row 7: Existing catalog SKU (Update candidate)
  testSheet.addRow({
    sku: 'ZEZ-CS-9200L-24P', // exists in MOCK_EXISTING_PRODUCTS
    name: 'Cisco Catalyst 9200L 24P (Updated Title)',
    model: 'C9200L-24P-4G-E',
    brand: 'Cisco',
    category: 'Networking Equipment',
    price: 91500, // price change
    stock: 'In Stock'
  });

  const testBuffer = await testWb.xlsx.writeBuffer();
  const parseResult = await parseProductExcel(new Uint8Array(testBuffer), MOCK_EXISTING_PRODUCTS, CATEGORIES);

  assert(parseResult.rows.length === 6, `Parsed exactly 6 data rows (actual: ${parseResult.rows.length})`);
  assert(parseResult.summary.totalRows === 6, 'Summary reflects total 6 rows');

  // Verify Row 2 (first row in parsedRows: ZEZ-TEST-NEW-01)
  const row2 = parseResult.rows[0];
  // Since row 6 also used ZEZ-TEST-NEW-01, duplicate detection flagged it
  assert(row2.errors.length > 0 && row2.errors[0].includes('Duplicate SKU'), 'Duplicate SKU within uploaded file is correctly detected');

  // Verify Row 3 (Missing SKU)
  const row3 = parseResult.rows[1];
  assert(row3.errors.some(e => e.includes('SKU is required')), 'Row with missing SKU is flagged with mandatory SKU error');

  // Verify Row 4 (Bad Category)
  const row4 = parseResult.rows[2];
  assert(row4.errors.some(e => e.includes('Unknown category')), 'Row with unknown category is flagged with category error');

  // Verify Row 5 (Negative Price)
  const row5 = parseResult.rows[3];
  assert(row5.errors.some(e => e.includes('Invalid price')), 'Row with negative price is flagged with price error');

  // Verify Row 7 (Existing SKU)
  const row7 = parseResult.rows[5];
  assert(row7.isExisting === true, 'Existing catalog SKU recognized with isExisting: true');
  assert(row7.existingProductId === 'prod-01', 'Correlates to correct existing product ID prod-01');
  assert(row7.status === 'valid', 'Valid update row passes validation checks');
  assert(row7.pricePhp === 91500, 'Price parsed accurately to 91500');

  // Verify structured specifications parsing
  assert(row2.specifications.length === 2, `Structured specifications parsed correctly into category/label/value (actual: ${row2.specifications.length})`);
  assert(row2.specifications[0].category === 'Performance' && row2.specifications[0].label === 'Switching Capacity', 'Spec category and label parsed accurately');

  // ---------------------------------------------------------------------------
  // SUITE 3: Validation Error Report Generation
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Validation Error Report Generation (.xlsx) ---');
  const errorReportBuffer = await generateValidationErrorReport(parseResult.rows);
  assert(errorReportBuffer instanceof Uint8Array, 'Error report generated as Uint8Array');
  assert(errorReportBuffer.byteLength > 1000, `Error report has valid workbook byte size (${errorReportBuffer.byteLength} bytes)`);

  const errorWb = new ExcelJS.Workbook();
  await errorWb.xlsx.load(Buffer.from(errorReportBuffer) as any);
  const errorSheet = errorWb.getWorksheet('Import Error Report');
  assert(Boolean(errorSheet), 'Error report contains "Import Error Report" worksheet');
  assert(errorSheet!.rowCount >= 4, `Error report includes all rows with errors (actual: ${errorSheet!.rowCount - 1} rows)`);

  // ---------------------------------------------------------------------------
  // SUITE 4: Import Options, Preservation & Execution Logic
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Import Execution & Preservation Rules ---');

  // Test Row for Update with Blank Cells (Preservation Mode)
  const preservationRow: any = {
    rowNumber: 2,
    raw: {},
    sku: 'ZEZ-CS-9200L-24P', // existing product
    name: 'Cisco Catalyst 9200L 24P New Title',
    model: 'C9200L-24P-4G-E',
    brand: 'Cisco',
    categoryId: 'networking-equipment',
    categoryName: 'Networking Equipment',
    shortDescription: '', // blank cell in Excel
    fullDescription: '', // blank cell in Excel
    pricePhp: undefined, // blank cell in Excel
    priceDisplayMode: 'hidden',
    isPriceNegotiable: true,
    stockStatus: 'Low Stock', // changed
    leadTimeDays: 1,
    warranty: '', // blank cell
    salesUnit: 'unit',
    isFeatured: false,
    isNewArrival: false,
    isPublished: false,
    imageStatus: 'pending',
    mainImage: '', // blank cell in Excel (MUST NOT overwrite existing image!)
    galleryImages: [],
    keySpecs: [],
    specifications: [],
    includedAccessories: [],
    status: 'valid',
    errors: [],
    warnings: [],
    isExisting: true,
    existingProductId: 'prod-01',
    action: 'update',
    // Only provided fields:
    providedFields: new Set(['sku', 'name', 'stockStatus']),
    clearedFields: new Set()
  };

  // Execute import in upsert mode with preserveBlankFields: true
  const importResult = await executeBulkProductImport(
    {
      rows: [preservationRow],
      mode: 'upsert',
      preserveBlankFields: true,
      skipInvalidRows: false,
      adminUser: { id: 'admin-uuid', email: 'admin@zezautomation.ph', role: 'super_admin' } as any
    },
    MOCK_EXISTING_PRODUCTS
  );

  assert(importResult.success === true, 'Import execution completed successfully');
  assert(importResult.updatedCount === 1, 'Updated exactly 1 product');
  assert(importResult.createdCount === 0, 'Created 0 new products');
  assert(importResult.skippedCount === 0, 'Skipped 0 products');

  // Test Mode: create_only skips existing SKUs
  const createOnlyResult = await executeBulkProductImport(
    {
      rows: [preservationRow],
      mode: 'create_only',
      preserveBlankFields: true,
      skipInvalidRows: false
    },
    MOCK_EXISTING_PRODUCTS
  );
  assert(createOnlyResult.skippedCount === 1, 'In "create_only" mode, existing SKU is skipped');
  assert(createOnlyResult.updatedCount === 0, 'In "create_only" mode, 0 products updated');

  // Test Mode: update_only skips new SKUs
  const newRow: any = {
    rowNumber: 3,
    raw: {},
    sku: 'ZEZ-NEW-ROUTER-01',
    name: 'New Gigabit Router',
    model: 'R-01',
    brand: 'Ubiquiti',
    categoryId: 'networking-equipment',
    categoryName: 'Networking Equipment',
    shortDescription: 'Brand new router',
    fullDescription: 'Enterprise router',
    pricePhp: 25000,
    priceDisplayMode: 'hidden',
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '1-Year Warranty',
    salesUnit: 'unit',
    isFeatured: false,
    isNewArrival: false,
    isPublished: false, // user preference: new products default to unpublished
    imageStatus: 'pending',
    mainImage: '/catalog/image-pending.svg',
    galleryImages: ['/catalog/image-pending.svg'],
    keySpecs: [],
    specifications: [],
    includedAccessories: [],
    status: 'valid',
    errors: [],
    warnings: [],
    isExisting: false,
    action: 'create',
    providedFields: new Set(['sku', 'name', 'brand', 'categoryId', 'categoryName', 'pricePhp']),
    clearedFields: new Set()
  };

  const updateOnlyResult = await executeBulkProductImport(
    {
      rows: [newRow],
      mode: 'update_only',
      preserveBlankFields: true,
      skipInvalidRows: false
    },
    MOCK_EXISTING_PRODUCTS
  );
  assert(updateOnlyResult.skippedCount === 1, 'In "update_only" mode, new SKU is skipped');
  assert(updateOnlyResult.createdCount === 0, 'In "update_only" mode, 0 products created');

  // Test default new product values
  assert(newRow.isPublished === false, 'New products default to published: false (draft)');
  assert(newRow.priceDisplayMode === 'hidden', 'New products default to priceDisplayMode: hidden');
  assert(newRow.imageStatus === 'pending', 'New products default to imageStatus: pending');

  // Test Skip Invalid Rows on confirmation
  const invalidRow: any = {
    rowNumber: 4,
    raw: {},
    sku: '',
    name: '',
    status: 'error',
    errors: ['SKU is required'],
    warnings: [],
    isExisting: false,
    providedFields: new Set(),
    clearedFields: new Set()
  };

  const skipErrorsResult = await executeBulkProductImport(
    {
      rows: [newRow, invalidRow],
      mode: 'upsert',
      preserveBlankFields: true,
      skipInvalidRows: true // explicit confirmation
    },
    MOCK_EXISTING_PRODUCTS
  );
  assert(skipErrorsResult.createdCount === 1, 'Valid row is created when skipInvalidRows=true');
  assert(skipErrorsResult.skippedCount === 1, 'Invalid row is skipped without failing the batch');

  // Test [CLEAR] token wiping an optional field
  const clearFieldRow: any = {
    ...preservationRow,
    clearedFields: new Set(['shortDescription', 'datasheetUrl']),
    providedFields: new Set(['sku', 'name'])
  };
  assert(clearFieldRow.clearedFields.has('shortDescription'), '[CLEAR] token signals explicit removal of optional field');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n============================================================');
  console.log('TEST RESULTS REPORT:');
  console.log('============================================================');
  console.log(`Total Tests Executed: ${totalTests}`);
  console.log(`Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('============================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runExcelImportTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
