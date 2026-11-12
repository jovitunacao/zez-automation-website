import ExcelJS from 'exceljs';
import { 
  Product, 
  ProductCategory, 
  Brand, 
  ProductSpecification, 
  StockStatus, 
  PriceDisplayMode, 
  ProductImageStatus 
} from '../types';
import { 
  ParsedImportRow, 
  ImportValidationSummary, 
  ImportExecutionOptions, 
  BulkImportSummary, 
  ImportResultItem,
  ImportMode
} from '../types/excelImport';
import { 
  createProductInSupabase, 
  updateProductInSupabase 
} from './supabaseService';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

// -----------------------------------------------------------------------------
// CONSTANTS & ALLOWED VALUES
// -----------------------------------------------------------------------------
export const ALLOWED_STOCK_STATUSES: StockStatus[] = [
  'In Stock',
  'Pre-Order (5-7 Days)',
  'Low Stock',
  'Contact for Availability'
];

export const ALLOWED_PRICE_DISPLAY_MODES: PriceDisplayMode[] = [
  'hidden',
  'public',
  'starting'
];

export const ALLOWED_IMAGE_STATUSES: ProductImageStatus[] = [
  'pending',
  'illustrative',
  'supplier-provided',
  'manufacturer-matched'
];

export const CLEAR_TOKEN = '[CLEAR]';
export const ALT_CLEAR_TOKEN = '__CLEAR__';

// Helper to sanitize cell values from ExcelJS
function getCellString(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) return '';
  if (typeof cell.value === 'object') {
    // Rich text or formula result
    if ('text' in cell.value && typeof (cell.value as any).text === 'string') {
      return (cell.value as any).text.trim();
    }
    if ('result' in cell.value && cell.value.result !== null && cell.value.result !== undefined) {
      return String(cell.value.result).trim();
    }
    return String(cell.text || '').trim();
  }
  return String(cell.value).trim();
}

function getCellNumber(cell: ExcelJS.Cell): number | undefined {
  if (cell.value === null || cell.value === undefined || cell.value === '') return undefined;
  if (typeof cell.value === 'number') {
    return isNaN(cell.value) ? undefined : cell.value;
  }
  const str = getCellString(cell).replace(/[^0-9.-]+/g, '');
  if (!str) return undefined;
  const num = Number(str);
  return isNaN(num) ? undefined : num;
}

function parseBooleanValue(val: string, defaultVal = false): boolean {
  if (!val) return defaultVal;
  const lower = val.toLowerCase().trim();
  if (['yes', 'true', '1', 'y', 'published', 'featured'].includes(lower)) return true;
  if (['no', 'false', '0', 'n', 'unpublished', 'archived'].includes(lower)) return false;
  return defaultVal;
}

