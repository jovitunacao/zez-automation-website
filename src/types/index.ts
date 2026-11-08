export type CustomerType = 'Company' | 'Contractor' | 'Individual' | 'Government' | 'School/University' | 'Hospital/Clinic' | 'Other';

export type ContactMethod = 'Email' | 'Mobile / Phone' | 'Viber' | 'WhatsApp';

export type StockStatus = 'In Stock' | 'Pre-Order (5-7 Days)' | 'Low Stock' | 'Contact for Availability';

export type RfqStatus = 
  | 'New' 
  | 'Under Review' 
  | 'Quotation Prepared' 
  | 'Quotation Sent' 
  | 'Accepted' 
  | 'Declined' 
  | 'Closed';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  itemCount: number;
  imageUrl: string;
  iconName: string;
  subcategories: string[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  originCountry: string;
  description: string;
  productCount: number;
  website?: string;
}

export interface ProductSpecification {
  category: string;
  label: string;
  value: string;
}

export type ProductImageStatus = 'supplier-provided' | 'manufacturer-matched' | 'illustrative' | 'pending';

export type PriceDisplayMode = 'hidden' | 'public' | 'starting';

export interface Product {
  id: string;
  sku: string;
  model: string;
  name: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  shortDescription: string;
  fullDescription: string;
  pricePhp?: number; // Optional reference price
  priceDisplayMode?: PriceDisplayMode; // 'hidden' (default Price on Request), 'public', 'starting'
  isPriceNegotiable?: boolean;
  stockStatus: StockStatus;
  leadTimeDays?: number;
  warranty: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  mainImage: string;
  galleryImages: string[];
  keySpecs: string[];
  specifications: ProductSpecification[];
  includedAccessories: string[];
  datasheetUrl?: string;
  datasheetFileName?: string;
  isDemo?: boolean;
  isPublished?: boolean;
  imageStatus?: ProductImageStatus;
  salesUnit?: string;
}

export interface QuotationCartItem {
  product: Product;
  quantity: number;
  customNotes?: string;
}

export interface RfqCustomerInfo {
  fullName: string;
  companyName: string;
  email: string;
  mobileNumber: string;
  deliveryCityProvince: string;
  deliveryAddress?: string;
  tinNumber?: string;
  customerType: CustomerType;
  preferredContactMethod: ContactMethod;
  targetDeliveryDate?: string;
  additionalRequirements?: string;
}

export interface QuotationRequest {
  id: string; // e.g. ZEZ-RFQ-2026-1042
  createdAt: string;
  status: RfqStatus;
  customer: RfqCustomerInfo;
  items: {
    productId: string;
    productName: string;
    model: string;
    brand: string;
    sku: string;
    mainImage: string;
    quantity: number;
    unitPricePhp?: number;
    subtotalPhp?: number;
    notes?: string;
  }[];
  totalEstimatedPhp?: number;
  adminNotes?: string;
  assignedSpecialist?: string;
  validUntil: string;
  isDemo?: boolean;
}

export interface SiteSettings {
  companyName: string;
  tagline: string;
  phonePrimary: string;
  phoneSecondary: string;
  mobileViber: string;
  emailSales: string;
  emailSupport: string;
  officeAddress: string;
  davaoAddress?: string;
  zamboangaAddress?: string;
  operatingHours: string;
  bannerAnnouncement: string;
  isBannerActive: boolean;
}

export interface FilterState {
  searchQuery: string;
  selectedCategories: string[];
  selectedBrands: string[];
  stockFilter: string[];
  priceRange: [number, number];
  sortBy: 'featured' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest';
}

// -----------------------------------------------------------------------------
// PHASE 4: ADMINISTRATOR RBAC & RFQ NOTIFICATION TYPES
// -----------------------------------------------------------------------------
export type AdminRole = 'super_admin' | 'admin' | 'sales_engineer';

export interface AdministratorUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
  receiveRfqNotifications: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type NotificationStatus = 
  | 'pending' 
  | 'queued' 
  | 'processing'
  | 'sent' 
  | 'failed' 
  | 'retrying' 
  | 'quota_exceeded' 
  | 'cancelled';

export interface RfqNotificationLog {
  id: string;
  rfqId: string;
  recipientEmail: string;
  recipientName: string;
  recipientRole?: string;
  adminId?: string;
  status: NotificationStatus;
  resendId?: string;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  sentAt?: string;
  errorMessage?: string;
  customerSummary?: {
    customerName?: string;
    companyName?: string;
    itemsCount?: number;
    totalEstimatedPhp?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationQuotaStats {
  todaySentCount: number;
  monthSentCount: number;
  pendingCount: number;
  failedCount: number;
  dailyLimit: number; // 100 on Resend Free
  monthlyLimit: number; // 3000 on Resend Free
  lastRefreshedAt: string;
}

// B2B Quotation System Types
export type QuotationStatus = 
  | 'Draft' 
  | 'Pending Approval' 
  | 'Approved' 
  | 'Sent' 
  | 'Accepted' 
  | 'Declined' 
  | 'Expired' 
  | 'Cancelled';

export type VatType = 
  | 'vat_inclusive_12' 
  | 'vat_exclusive_12' 
  | 'vat_exempt' 
  | 'zero_rated';

export type DiscountType = 'percentage' | 'fixed';

export interface QuotationLineItem {
  id: string;
  quotationId?: string;
  productId?: string;
  sku?: string;
  productName: string;
  model?: string;
  brand?: string;
  quantity: number;
  unitPricePhp: number;
  discountPercent?: number;
  lineTotalPhp: number;
  leadTime?: string;
  warranty?: string;
  notes?: string;
  sortOrder: number;
}

export interface QuotationAuditLog {
  id: string;
  quotationId: string;
  actorId?: string;
  actorName: string;
  action: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface Quotation {
  id: string; // e.g. ZEZ-Q-2026-00001
  rfqId?: string;
  revisionNumber: number;
  status: QuotationStatus;
  customerFullName: string;
  customerCompanyName?: string;
  customerEmail: string;
  customerMobileNumber?: string;
  deliveryCityProvince?: string;
  deliveryAddress?: string;
  tinNumber?: string;
  paymentTerms: string;
  warrantyTerms: string;
  validityDays: number;
  validUntil: string;
  currency: string;
  leadTimeDescription?: string;
  specialInstructions?: string;
  adminNotes?: string;
  assignedSpecialist?: string;
  subtotalPhp: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmountPhp: number;
  vatType: VatType;
  vatRate: number;
  vatAmountPhp: number;
  netOfVatPhp: number;
  deliveryFeePhp: number;
  installationFeePhp: number;
  otherFeesPhp: number;
  grandTotalPhp: number;
  customerAccessToken: string;
  tokenExpiresAt: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  sentToEmail?: string;
  customerResponse?: 'Accepted' | 'Declined' | 'Revision Requested';
  customerResponseAt?: string;
  customerResponseNotes?: string;
  clientPoNumber?: string;
  items: QuotationLineItem[];
  auditLogs?: QuotationAuditLog[];
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

