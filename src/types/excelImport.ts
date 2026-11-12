import { 
  Product, 
  ProductSpecification, 
  StockStatus, 
  PriceDisplayMode, 
  ProductImageStatus,
  AdminUserSession 
} from './index';

export type ImportMode = 'upsert' | 'create_only' | 'update_only' | 'skip_duplicates';

export type RowValidationStatus = 'valid' | 'warning' | 'error';

export type RowActionType = 'create' | 'update' | 'skip' | 'error';

export interface ParsedImportRow {
  rowNumber: number;
  raw: Record<string, any>;
  
  // Product fields
  sku: string;
  name: string;
  model: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  shortDescription: string;
  fullDescription: string;
  pricePhp?: number;
  priceDisplayMode: PriceDisplayMode;
  isPriceNegotiable: boolean;
  stockStatus: StockStatus;
  leadTimeDays: number;
  warranty: string;
  salesUnit: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isPublished: boolean;
  imageStatus: ProductImageStatus;
  mainImage: string;
  galleryImages: string[];
  keySpecs: string[];
  specifications: ProductSpecification[];
  includedAccessories: string[];
  datasheetUrl?: string;
  datasheetFileName?: string;

  // Validation details
  status: RowValidationStatus;
  errors: string[];
  warnings: string[];
  
  // Correlation with catalog
  isExisting: boolean;
  existingProductId?: string;
  action: RowActionType;

  // Track which columns were explicitly blank in the Excel row vs provided
  providedFields: Set<string>;
  clearedFields: Set<string>;
}

export interface ImportValidationSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  newRows: number;
  updateRows: number;
  duplicateInFileRows: number;
}

export interface ImportExecutionOptions {
  rows: ParsedImportRow[];
  mode: ImportMode;
  preserveBlankFields: boolean;
  skipInvalidRows: boolean;
  adminUser?: AdminUserSession | null;
  onProgress?: (current: number, total: number, message: string) => void;
}

export interface ImportResultItem {
  rowNumber: number;
  sku: string;
  name: string;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  message: string;
  error?: string;
}

export interface BulkImportSummary {
  success: boolean;
  totalProcessed: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  results: ImportResultItem[];
  timestamp: string;
  mode: ImportMode;
  durationMs: number;
}
