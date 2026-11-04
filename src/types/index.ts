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