// -----------------------------------------------------------------------------
// 1. GENERATE EXCEL TEMPLATE
// -----------------------------------------------------------------------------
export async function generateProductExcelTemplate(
  categories: ProductCategory[],
  brands: Brand[]
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ZEZ Automation Corporation';
  workbook.lastModifiedBy = 'ZEZ Operations Portal';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ---------------------------------------------------------------------------
  // WORKSHEET 1: PRODUCTS
  // ---------------------------------------------------------------------------
  const sheet = workbook.addWorksheet('Products', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // Define Columns
  sheet.columns = [
    { header: 'SKU *', key: 'sku', width: 22 },
    { header: 'Product Name *', key: 'name', width: 36 },
    { header: 'Model *', key: 'model', width: 20 },
    { header: 'Brand *', key: 'brand', width: 18 },
    { header: 'Category *', key: 'categoryName', width: 26 },
    { header: 'Category ID', key: 'categoryId', width: 22 },
    { header: 'Short Description', key: 'shortDescription', width: 38 },
    { header: 'Full Description', key: 'fullDescription', width: 45 },
    { header: 'Reference Price (PHP)', key: 'pricePhp', width: 22 },
    { header: 'Price Display Mode', key: 'priceDisplayMode', width: 20 },
    { header: 'Price Negotiable', key: 'isPriceNegotiable', width: 18 },
    { header: 'Stock Status *', key: 'stockStatus', width: 24 },
    { header: 'Lead Time (Days)', key: 'leadTimeDays', width: 18 },
    { header: 'Warranty', key: 'warranty', width: 24 },
    { header: 'Sales Unit', key: 'salesUnit', width: 16 },
    { header: 'Featured', key: 'isFeatured', width: 14 },
    { header: 'New Arrival', key: 'isNewArrival', width: 14 },
    { header: 'Published', key: 'isPublished', width: 14 },
    { header: 'Image Status', key: 'imageStatus', width: 22 },
    { header: 'Main Image URL', key: 'mainImage', width: 34 },
    { header: 'Gallery Images', key: 'galleryImages', width: 40 },
    { header: 'Key Specs', key: 'keySpecs', width: 42 },
    { header: 'Technical Specifications', key: 'specifications', width: 46 },
    { header: 'Included Accessories', key: 'includedAccessories', width: 34 },
    { header: 'Datasheet URL', key: 'datasheetUrl', width: 34 },
    { header: 'Datasheet File Name', key: 'datasheetFileName', width: 26 }
  ];

  // Header row styling
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF292F36' } // ZEZ Dark Slate Charcoal
    };
    cell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FFB5121B' } }, // ZEZ Crimson accent
      right: { style: 'thin', color: { argb: 'FF3E454F' } }
    };
  });

  // Example Enterprise Rows
  const sampleRows = [
    {
      sku: 'ZEZ-LB-CAT6-UTP',
      name: 'Linkbasic Category 6 UTP Unshielded Twisted Pair Network Cable (305m)',
      model: 'NCB-CCA601-305M',
      brand: 'Linkbasic',
      categoryName: 'Structured Cabling',
      categoryId: 'structured-cabling',
      shortDescription: 'Certified Cat6 solid copper 305m pull-box for high-density commercial horizontal cabling.',
      fullDescription: 'High-performance Category 6 4-pair unshielded twisted pair cable engineered for Gigabit Ethernet backbones and gigabit workstation drops. Exceeds TIA/EIA-568-C.2 standards.',
      pricePhp: 5500,
      priceDisplayMode: 'hidden',
      isPriceNegotiable: 'Yes',
      stockStatus: 'In Stock',
      leadTimeDays: 1,
      warranty: '1-Year Limited Warranty',
      salesUnit: 'box',
      isFeatured: 'No',
      isNewArrival: 'No',
      isPublished: 'No',
      imageStatus: 'pending',
      mainImage: '/catalog/image-pending.svg',
      galleryImages: '',
      keySpecs: '305-meter easy pull box; 23 AWG Solid Bare Copper; Exceeds ANSI/TIA-568-C.2 specs; RoHS & ISO certified',
      specifications: 'General: Conductor: 23 AWG Solid Copper; General: Length: 305 meters (1000 ft); Electrical: Frequency: Up to 250 MHz; Jacket: Material: PVC CM Rated',
      includedAccessories: 'Pull-box dispensing spool',
      datasheetUrl: '',
      datasheetFileName: ''
    },
    {
      sku: 'ZEZ-CS-9200L-24P',
      name: 'Cisco Catalyst 9200L 24-Port Gigabit PoE+ Managed Switch',
      model: 'C9200L-24P-4G-E',
      brand: 'Cisco',
      categoryName: 'Networking Equipment',
      categoryId: 'networking-equipment',
      shortDescription: 'Enterprise Layer 3 managed access switch with 24 PoE+ ports (370W) and 4x 1G SFP uplinks.',
      fullDescription: 'Cisco Catalyst 9200 Series switches extend the power of intent-based networking and Catalyst 9000 hardware innovation to a broader scale. Full PoE+ capability with resilient power supply options.',
      pricePhp: 89500,
      priceDisplayMode: 'hidden',
      isPriceNegotiable: 'Yes',
      stockStatus: 'In Stock',
      leadTimeDays: 1,
      warranty: '3-Year Manufacturer Warranty',
      salesUnit: 'unit',
      isFeatured: 'Yes',
      isNewArrival: 'No',
      isPublished: 'No',
      imageStatus: 'pending',
      mainImage: '/catalog/image-pending.svg',
      galleryImages: '',
      keySpecs: '24x 10/100/1000 Gigabit PoE+ Ports; 370W Total PoE Power Budget; 4x 1G Fixed SFP Uplinks; Network Essentials License',
      specifications: 'Performance: Forwarding Rate: 41.66 Mpps; Performance: Switching Capacity: 56 Gbps; Power: PoE Budget: 370W; Physical: Form Factor: 1U Rackmount',
      includedAccessories: '19-inch rackmount brackets; Console cable; AC power cord',
      datasheetUrl: '',
      datasheetFileName: ''
    },
    {
      sku: 'ZEZ-UB-U6-ENT',
      name: 'Ubiquiti UniFi U6 Enterprise Wi-Fi 6E Tri-Band Access Point',
      model: 'U6-Enterprise',
      brand: 'Ubiquiti',
      categoryName: 'Networking Equipment',
      categoryId: 'networking-equipment',
      shortDescription: 'High-density ceiling-mounted Wi-Fi 6E AP featuring 10.2 Gbps aggregate throughput and 2.5 GbE uplink.',
      fullDescription: 'Tri-band access point designed for high-density corporate environments. Supports 6 GHz, 5 GHz, and 2.4 GHz frequency bands with 600+ concurrent client capacity.',
      pricePhp: 22800,
      priceDisplayMode: 'hidden',
      isPriceNegotiable: 'Yes',
      stockStatus: 'Pre-Order (5-7 Days)',
      leadTimeDays: 5,
      warranty: '1-Year Limited Warranty',
      salesUnit: 'unit',
      isFeatured: 'No',
      isNewArrival: 'Yes',
      isPublished: 'No',
      imageStatus: 'pending',
      mainImage: '/catalog/image-pending.svg',
      galleryImages: '',
      keySpecs: 'Wi-Fi 6E (6 GHz band support); 10.2 Gbps aggregate throughput; 1x 2.5 GbE PoE+ RJ45 port; Powered via 802.3at PoE+',
      specifications: 'Wireless: Wi-Fi Standards: 802.11ax/ac/n/g/b/a; Wireless: Maximum Data Rate: 10.2 Gbps; Network: Interface: 1x 2.5 GbE RJ45; Power: Power Method: PoE+ 802.3at',
      includedAccessories: 'Wall and ceiling mounting kit; Backplate; Level kit',
      datasheetUrl: '',
      datasheetFileName: ''
    }
  ];

  sampleRows.forEach((r) => {
    const row = sheet.addRow(r);
    row.height = 22;
    row.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
    });
  });

  // Prepare Dropdown Lists for Data Validation
  const categoryNamesList = categories.map(c => c.name).join(',');
  const stockStatusesList = ALLOWED_STOCK_STATUSES.join(',');
  const priceModesList = ALLOWED_PRICE_DISPLAY_MODES.join(',');
  const yesNoList = 'Yes,No';
  const imageStatusList = ALLOWED_IMAGE_STATUSES.join(',');

  // Apply Data Validation dropdowns to rows 2 through 1000
  for (let rowIdx = 2; rowIdx <= 1000; rowIdx++) {
    // Column E: Category Name
    sheet.getCell(`E${rowIdx}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${categoryNamesList}"`]
    };

    // Column J: Price Display Mode
    sheet.getCell(`J${rowIdx}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${priceModesList}"`]
    };

    // Column K: Price Negotiable
    sheet.getCell(`K${rowIdx}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${yesNoList}"`]
    };

    // Column L: Stock Status
    sheet.getCell(`L${rowIdx}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${stockStatusesList}"`]
    };

    // Column P: Featured
    sheet.getCell(`P${rowIdx}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${yesNoList}"`]
    };

    // Column Q: New Arrival
    sheet.getCell(`Q${rowIdx}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${yesNoList}"`]
    };

    // Column R: Published
    sheet.getCell(`R${rowIdx}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${yesNoList}"`]
    };

    // Column S: Image Status
    sheet.getCell(`S${rowIdx}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${imageStatusList}"`]
    };
  }

  // ---------------------------------------------------------------------------
  // WORKSHEET 2: INSTRUCTIONS & FIELD GUIDE
  // ---------------------------------------------------------------------------
  const guideSheet = workbook.addWorksheet('Instructions');
  guideSheet.views = [{ state: 'frozen', ySplit: 2 }];

  guideSheet.columns = [
    { header: '', key: 'colA', width: 28 },
    { header: '', key: 'colB', width: 18 },
    { header: '', key: 'colC', width: 16 },
    { header: '', key: 'colD', width: 22 },
    { header: '', key: 'colE', width: 65 }
  ];

  // Header Title
  const titleRow = guideSheet.getRow(1);
  titleRow.getCell(1).value = 'ZEZ AUTOMATION CORPORATION — EXCEL PRODUCT IMPORT GUIDE';
  titleRow.getCell(1).font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFB5121B' } };
  titleRow.height = 28;

  const descRow = guideSheet.getRow(2);
  descRow.getCell(1).value = 'Standardized B2B Equipment Catalog Import Specification. Use this guide to prepare your bulk .xlsx upload.';
  descRow.getCell(1).font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF4B5563' } };
  descRow.height = 20;

  // Table header for fields
  const fieldsHeaderRow = guideSheet.getRow(4);
  fieldsHeaderRow.getCell(1).value = 'Column Header';
  fieldsHeaderRow.getCell(2).value = 'Data Type';
  fieldsHeaderRow.getCell(3).value = 'Required?';
  fieldsHeaderRow.getCell(4).value = 'Default Value';
  fieldsHeaderRow.getCell(5).value = 'Field Rules, Formatting & Examples';

  fieldsHeaderRow.height = 24;
  for (let c = 1; c <= 5; c++) {
    const cell = fieldsHeaderRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF292F36' } };
    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  const fieldDefinitions = [
    ['SKU *', 'Text', 'REQUIRED', 'None', 'Unique inventory SKU (e.g. ZEZ-CS-9200L-24P). Key identifier used for matching existing products in updates.'],
    ['Product Name *', 'Text', 'REQUIRED', 'None', 'Full commercial product title as shown to customers (e.g. Cisco Catalyst 9200L 24-Port Gigabit PoE+ Managed Switch).'],
    ['Model *', 'Text', 'REQUIRED', 'None', 'Manufacturer hardware model number or product code (e.g. C9200L-24P-4G-E).'],
    ['Brand *', 'Text', 'REQUIRED', 'None', 'Manufacturer or brand name (e.g. Cisco, Ubiquiti, Linkbasic, Hikvision, APC).'],
    ['Category *', 'Dropdown', 'REQUIRED', 'None', 'Product category. Select from dropdown or match name exactly (e.g. Structured Cabling, Networking Equipment).'],
    ['Category ID', 'Text', 'Optional', 'Auto-resolved', 'Slug identifier (e.g. structured-cabling). If left blank, automatically resolved from Category Name.'],
    ['Short Description', 'Text', 'Optional', 'Empty', 'Brief 1-2 sentence commercial overview displayed on product cards and quotation line items.'],
    ['Full Description', 'Text', 'Optional', 'Empty', 'Detailed technical description, engineering capabilities, and distributor commercial scope.'],
    ['Reference Price (PHP)', 'Number', 'Optional', 'None', 'Distributor reference SRP in Philippine Pesos (e.g. 89500). Leave blank if Price on Request.'],
    ['Price Display Mode', 'Dropdown', 'Optional', 'hidden', 'Choose "hidden" (Price on Request), "public" (shows price), or "starting" (Starting at ₱...).'],
    ['Price Negotiable', 'Dropdown', 'Optional', 'Yes', '"Yes" or "No". Indicates if B2B volume pricing and project discounts apply.'],
    ['Stock Status *', 'Dropdown', 'REQUIRED', 'In Stock', 'Choose "In Stock", "Pre-Order (5-7 Days)", "Low Stock", or "Contact for Availability".'],
    ['Lead Time (Days)', 'Number', 'Optional', '1', 'Estimated fulfillment lead time in business days. Default is 1 day for in-stock equipment.'],
    ['Warranty', 'Text', 'Optional', '1-Year Warranty', 'Warranty period (e.g. "1-Year Limited Warranty", "3-Year Manufacturer Warranty").'],
    ['Sales Unit', 'Text', 'Optional', 'unit', 'Billing unit of measurement (e.g. "unit", "box", "meter", "roll", "set", "pack").'],
    ['Featured', 'Dropdown', 'Optional', 'No', '"Yes" or "No". Highlights product in the homepage showroom and featured carousel.'],
    ['New Arrival', 'Dropdown', 'Optional', 'No', '"Yes" or "No". Displays "New Arrival" badge on product cards.'],
    ['Published', 'Dropdown', 'Optional', 'No', '"Yes" or "No". Default is "No" for newly imported items to allow internal review before public listing.'],
    ['Image Status', 'Dropdown', 'Optional', 'pending', '"pending", "illustrative", "supplier-provided", or "manufacturer-matched". Default is "pending".'],
    ['Main Image URL', 'Text/URL', 'Optional', '/catalog/image-pending.svg', 'Direct URL to primary product photo. Leave blank to default to safe pending placeholder.'],
    ['Gallery Images', 'Text', 'Optional', 'Empty', 'Additional product photo URLs separated by semicolon (;) or newline.'],
    ['Key Specs', 'Text', 'Optional', 'Empty', 'Bulleted feature highlights separated by semicolon (;) or newline (e.g. "24 PoE+ Ports; 370W Budget").'],
    ['Technical Specifications', 'Text', 'Optional', 'Empty', 'Structured specs. Format: "Category: Label: Value; Category: Label: Value" (e.g. "General: Ports: 24; Power: Budget: 370W").'],
    ['Included Accessories', 'Text', 'Optional', 'Empty', 'Box contents separated by semicolon (;) or newline (e.g. "Rackmount brackets; Power cord").'],
    ['Datasheet URL', 'Text/URL', 'Optional', 'Empty', 'URL to downloadable PDF technical specifications or manufacturer cut-sheet.'],
    ['Datasheet File Name', 'Text', 'Optional', 'Empty', 'Clean label for datasheet download (e.g. "Cisco-Catalyst-9200L-Datasheet.pdf").']
  ];

  fieldDefinitions.forEach((def, idx) => {
    const row = guideSheet.getRow(5 + idx);
    row.getCell(1).value = def[0];
    row.getCell(2).value = def[1];
    row.getCell(3).value = def[2];
    row.getCell(4).value = def[3];
    row.getCell(5).value = def[4];
    row.height = 20;

    for (let c = 1; c <= 5; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
      if (def[2] === 'REQUIRED') {
        row.getCell(1).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFB5121B' } };
        row.getCell(3).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFB5121B' } };
      }
    }
  });

  // Instructions on Update Behavior
  const startNotesRow = 5 + fieldDefinitions.length + 2;
  const updateGuideHeader = guideSheet.getRow(startNotesRow);
  updateGuideHeader.getCell(1).value = 'PRODUCT UPDATE RULES (HOW BLANK CELLS ARE HANDLED)';
  updateGuideHeader.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF111827' } };

  const updateRules = [
    ['1. BLANK CELLS (PRESERVE MODE)', 'When updating existing products by SKU, leaving a cell blank preserves the existing value in the database. Product images, descriptions, and published status are NOT deleted by blank cells.'],
    ['2. CLEARING A FIELD ([CLEAR])', `To intentionally empty an optional field on an existing product, enter "${CLEAR_TOKEN}" or "${ALT_CLEAR_TOKEN}" in that cell.`],
    ['3. REPLACING A FIELD', 'Entering any new text or number replaces the previous value in the database upon import.'],
    ['4. NEW PRODUCTS DEFAULT SETTINGS', 'All newly created products default to Published: "No" and Price Display Mode: "hidden" to safeguard against accidental exposure before internal pricing and photograph audit.'],
    ['5. NO EXTERNAL NETWORK CALLS', 'The import engine parses image and datasheet URLs safely without performing automated external HTTP image downloads during parsing.']
  ];

  updateRules.forEach((rule, i) => {
    const r = guideSheet.getRow(startNotesRow + 1 + i);
    r.getCell(1).value = rule[0];
    r.getCell(1).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFB5121B' } };
    r.getCell(2).value = rule[1];
    r.getCell(2).font = { name: 'Segoe UI', size: 9 };
    guideSheet.mergeCells(r.number, 2, r.number, 5);
    r.height = 20;
  });

  // Valid Categories Reference Table
  const catRefStart = startNotesRow + updateRules.length + 3;
  const catRefHeader = guideSheet.getRow(catRefStart);
  catRefHeader.getCell(1).value = 'VALID CATALOG CATEGORIES REFERENCE';
  catRefHeader.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF111827' } };

  categories.forEach((cat, idx) => {
    const r = guideSheet.getRow(catRefStart + 1 + idx);
    r.getCell(1).value = cat.name;
    r.getCell(1).font = { name: 'Segoe UI', size: 9, bold: true };
    r.getCell(2).value = `ID: ${cat.id}`;
    r.getCell(2).font = { name: 'Consolas', size: 9, color: { argb: 'FF4B5563' } };
    r.getCell(3).value = `${cat.itemCount || 0} items`;
    r.getCell(3).font = { name: 'Segoe UI', size: 9, color: { argb: 'FF6B7280' } };
    r.getCell(4).value = (cat.subcategories || []).slice(0, 3).join(', ');
    r.getCell(4).font = { name: 'Segoe UI', size: 8, italic: true };
    guideSheet.mergeCells(r.number, 4, r.number, 5);
    r.height = 18;
  });

  // Write workbook to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

// -----------------------------------------------------------------------------
// 2. PARSE EXCEL WORKBOOK & CLIENT-SIDE VALIDATION
// -----------------------------------------------------------------------------
export async function parseProductExcel(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  existingProducts: Product[],
  categories: ProductCategory[]
): Promise<{ rows: ParsedImportRow[]; summary: ImportValidationSummary }> {
  const workbook = new ExcelJS.Workbook();

  let arrayBuffer: ArrayBuffer;
  if (fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof Uint8Array) {
    arrayBuffer = fileOrBuffer.buffer.slice(
      fileOrBuffer.byteOffset,
      fileOrBuffer.byteOffset + fileOrBuffer.byteLength
    ) as ArrayBuffer;
  } else {
    arrayBuffer = fileOrBuffer;
  }

  await workbook.xlsx.load(arrayBuffer);

  // Look for "Products" sheet or fallback to first sheet
  const sheet = workbook.getWorksheet('Products') || workbook.worksheets[0];
  if (!sheet) {
    throw new Error('Invalid Excel file: No worksheets found in the uploaded workbook.');
  }

  // 1. Map Header Columns (Row 1)
  const headerMap = new Map<string, number>();
  const firstRow = sheet.getRow(1);
  firstRow.eachCell((cell, colNumber) => {
    const rawHeader = getCellString(cell)
      .toLowerCase()
      .replace(/[*()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (rawHeader) {
      headerMap.set(rawHeader, colNumber);
    }
  });

  // Column resolution helper with aliases
  const getCol = (...aliases: string[]): number | undefined => {
    for (const a of aliases) {
      const normalized = a.toLowerCase().replace(/[*()]/g, '').replace(/\s+/g, ' ').trim();
      if (headerMap.has(normalized)) return headerMap.get(normalized);
    }
    // Partial substring match
    for (const [key, col] of headerMap.entries()) {
      for (const a of aliases) {
        const normalized = a.toLowerCase().replace(/[*()]/g, '').trim();
        if (key.includes(normalized) || normalized.includes(key)) return col;
      }
    }
    return undefined;
  };

  const colSku = getCol('sku', 'item code', 'part number');
  const colName = getCol('product name', 'name', 'item name', 'title');
  const colModel = getCol('model', 'model number', 'model code');
  const colBrand = getCol('brand', 'manufacturer', 'vendor');
  const colCategory = getCol('category', 'category name');
  const colCategoryId = getCol('category id', 'category_id', 'category slug');
  const colShortDesc = getCol('short description', 'short desc', 'summary');
  const colFullDesc = getCol('full description', 'description', 'full desc');
  const colPrice = getCol('reference price php', 'reference price', 'price php', 'price', 'srp');
  const colPriceMode = getCol('price display mode', 'price display', 'pricing mode');
  const colPriceNeg = getCol('price negotiable', 'negotiable');
  const colStock = getCol('stock status', 'stock', 'availability');
  const colLeadTime = getCol('lead time days', 'lead time', 'lead days');
  const colWarranty = getCol('warranty', 'warranty period');
  const colSalesUnit = getCol('sales unit', 'unit', 'uom');
  const colFeatured = getCol('featured', 'is featured');
  const colNewArrival = getCol('new arrival', 'is new arrival', 'new');
  const colPublished = getCol('published', 'is published', 'publish');
  const colImageStatus = getCol('image status', 'photo status');
  const colMainImage = getCol('main image url', 'main image', 'image url', 'photo');
  const colGallery = getCol('gallery images', 'gallery', 'other images');
  const colKeySpecs = getCol('key specs', 'bullet points', 'highlights');
  const colSpecs = getCol('technical specifications', 'specifications', 'specs');
  const colAccessories = getCol('included accessories', 'accessories', 'box contents');
  const colDatasheetUrl = getCol('datasheet url', 'datasheet', 'spec sheet');
  const colDatasheetName = getCol('datasheet file name', 'datasheet name');

  if (!colSku) {
    throw new Error('Invalid Excel template: Missing required "SKU" column header in worksheet.');
  }

  // Pre-index existing products by lowercase SKU
  const existingProductMap = new Map<string, Product>();
  existingProducts.forEach((p) => {
    if (p.sku) existingProductMap.set(p.sku.toLowerCase().trim(), p);
  });

  // Pre-index categories by name and by ID
  const categoryByName = new Map<string, ProductCategory>();
  const categoryById = new Map<string, ProductCategory>();
  categories.forEach((c) => {
    categoryByName.set(c.name.toLowerCase().trim(), c);
    categoryById.set(c.id.toLowerCase().trim(), c);
  });

  const parsedRows: ParsedImportRow[] = [];
  const seenFileSkus = new Map<string, number>(); // sku -> first rowNumber
  let newRowsCount = 0;
  let updateRowsCount = 0;
  let duplicateCount = 0;

  // Iterate sheet data rows (row 2 onwards)
  const totalRowsInSheet = sheet.rowCount;

  for (let r = 2; r <= totalRowsInSheet; r++) {
    const row = sheet.getRow(r);
    
    // Check if the row has any non-empty cell
    let hasAnyData = false;
    row.eachCell(() => { hasAnyData = true; });
    if (!hasAnyData) continue;

    const errors: string[] = [];
    const warnings: string[] = [];
    const providedFields = new Set<string>();
    const clearedFields = new Set<string>();

    const getVal = (col?: number): string => {
      if (!col) return '';
      const cell = row.getCell(col);
      const str = getCellString(cell);
      return str;
    };

    const hasProvided = (col?: number, fieldName?: string): string => {
      if (!col) return '';
      const val = getVal(col);
      if (val === CLEAR_TOKEN || val === ALT_CLEAR_TOKEN) {
        if (fieldName) clearedFields.add(fieldName);
        return '';
      }
      if (val !== '') {
        if (fieldName) providedFields.add(fieldName);
      }
      return val;
    };

    // Extract raw string values
    const rawSku = hasProvided(colSku, 'sku');
    const rawName = hasProvided(colName, 'name');
    const rawModel = hasProvided(colModel, 'model');
    const rawBrand = hasProvided(colBrand, 'brand');
    const rawCategory = hasProvided(colCategory, 'categoryName');
    const rawCategoryId = hasProvided(colCategoryId, 'categoryId');
    const rawShortDesc = hasProvided(colShortDesc, 'shortDescription');
    const rawFullDesc = hasProvided(colFullDesc, 'fullDescription');
    const rawPrice = hasProvided(colPrice, 'pricePhp');
    const rawPriceMode = hasProvided(colPriceMode, 'priceDisplayMode');
    const rawPriceNeg = hasProvided(colPriceNeg, 'isPriceNegotiable');
    const rawStock = hasProvided(colStock, 'stockStatus');
    const rawLeadTime = hasProvided(colLeadTime, 'leadTimeDays');
    const rawWarranty = hasProvided(colWarranty, 'warranty');
    const rawSalesUnit = hasProvided(colSalesUnit, 'salesUnit');
    const rawFeatured = hasProvided(colFeatured, 'isFeatured');
    const rawNewArrival = hasProvided(colNewArrival, 'isNewArrival');
    const rawPublished = hasProvided(colPublished, 'isPublished');
    const rawImageStatus = hasProvided(colImageStatus, 'imageStatus');
    const rawMainImage = hasProvided(colMainImage, 'mainImage');
    const rawGallery = hasProvided(colGallery, 'galleryImages');
    const rawKeySpecs = hasProvided(colKeySpecs, 'keySpecs');
    const rawSpecs = hasProvided(colSpecs, 'specifications');
    const rawAccessories = hasProvided(colAccessories, 'includedAccessories');
    const rawDatasheetUrl = hasProvided(colDatasheetUrl, 'datasheetUrl');
    const rawDatasheetName = hasProvided(colDatasheetName, 'datasheetFileName');

    // 1. Mandatory Validations
    const cleanSku = rawSku.trim();
    if (!cleanSku) {
      errors.push('SKU is required and cannot be empty.');
    } else if (cleanSku.length > 50) {
      errors.push(`SKU exceeds maximum length of 50 characters (${cleanSku.length} chars).`);
    }

    // Check Duplicate SKU within this file
    if (cleanSku) {
      const lowerSku = cleanSku.toLowerCase();
      if (seenFileSkus.has(lowerSku)) {
        const prevRow = seenFileSkus.get(lowerSku)!;
        errors.push(`Duplicate SKU "${cleanSku}" within uploaded file (also appears on Row ${prevRow}).`);
        const earlierRow = parsedRows.find(p => p.rowNumber === prevRow);
        if (earlierRow && !earlierRow.errors.some(e => e.includes('Duplicate SKU'))) {
          earlierRow.errors.push(`Duplicate SKU "${cleanSku}" within uploaded file (also appears on Row ${r}).`);
          earlierRow.status = 'error';
        }
        duplicateCount++;
      } else {
        seenFileSkus.set(lowerSku, r);
      }
    }

    // Check if SKU exists in existing catalog/database
    const existing = cleanSku ? existingProductMap.get(cleanSku.toLowerCase()) : undefined;
    const isExisting = Boolean(existing);

    if (isExisting) {
      updateRowsCount++;
    } else {
      newRowsCount++;
    }

    // Product Name check
    const cleanName = rawName.trim();
    if (!cleanName && (!isExisting || clearedFields.has('name'))) {
      errors.push('Product Name is required.');
    } else if (cleanName.length > 255) {
      errors.push(`Product Name exceeds maximum length of 255 characters (${cleanName.length} chars).`);
    }

    // Model check
    const cleanModel = rawModel.trim();
    if (!cleanModel && !isExisting) {
      warnings.push('Model code is blank; defaulting to SKU.');
    }

    // Brand check
    const cleanBrand = rawBrand.trim();
    if (!cleanBrand && !isExisting) {
      errors.push('Brand is required for new equipment.');
    }

    // Category check
    let resolvedCategoryId = '';
    let resolvedCategoryName = '';

    const cleanCat = rawCategory.trim();
    const cleanCatId = rawCategoryId.trim();

    if (cleanCatId && categoryById.has(cleanCatId.toLowerCase())) {
      const matched = categoryById.get(cleanCatId.toLowerCase())!;
      resolvedCategoryId = matched.id;
      resolvedCategoryName = matched.name;
    } else if (cleanCat && categoryByName.has(cleanCat.toLowerCase())) {
      const matched = categoryByName.get(cleanCat.toLowerCase())!;
      resolvedCategoryId = matched.id;
      resolvedCategoryName = matched.name;
    } else if (!cleanCat && !cleanCatId) {
      if (!isExisting) {
        errors.push('Category is required. Select from the dropdown list.');
      }
    } else {
      errors.push(`Unknown category "${cleanCat || cleanCatId}". Must match one of the valid catalog categories.`);
    }

    // Price validation
    let parsedPrice: number | undefined = undefined;
    if (rawPrice) {
      const num = colPrice ? getCellNumber(row.getCell(colPrice)) : Number(rawPrice);
      if (num === undefined || isNaN(num) || num < 0) {
        errors.push(`Invalid price "${rawPrice}". Must be a non-negative number.`);
      } else {
        parsedPrice = Math.round(num * 100) / 100;
      }
    }

    // Price Display Mode
    let resolvedPriceMode: PriceDisplayMode = 'hidden';
    if (rawPriceMode) {
      const lowerMode = rawPriceMode.toLowerCase().trim() as PriceDisplayMode;
      if (ALLOWED_PRICE_DISPLAY_MODES.includes(lowerMode)) {
        resolvedPriceMode = lowerMode;
      } else {
        warnings.push(`Unrecognized price display mode "${rawPriceMode}". Defaulting to "hidden".`);
      }
    }

    // Stock Status
    let resolvedStock: StockStatus = 'In Stock';
    if (rawStock) {
      const matchedStock = ALLOWED_STOCK_STATUSES.find(
        s => s.toLowerCase() === rawStock.toLowerCase().trim()
      );
      if (matchedStock) {
        resolvedStock = matchedStock;
      } else {
        warnings.push(`Unrecognized stock status "${rawStock}". Defaulting to "In Stock".`);
      }
    } else if (!isExisting) {
      resolvedStock = 'In Stock';
    }

    // Lead Time Days
    let resolvedLeadTime = 1;
    if (rawLeadTime) {
      const days = parseInt(rawLeadTime, 10);
      if (isNaN(days) || days < 0) {
        warnings.push(`Invalid lead time "${rawLeadTime}". Defaulting to 1 day.`);
      } else {
        resolvedLeadTime = days;
      }
    }

    // Booleans
    const isPriceNegotiable = rawPriceNeg ? parseBooleanValue(rawPriceNeg, true) : true;
    const isFeatured = parseBooleanValue(rawFeatured, false);
    const isNewArrival = parseBooleanValue(rawNewArrival, false);
    // User preference: publish new products = false by default
    const isPublished = rawPublished ? parseBooleanValue(rawPublished, false) : false;

    // Image Status
    let resolvedImageStatus: ProductImageStatus = 'pending';
    if (rawImageStatus) {
      const lower = rawImageStatus.toLowerCase().trim() as ProductImageStatus;
      if (ALLOWED_IMAGE_STATUSES.includes(lower)) {
        resolvedImageStatus = lower;
      } else {
        warnings.push(`Unrecognized image status "${rawImageStatus}". Defaulting to "pending".`);
      }
    }

    // Main Image
    let resolvedMainImage = rawMainImage.trim();
    if (!resolvedMainImage && !isExisting) {
      resolvedMainImage = '/catalog/image-pending.svg';
      resolvedImageStatus = 'pending';
    } else if (resolvedMainImage && resolvedMainImage.startsWith('http')) {
      // Basic URL sanity check without network requests
      try {
        new URL(resolvedMainImage);
      } catch {
        warnings.push(`Main Image URL "${resolvedMainImage}" may not be a valid URL format.`);
      }
    }

    // Datasheet URL sanity check
    const cleanDatasheetUrl = rawDatasheetUrl.trim();
    if (cleanDatasheetUrl && cleanDatasheetUrl.startsWith('http')) {
      try {
        new URL(cleanDatasheetUrl);
      } catch {
        warnings.push(`Datasheet URL "${cleanDatasheetUrl}" may not be a valid URL format.`);
      }
    }

    // Array parsers: Gallery Images
    const parsedGalleryImages: string[] = rawGallery
      ? rawGallery.split(/[;\n\r]+/).map(s => s.trim()).filter(Boolean)
      : (resolvedMainImage ? [resolvedMainImage] : []);

    // Key Specs
    const parsedKeySpecs: string[] = rawKeySpecs
      ? rawKeySpecs.split(/[;\n\r]+/).map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
      : [];

    // Included Accessories
    const parsedAccessories: string[] = rawAccessories
      ? rawAccessories.split(/[;\n\r]+/).map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
      : [];

    // Specifications parser: "Category: Label: Value" or "Label: Value"
    const parsedSpecs: ProductSpecification[] = [];
    if (rawSpecs) {
      const specItems = rawSpecs.split(/[;\n\r]+/).map(s => s.trim()).filter(Boolean);
      for (const item of specItems) {
        const parts = item.split(':').map(p => p.trim());
        if (parts.length >= 3) {
          parsedSpecs.push({
            category: parts[0] || 'General',
            label: parts[1] || 'Spec',
            value: parts.slice(2).join(':').trim()
          });
        } else if (parts.length === 2) {
          parsedSpecs.push({
            category: 'General',
            label: parts[0] || 'Spec',
            value: parts[1] || ''
          });
        } else if (parts.length === 1 && parts[0]) {
          parsedSpecs.push({
            category: 'General',
            label: 'Detail',
            value: parts[0]
          });
        }
      }
    }

    const rowStatus = errors.length > 0 ? 'error' : (warnings.length > 0 ? 'warning' : 'valid');

    parsedRows.push({
      rowNumber: r,
      raw: {
        sku: rawSku,
        name: rawName,
        model: rawModel,
        brand: rawBrand,
        category: rawCategory,
        price: rawPrice
      },
      sku: cleanSku,
      name: cleanName || (existing ? existing.name : ''),
      model: cleanModel || (cleanSku || (existing ? existing.model : '')),
      brand: cleanBrand || (existing ? existing.brand : ''),
      categoryId: resolvedCategoryId || (existing ? existing.categoryId : ''),
      categoryName: resolvedCategoryName || (existing ? existing.categoryName : ''),
      shortDescription: rawShortDesc,
      fullDescription: rawFullDesc,
      pricePhp: parsedPrice,
      priceDisplayMode: resolvedPriceMode,
      isPriceNegotiable,
      stockStatus: resolvedStock,
      leadTimeDays: resolvedLeadTime,
      warranty: rawWarranty || (existing ? existing.warranty : '1-Year Warranty'),
      salesUnit: rawSalesUnit || (existing ? (existing.salesUnit || 'unit') : 'unit'),
      isFeatured,
      isNewArrival,
      isPublished,
      imageStatus: resolvedImageStatus,
      mainImage: resolvedMainImage,
      galleryImages: parsedGalleryImages,
      keySpecs: parsedKeySpecs,
      specifications: parsedSpecs,
      includedAccessories: parsedAccessories,
      datasheetUrl: cleanDatasheetUrl || undefined,
      datasheetFileName: rawDatasheetName.trim() || undefined,
      status: rowStatus,
      errors,
      warnings,
      isExisting,
      existingProductId: existing?.id,
      action: errors.length > 0 ? 'error' : (isExisting ? 'update' : 'create'),
      providedFields,
      clearedFields
    });
  }

  const validRowsCount = parsedRows.filter(r => r.status === 'valid').length;
  const errorRowsCount = parsedRows.filter(r => r.status === 'error').length;
  const warningRowsCount = parsedRows.filter(r => r.status === 'warning').length;

  const summary: ImportValidationSummary = {
    totalRows: parsedRows.length,
    validRows: validRowsCount,
    errorRows: errorRowsCount,
    warningRows: warningRowsCount,
    newRows: newRowsCount,
    updateRows: updateRowsCount,
    duplicateInFileRows: duplicateCount
  };

  return { rows: parsedRows, summary };
}

// -----------------------------------------------------------------------------
// 3. GENERATE VALIDATION ERROR REPORT WORKBOOK
// -----------------------------------------------------------------------------
export async function generateValidationErrorReport(
  rows: ParsedImportRow[]
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ZEZ Automation Corporation';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Import Error Report', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheet.columns = [
    { header: 'Row #', key: 'rowNum', width: 10 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Validation Errors & Issues', key: 'issues', width: 50 },
    { header: 'SKU', key: 'sku', width: 22 },
    { header: 'Product Name', key: 'name', width: 34 },
    { header: 'Brand', key: 'brand', width: 18 },
    { header: 'Category', key: 'category', width: 24 },
    { header: 'Price (PHP)', key: 'price', width: 16 },
    { header: 'Stock Status', key: 'stock', width: 22 }
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF292F36' } };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Filter rows with errors or warnings
  const problematicRows = rows.filter(r => r.errors.length > 0 || r.warnings.length > 0);

  problematicRows.forEach((row) => {
    const issuesList = [
      ...row.errors.map(e => `[ERROR] ${e}`),
      ...row.warnings.map(w => `[WARN] ${w}`)
    ].join('\n');

    const added = sheet.addRow({
      rowNum: row.rowNumber,
      status: row.status.toUpperCase(),
      issues: issuesList,
      sku: row.sku || '(Missing)',
      name: row.name || '(Missing)',
      brand: row.brand || '(Missing)',
      category: row.categoryName || '(Missing)',
      price: row.pricePhp !== undefined ? row.pricePhp : '(None)',
      stock: row.stockStatus
    });

    added.height = Math.max(22, (row.errors.length + row.warnings.length) * 16);

    const statusCell = added.getCell(2);
    if (row.status === 'error') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      statusCell.font = { color: { argb: 'FF991B1B' }, bold: true };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      statusCell.font = { color: { argb: 'FF92400E' }, bold: true };
    }

    added.getCell(3).alignment = { wrapText: true, vertical: 'middle' };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

// -----------------------------------------------------------------------------
// 4. BATCH IMPORT EXECUTION ENGINE
// -----------------------------------------------------------------------------
export async function executeBulkProductImport(
  options: ImportExecutionOptions,
  existingCatalog: Product[]
): Promise<BulkImportSummary> {
  const startTime = Date.now();
  const {
    rows,
    mode = 'upsert',
    preserveBlankFields = true,
    skipInvalidRows = false,
    adminUser,
    onProgress
  } = options;

  // Pre-index existing products by lowercase SKU
  const existingMap = new Map<string, Product>();
  existingCatalog.forEach(p => {
    if (p.sku) existingMap.set(p.sku.toLowerCase().trim(), p);
  });

  // Filter rows eligible for processing
  const eligibleRows: ParsedImportRow[] = [];
  const results: ImportResultItem[] = [];

  let skippedCount = 0;
  let failedCount = 0;
  let createdCount = 0;
  let updatedCount = 0;

  for (const row of rows) {
    // Check validation error
    if (row.errors.length > 0) {
      if (skipInvalidRows) {
        skippedCount++;
        results.push({
          rowNumber: row.rowNumber,
          sku: row.sku || 'N/A',
          name: row.name || 'Unknown',
          action: 'skipped',
          message: `Skipped due to validation errors: ${row.errors.join('; ')}`
        });
        continue;
      } else {
        failedCount++;
        results.push({
          rowNumber: row.rowNumber,
          sku: row.sku || 'N/A',
          name: row.name || 'Unknown',
          action: 'failed',
          message: `Validation rejection: ${row.errors.join('; ')}`,
          error: row.errors[0]
        });
        continue;
      }
    }

    const isExisting = row.sku ? existingMap.has(row.sku.toLowerCase().trim()) : false;

    // Check mode rules
    if (mode === 'create_only' && isExisting) {
      skippedCount++;
      results.push({
        rowNumber: row.rowNumber,
        sku: row.sku,
        name: row.name,
        action: 'skipped',
        message: `Skipped existing SKU in "Create New Only" mode.`
      });
      continue;
    }

    if (mode === 'update_only' && !isExisting) {
      skippedCount++;
      results.push({
        rowNumber: row.rowNumber,
        sku: row.sku,
        name: row.name,
        action: 'skipped',
        message: `Skipped new SKU in "Update Existing Only" mode.`
      });
      continue;
    }

    if (mode === 'skip_duplicates' && isExisting) {
      skippedCount++;
      results.push({
        rowNumber: row.rowNumber,
        sku: row.sku,
        name: row.name,
        action: 'skipped',
        message: `Skipped duplicate SKU in "Skip Duplicates" mode.`
      });
      continue;
    }

    eligibleRows.push(row);
  }

  const BATCH_SIZE = 25;
  const totalEligible = eligibleRows.length;

  for (let i = 0; i < totalEligible; i += BATCH_SIZE) {
    const batch = eligibleRows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(totalEligible / BATCH_SIZE);

    if (onProgress) {
      onProgress(
        i,
        totalEligible,
        `Processing batch ${batchNum} of ${totalBatches} (${batch.length} items)...`
      );
    }

    for (const row of batch) {
      const lowerSku = row.sku.toLowerCase().trim();
      const existingProduct = existingMap.get(lowerSku);

      try {
        if (existingProduct) {
          // UPDATE MODE with Preservation
          const updatedProduct: Product = {
            ...existingProduct,
            id: existingProduct.id,
            sku: row.sku,
            name: row.providedFields.has('name') ? row.name : existingProduct.name,
            model: row.providedFields.has('model') ? row.model : existingProduct.model,
            brand: row.providedFields.has('brand') ? row.brand : existingProduct.brand,
            categoryId: row.providedFields.has('categoryId') ? row.categoryId : existingProduct.categoryId,
            categoryName: row.providedFields.has('categoryName') ? row.categoryName : existingProduct.categoryName,
            shortDescription: row.clearedFields.has('shortDescription')
              ? ''
              : (row.providedFields.has('shortDescription') ? row.shortDescription : existingProduct.shortDescription),
            fullDescription: row.clearedFields.has('fullDescription')
              ? ''
              : (row.providedFields.has('fullDescription') ? row.fullDescription : existingProduct.fullDescription),
            pricePhp: row.clearedFields.has('pricePhp')
              ? undefined
              : (row.providedFields.has('pricePhp') ? row.pricePhp : existingProduct.pricePhp),
            priceDisplayMode: row.providedFields.has('priceDisplayMode')
              ? row.priceDisplayMode
              : (existingProduct.priceDisplayMode || 'hidden'),
            isPriceNegotiable: row.providedFields.has('isPriceNegotiable')
              ? row.isPriceNegotiable
              : (existingProduct.isPriceNegotiable ?? true),
            stockStatus: row.providedFields.has('stockStatus')
              ? row.stockStatus
              : existingProduct.stockStatus,
            leadTimeDays: row.providedFields.has('leadTimeDays')
              ? row.leadTimeDays
              : (existingProduct.leadTimeDays ?? 1),
            warranty: row.providedFields.has('warranty')
              ? row.warranty
              : existingProduct.warranty,
            salesUnit: row.providedFields.has('salesUnit')
              ? row.salesUnit
              : (existingProduct.salesUnit || 'unit'),
            isFeatured: row.providedFields.has('isFeatured')
              ? row.isFeatured
              : (existingProduct.isFeatured ?? false),
            isNewArrival: row.providedFields.has('isNewArrival')
              ? row.isNewArrival
              : (existingProduct.isNewArrival ?? false),
            isPublished: row.providedFields.has('isPublished')
              ? row.isPublished
              : (existingProduct.isPublished !== false),
            imageStatus: row.providedFields.has('imageStatus')
              ? row.imageStatus
              : (existingProduct.imageStatus || 'pending'),
            mainImage: row.providedFields.has('mainImage') && row.mainImage
              ? row.mainImage
              : existingProduct.mainImage,
            galleryImages: row.providedFields.has('galleryImages')
              ? row.galleryImages
              : existingProduct.galleryImages,
            keySpecs: row.providedFields.has('keySpecs')
              ? row.keySpecs
              : existingProduct.keySpecs,
            specifications: row.providedFields.has('specifications')
              ? row.specifications
              : existingProduct.specifications,
            includedAccessories: row.providedFields.has('includedAccessories')
              ? row.includedAccessories
              : existingProduct.includedAccessories,
            datasheetUrl: row.clearedFields.has('datasheetUrl')
              ? undefined
              : (row.providedFields.has('datasheetUrl') ? row.datasheetUrl : existingProduct.datasheetUrl),
            datasheetFileName: row.clearedFields.has('datasheetFileName')
              ? undefined
              : (row.providedFields.has('datasheetFileName') ? row.datasheetFileName : existingProduct.datasheetFileName)
          };

          const res = await updateProductInSupabase(updatedProduct);
          if (res.success) {
            updatedCount++;
            existingMap.set(lowerSku, updatedProduct);
            results.push({
              rowNumber: row.rowNumber,
              sku: row.sku,
              name: row.name,
              action: 'updated',
              message: `Updated existing product ${row.sku} successfully.`
            });
          } else {
            failedCount++;
            results.push({
              rowNumber: row.rowNumber,
              sku: row.sku,
              name: row.name,
              action: 'failed',
              message: `Failed to update product: ${res.error}`,
              error: res.error
            });
          }
        } else {
          // CREATE NEW PRODUCT
          const newProduct: Product = {
            id: `prod-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            sku: row.sku,
            name: row.name,
            model: row.model || row.sku,
            brand: row.brand,
            categoryId: row.categoryId,
            categoryName: row.categoryName,
            shortDescription: row.shortDescription,
            fullDescription: row.fullDescription,
            pricePhp: row.pricePhp,
            priceDisplayMode: row.priceDisplayMode || 'hidden',
            isPriceNegotiable: row.isPriceNegotiable,
            stockStatus: row.stockStatus,
            leadTimeDays: row.leadTimeDays,
            warranty: row.warranty || '1-Year Warranty',
            salesUnit: row.salesUnit || 'unit',
            isFeatured: row.isFeatured,
            isNewArrival: row.isNewArrival,
            isPublished: row.isPublished, // user preference: false
            imageStatus: row.imageStatus || 'pending',
            mainImage: row.mainImage || '/catalog/image-pending.svg',
            galleryImages: row.galleryImages.length > 0 ? row.galleryImages : [row.mainImage || '/catalog/image-pending.svg'],
            keySpecs: row.keySpecs,
            specifications: row.specifications,
            includedAccessories: row.includedAccessories,
            datasheetUrl: row.datasheetUrl,
            datasheetFileName: row.datasheetFileName
          };

          const res = await createProductInSupabase(newProduct);
          if (res.success) {
            createdCount++;
            existingMap.set(lowerSku, newProduct);
            results.push({
              rowNumber: row.rowNumber,
              sku: row.sku,
              name: row.name,
              action: 'created',
              message: `Created new product ${row.sku} successfully.`
            });
          } else {
            failedCount++;
            results.push({
              rowNumber: row.rowNumber,
              sku: row.sku,
              name: row.name,
              action: 'failed',
              message: `Failed to create product: ${res.error}`,
              error: res.error
            });
          }
        }
      } catch (err: any) {
        failedCount++;
        results.push({
          rowNumber: row.rowNumber,
          sku: row.sku,
          name: row.name,
          action: 'failed',
          message: `Unexpected error: ${err.message || 'Execution error'}`,
          error: err.message
        });
      }
    }
  }

  const durationMs = Date.now() - startTime;

  // Record Audit Log in Supabase if connected
  if (isSupabaseConfigured() && supabase && adminUser) {
    try {
      await supabase.from('product_import_audit_logs').insert({
        admin_id: adminUser.id,
        admin_email: adminUser.email,
        admin_role: adminUser.role,
        filename: 'excel_bulk_import.xlsx',
        import_mode: mode,
        total_rows: rows.length,
        created_count: createdCount,
        updated_count: updatedCount,
        skipped_count: skippedCount,
        failed_count: failedCount,
        execution_time_ms: durationMs,
        error_summary: results.filter(r => r.action === 'failed').slice(0, 50)
      });
    } catch (auditErr) {
      console.warn('[ZEZ Import Audit] Note recording import log:', auditErr);
    }
  }

  if (onProgress) {
    onProgress(totalEligible, totalEligible, 'Import completed successfully!');
  }

  return {
    success: failedCount === 0,
    totalProcessed: rows.length,
    createdCount,
    updatedCount,
    skippedCount,
    failedCount,
    results,
    timestamp: new Date().toISOString(),
    mode,
    durationMs
  };
}

// -----------------------------------------------------------------------------
// 5. DOWNLOAD WORKBOOK HELPER
// -----------------------------------------------------------------------------
export function downloadWorkbook(data: Uint8Array, filename: string): void {
  const blob = new Blob([data.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
