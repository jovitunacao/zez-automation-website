import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  ProductCategory, 
  Brand, 
  QuotationCartItem, 
  QuotationRequest, 
  RfqCustomerInfo, 
  SiteSettings, 
  FilterState 
} from '../types';
import { CONSIGNMENT_PRODUCTS } from '../data/consignmentProducts';
import { CATEGORIES } from '../data/categories';
import { BRANDS } from '../data/brands';
import { 
  syncRfqToSupabase, 
  syncRfqStatusToSupabase, 
  fetchProductsFromSupabase, 
  createProductInSupabase, 
  updateProductInSupabase, 
  deleteProductInSupabase,
  signInAdministrator,
  signOutAdministrator,
  checkActiveAdminSession,
  fetchAdminRfqsFromSupabase
} from '../services/supabaseService';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type ActiveView = 
  | 'home' 
  | 'shop' 
  | 'categories' 
  | 'brands' 
  | 'product-detail' 
  | 'rfq' 
  | 'account' 
  | 'admin' 
  | 'about' 
  | 'contact';

export interface AdminUserSession {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

interface AppContextType {
  // Navigation
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedProductId: string | null;
  navigateToProduct: (productId: string) => void;
  navigateToCategory: (categoryId: string) => void;
  navigateToBrand: (brandName: string) => void;

  // Catalog
  products: Product[];
  categories: ProductCategory[];
  brands: Brand[];
  productsLoading: boolean;
  productsError: string | null;
  supabaseSeedPending: boolean;
  databaseProductCount: number;
  refreshProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateProduct: (product: Product) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  togglePublishProduct: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Search & Filter
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  setSearchQuery: (query: string) => void;

  // Quotation Cart
  quoteCart: QuotationCartItem[];
  addToQuoteCart: (product: Product, quantity?: number, notes?: string) => void;
  removeFromQuoteCart: (productId: string) => void;
  updateQuoteQuantity: (productId: string, quantity: number) => void;
  clearQuoteCart: () => void;
  isQuoteDrawerOpen: boolean;
  setIsQuoteDrawerOpen: (open: boolean) => void;

  // RFQ Submission & Management
  rfqRequests: QuotationRequest[];
  submitRfq: (customer: RfqCustomerInfo) => Promise<{ success: boolean; rfq?: QuotationRequest; error?: string }>;
  updateRfqStatus: (rfqId: string, status: QuotationRequest['status'], adminNotes?: string) => Promise<void>;
  activeRfqForPrint: QuotationRequest | null;
  setActiveRfqForPrint: (rfq: QuotationRequest | null) => void;

  // Comparison Tool
  compareList: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (open: boolean) => void;

  // Customer Account
  currentCustomer: RfqCustomerInfo | null;
  setCurrentCustomer: (customer: RfqCustomerInfo | null) => void;
  customerRfqs: QuotationRequest[];

  // Site Settings
  siteSettings: SiteSettings;
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;

  // Supabase Database & Admin Authentication
  isDbConnected: boolean;
  adminUser: AdminUserSession | null;
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
}

const INITIAL_SETTINGS: SiteSettings = {
  companyName: 'ZEZ Automation Corporation',
  tagline: 'Powering Business Through Technology',
  phonePrimary: '(02) 8800-9390',
  phoneSecondary: '+63 917 800 9390',
  mobileViber: '+63 917 800 9390',
  emailSales: 'sales@zezautomation.ph',
  emailSupport: 'support@zezautomation.ph',
  officeAddress: 'Unit 1402, Corporate Center, Emerald Avenue, Ortigas Center, Pasig City, Metro Manila 1605 Philippines',
  operatingHours: 'Mon - Fri: 8:30 AM - 5:30 PM (PST)',
  bannerAnnouncement: 'Direct Corporate ICT Procurement & Project Pricing Available for Q4 2026. Submit your RFQ today.',
  isBannerActive: true
};

const INITIAL_RFQS: QuotationRequest[] = [
  {
    id: 'ZEZ-RFQ-2026-9041',
    createdAt: '2026-10-28T09:30:00Z',
    status: 'Quotation Prepared',
    customer: {
      fullName: 'Engr. Jayson Morales',
      companyName: 'Apex Data Logistics Inc.',
      email: 'j.morales@apexlogistics.ph',
      mobileNumber: '+63 917 554 1120',
      deliveryCityProvince: 'Taguig City, Metro Manila',
      deliveryAddress: '7th Ave, Bonifacio Global City, Taguig',
      tinNumber: '241-890-432-000',
      customerType: 'Company',
      preferredContactMethod: 'Email',
      targetDeliveryDate: '2026-11-15',
      additionalRequirements: 'Delivery with official BIR receipt, 3-year local warranty certificates, and rack installation assistance.'
    },
    items: [
      {
        productId: 'prod-01',
        productName: 'Cisco Catalyst 9200L 24-Port Gigabit PoE+ Managed Switch',
        model: 'C9200L-24P-4G-E',
        brand: 'Cisco',
        sku: 'ZEZ-CS-9200L-24P',
        mainImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
        quantity: 2,
        unitPricePhp: 89500,
        subtotalPhp: 179000
      },
      {
        productId: 'prod-03',
        productName: 'Ubiquiti UniFi U6 Enterprise Wi-Fi 6E Access Point',
        model: 'U6-Enterprise',
        brand: 'Ubiquiti',
        sku: 'ZEZ-UB-U6-ENT',
        mainImage: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80',
        quantity: 6,
        unitPricePhp: 21500,
        subtotalPhp: 129000
      }
    ],
    totalEstimatedPhp: 308000,
    adminNotes: 'Formal pro-forma quotation sent via sales email with 30-day price hold.',
    assignedSpecialist: 'Marco Rivera (Enterprise Account Manager)',
    validUntil: '2026-11-28',
    isDemo: true
  },
  {
    id: 'ZEZ-RFQ-2026-9042',
    createdAt: '2026-10-30T14:15:00Z',
    status: 'Under Review',
    customer: {
      fullName: 'Patricia Santos',
      companyName: 'Luzon Horizon Resort & Casino',
      email: 'p.santos@luzonresorts.com',
      mobileNumber: '+63 920 441 8899',
      deliveryCityProvince: 'Clark Freeport Zone, Pampanga',
      customerType: 'Company',
      preferredContactMethod: 'Mobile / Phone',
      additionalRequirements: 'Need urgent lead-time verification for CCTV coverage expansion.'
    },
    items: [
      {
        productId: 'prod-04',
        productName: 'Hikvision 4MP AcuSense DarkFighter Motorized Varifocal Bullet IP Camera',
        model: 'DS-2CD2646G2-IZS',
        brand: 'Hikvision',
        sku: 'ZEZ-HK-DS2646G2',
        mainImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
        quantity: 12,
        unitPricePhp: 14800,
        subtotalPhp: 177600
      },
      {
        productId: 'prod-05',
        productName: 'Dahua 16-Channel 1U 16-PoE WizMind 4K Network Video Recorder',
        model: 'NVR5216-16P-I',
        brand: 'Dahua',
        sku: 'ZEZ-DH-NVR5216',
        mainImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
        quantity: 1,
        unitPricePhp: 28500,
        subtotalPhp: 28500
      }
    ],
    totalEstimatedPhp: 206100,
    adminNotes: 'Checking warehouse stock in Pasig depot; stock confirmed for 10 units, 2 units arriving Nov 3.',
    assignedSpecialist: 'Rina Dela Cruz (Security Systems Lead)',
    validUntil: '2026-11-30',
    isDemo: true
  }
];

const INITIAL_FILTER_STATE: FilterState = {
  searchQuery: '',
  selectedCategories: [],
  selectedBrands: [],
  stockFilter: [],
  priceRange: [0, 250000],
  sortBy: 'featured'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// The 12 template placeholder IDs from original demo schema.sql that should never overwrite real products
const LEGACY_MOCK_SAMPLE_IDS = new Set([
  'prod-01', 'prod-02', 'prod-03', 'prod-04', 'prod-05', 'prod-06',
  'prod-07', 'prod-08', 'prod-09', 'prod-10', 'prod-11', 'prod-12'
]);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Products & Cloud Database Persistence
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem('zez_products');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Keep stored items if they contain the consignment catalog and no legacy template placeholders
        if (
          Array.isArray(parsed) && 
          parsed.length >= 46 && 
          parsed.some(p => p.id?.startsWith('consignment-') || p.sku === 'CLA04-UC5E-7035') &&
          !parsed.some(p => LEGACY_MOCK_SAMPLE_IDS.has(p.id))
        ) {
          return parsed;
        } else {
          // Clear outdated legacy mock storage
          localStorage.removeItem('zez_products');
        }
      }
    } catch (e) {
      console.error(e);
      try { localStorage.removeItem('zez_products'); } catch (_) {}
    }
    return CONSIGNMENT_PRODUCTS;
  });

  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [supabaseSeedPending, setSupabaseSeedPending] = useState<boolean>(false);
  const [databaseProductCount, setDatabaseProductCount] = useState<number>(0);
  const [categories] = useState<ProductCategory[]>(CATEGORIES);
  const [brands] = useState<Brand[]>(BRANDS);

  // Quotation Cart
  const [quoteCart, setQuoteCart] = useState<QuotationCartItem[]>(() => {
    try {
      const stored = localStorage.getItem('zez_quotation_cart');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [isQuoteDrawerOpen, setIsQuoteDrawerOpen] = useState(false);

  // RFQ Requests List
  // In production (Supabase configured), strictly display database-confirmed records.
  // Fictional mockup RFQs are only used when running in unconfigured local demo mode.
  const [rfqRequests, setRfqRequests] = useState<QuotationRequest[]>(() => {
    if (isSupabaseConfigured()) {
      return [];
    }
    try {
      const stored = localStorage.getItem('zez_rfqs');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_RFQS;
  });

  const [activeRfqForPrint, setActiveRfqForPrint] = useState<QuotationRequest | null>(null);

  // Compare List
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Customer Profile
  // In production, no fabricated customer details or company addresses are presented as real.
  const [currentCustomer, setCurrentCustomer] = useState<RfqCustomerInfo | null>(() => {
    if (isSupabaseConfigured()) {
      return null;
    }
    try {
      const stored = localStorage.getItem('zez_current_customer');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Filters
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);

  // Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const stored = localStorage.getItem('zez_site_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SETTINGS;
  });

  // Admin Authentication & Database Connection
  const [adminUser, setAdminUser] = useState<AdminUserSession | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const isDbConnected = isSupabaseConfigured();

  // Load products from Supabase on initial application load
  const refreshProducts = async () => {
    if (!isSupabaseConfigured()) {
      setProductsLoading(false);
      setProductsError(null);
      setSupabaseSeedPending(false);
      setDatabaseProductCount(0);
      return;
    }

    setProductsLoading(true);
    setProductsError(null);

    try {
      const result = await fetchProductsFromSupabase();

      if (result.error) {
        setProductsError(result.error);
        console.warn('[ZEZ App] Supabase products query error:', result.error);
        // Do NOT wipe out products; keep CONSIGNMENT_PRODUCTS active
        return;
      }

      if (!result.data || result.data.length === 0) {
        // Database connected, but products table has 0 records!
        setSupabaseSeedPending(true);
        setDatabaseProductCount(0);
        console.warn('[ZEZ App] Supabase products table is empty. Consignment seed pending: run supabase/consignment_seed.sql.');
        setProducts(CONSIGNMENT_PRODUCTS);
        return;
      }

      const dbProducts = result.data;
      setDatabaseProductCount(dbProducts.length);

      const hasConsignmentItems = dbProducts.some(p => 
        p.id?.startsWith('consignment-') || 
        p.sku === 'CLA04-UC5E-7035' || 
        p.sku === 'CLA04-UC6-5015'
      );
      const isLegacyOnly = dbProducts.length > 0 && dbProducts.every(p => LEGACY_MOCK_SAMPLE_IDS.has(p.id));

      if (hasConsignmentItems || (!isLegacyOnly && dbProducts.length > 0)) {
        // Supabase has the consignment or custom products! It is authoritative.
        setProducts(dbProducts);
        setSupabaseSeedPending(!hasConsignmentItems);
        setProductsError(null);
      } else if (isLegacyOnly) {
        // Database has records, but they are legacy sample products from schema.sql, NOT the 46 consignment items!
        setSupabaseSeedPending(true);
        console.warn(`[ZEZ App] Supabase contains ${dbProducts.length} legacy sample products. Consignment seed pending: run supabase/consignment_seed.sql.`);
        // Crucial: do NOT overwrite the 46 consignment products with the 12 old sample items!
        setProducts(CONSIGNMENT_PRODUCTS);
      }
    } catch (err: any) {
      console.warn('[ZEZ App] Failed to load products from database:', err);
      setProductsError(err?.message || 'Failed to connect to Supabase database.');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  // Check active admin session on load & attach auth listener
  useEffect(() => {
    const initAdminAuth = async () => {
      if (!isSupabaseConfigured()) return;
      const sessionResult = await checkActiveAdminSession();
      if (sessionResult.success && sessionResult.user) {
        setAdminUser(sessionResult.user);
        setIsAdminAuthenticated(true);
      }
    };

    initAdminAuth();

    if (isSupabaseConfigured() && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const authCheck = await checkActiveAdminSession();
          if (authCheck.success && authCheck.user) {
            setAdminUser(authCheck.user);
            setIsAdminAuthenticated(true);
          } else {
            setAdminUser(null);
            setIsAdminAuthenticated(false);
          }
        } else {
          setAdminUser(null);
          setIsAdminAuthenticated(false);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Save to LocalStorage for offline resilience
  useEffect(() => {
    try {
      if (
        products.length >= 46 && 
        products.some(p => p.id?.startsWith('consignment-') || p.sku === 'CLA04-UC5E-7035') &&
        !products.some(p => LEGACY_MOCK_SAMPLE_IDS.has(p.id))
      ) {
        localStorage.setItem('zez_products', JSON.stringify(products));
      }
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('zez_quotation_cart', JSON.stringify(quoteCart));
    } catch (e) {
      console.error(e);
    }
  }, [quoteCart]);

  useEffect(() => {
    try {
      localStorage.setItem('zez_rfqs', JSON.stringify(rfqRequests));
    } catch (e) {
      console.error(e);
    }
  }, [rfqRequests]);

  useEffect(() => {
    try {
      if (currentCustomer) {
        localStorage.setItem('zez_current_customer', JSON.stringify(currentCustomer));
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentCustomer]);

  useEffect(() => {
    try {
      localStorage.setItem('zez_site_settings', JSON.stringify(siteSettings));
    } catch (e) {
      console.error(e);
    }
  }, [siteSettings]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeView, selectedProductId]);

  // Handlers
  const navigateToProduct = (productId: string) => {
    setSelectedProductId(productId);
    setActiveView('product-detail');
  };

  const navigateToCategory = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedCategories: [categoryId],
      searchQuery: ''
    }));
    setActiveView('shop');
  };

  const navigateToBrand = (brandName: string) => {
    setFilters(prev => ({
      ...prev,
      selectedBrands: [brandName],
      searchQuery: ''
    }));
    setActiveView('shop');
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTER_STATE);
  };

  const setSearchQuery = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };

  const addToQuoteCart = (product: Product, quantity = 1, notes = '') => {
    setQuoteCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, customNotes: notes || item.customNotes }
            : item
        );
      }
      return [...prev, { product, quantity, customNotes: notes }];
    });
    setIsQuoteDrawerOpen(true);
  };

  const removeFromQuoteCart = (productId: string) => {
    setQuoteCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuoteQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromQuoteCart(productId);
      return;
    }
    setQuoteCart(prev =>
      prev.map(item => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearQuoteCart = () => {
    setQuoteCart([]);
  };

  // RFQ Submission with atomic validation
  const submitRfq = async (customer: RfqCustomerInfo): Promise<{ success: boolean; rfq?: QuotationRequest; error?: string }> => {
    if (quoteCart.length === 0) {
      return { success: false, error: 'Your quotation cart is empty.' };
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `ZEZ-RFQ-2026-${randomSuffix}`;
    
    // Calculate validity 30 days ahead
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + 30);
    const validUntilStr = validityDate.toISOString().split('T')[0];

    const items = quoteCart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      model: item.product.model,
      brand: item.product.brand,
      sku: item.product.sku,
      mainImage: item.product.mainImage,
      quantity: item.quantity,
      unitPricePhp: item.product.pricePhp,
      subtotalPhp: item.product.pricePhp ? item.product.pricePhp * item.quantity : undefined,
      notes: item.customNotes
    }));

    const totalEstimatedPhp = items.reduce(
      (sum, item) => sum + (item.subtotalPhp || 0), 
      0
    );

    const newRfq: QuotationRequest = {
      id: newId,
      createdAt: new Date().toISOString(),
      status: 'New',
      customer,
      items,
      totalEstimatedPhp: totalEstimatedPhp > 0 ? totalEstimatedPhp : undefined,
      validUntil: validUntilStr,
      adminNotes: undefined, // Enforce no pre-set admin notes from client
      assignedSpecialist: 'Marco Rivera (Enterprise Account Manager)',
      isDemo: !isSupabaseConfigured()
    };

    // Synchronize atomically to Supabase database and await confirmation
    const syncRes = await syncRfqToSupabase(newRfq);
    if (!syncRes.success) {
      // PRESERVE CART: do not clear items if database persistence failed
      return { 
        success: false, 
        error: syncRes.error || 'Failed to record complete quotation in the database. Please try again.' 
      };
    }

    // Apply official server-generated reference number from PostgreSQL function
    if (syncRes.serverRfqId) {
      newRfq.id = syncRes.serverRfqId;
    }
    if (syncRes.isDemoMode) {
      newRfq.isDemo = true;
    }

    setRfqRequests(prev => [newRfq, ...prev]);
    setCurrentCustomer(customer);
    clearQuoteCart();
    setActiveRfqForPrint(newRfq);
    return { success: true, rfq: newRfq };
  };

  const updateRfqStatus = async (rfqId: string, status: QuotationRequest['status'], adminNotes?: string) => {
    setRfqRequests(prev =>
      prev.map(rfq => {
        if (rfq.id === rfqId) {
          return {
            ...rfq,
            status,
            adminNotes: adminNotes !== undefined ? adminNotes : rfq.adminNotes
          };
        }
        return rfq;
      })
    );

    if (isSupabaseConfigured()) {
      await syncRfqStatusToSupabase(rfqId, status, adminNotes);
    }
  };

  // Product CRUD with Cloud Database Persistence (Fail-Fast: only update state if DB operation succeeds)
  const addProduct = async (newProd: Omit<Product, 'id'>): Promise<{ success: boolean; error?: string }> => {
    const trimmedSku = newProd.sku?.trim();
    if (!trimmedSku) {
      return { success: false, error: 'Product SKU is required.' };
    }

    // Prevent duplicate SKUs across products
    const existingWithSku = products.find(
      p => p.sku?.trim().toLowerCase() === trimmedSku.toLowerCase()
    );
    if (existingWithSku) {
      return { 
        success: false, 
        error: `Duplicate SKU: A product with SKU "${trimmedSku}" already exists (${existingWithSku.name}). Each product SKU must be unique.` 
      };
    }

    const id = `adm-${Date.now()}`;
    const product: Product = { 
      ...newProd, 
      sku: trimmedSku,
      id, 
      isPublished: newProd.isPublished !== undefined ? newProd.isPublished : true,
      isDemo: !isSupabaseConfigured() 
    };

    if (isSupabaseConfigured()) {
      const res = await createProductInSupabase(product);
      if (!res.success) {
        console.error('[ZEZ Supabase] Product creation failed:', res.error);
        return { success: false, error: res.error || 'Failed to persist product to database.' };
      }
    }

    // Only update local state if database operation succeeded
    setProducts(prev => [product, ...prev]);
    return { success: true };
  };

  const updateProduct = async (updated: Product): Promise<{ success: boolean; error?: string }> => {
    const trimmedSku = updated.sku?.trim();
    if (!trimmedSku) {
      return { success: false, error: 'Product SKU is required.' };
    }

    // Prevent duplicate SKUs with other products
    const existingWithSku = products.find(
      p => p.id !== updated.id && p.sku?.trim().toLowerCase() === trimmedSku.toLowerCase()
    );
    if (existingWithSku) {
      return { 
        success: false, 
        error: `Duplicate SKU: Another product with SKU "${trimmedSku}" already exists (${existingWithSku.name}). Each product SKU must be unique.` 
      };
    }

    const sanitizedProduct: Product = {
      ...updated,
      sku: trimmedSku,
      isPublished: updated.isPublished !== undefined ? updated.isPublished : true
    };

    if (isSupabaseConfigured()) {
      const res = await updateProductInSupabase(sanitizedProduct);
      if (!res.success) {
        console.error('[ZEZ Supabase] Product update failed:', res.error);
        return { success: false, error: res.error || 'Failed to update product in database.' };
      }
    }

    // Only update local state if database operation succeeded
    setProducts(prev => prev.map(p => (p.id === sanitizedProduct.id ? sanitizedProduct : p)));
    return { success: true };
  };

  const deleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured()) {
      const res = await deleteProductInSupabase(id);
      if (!res.success) {
        console.error('[ZEZ Supabase] Product deletion failed:', res.error);
        return { success: false, error: res.error || 'Failed to delete product from database.' };
      }
    }

    // Only update local state if database operation succeeded
    setProducts(prev => prev.filter(p => p.id !== id));
    return { success: true };
  };

  const togglePublishProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const prod = products.find(p => p.id === id);
    if (!prod) {
      return { success: false, error: 'Product not found.' };
    }
    const updated: Product = {
      ...prod,
      isPublished: prod.isPublished === false ? true : false
    };
    return await updateProduct(updated);
  };

  // Admin Auth Handlers
  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await signInAdministrator(email, password);
    if (result.success && result.user) {
      setAdminUser(result.user);
      setIsAdminAuthenticated(true);

      // Load live RFQs from Supabase
      const dbRfqs = await fetchAdminRfqsFromSupabase();
      if (dbRfqs !== null) {
        setRfqRequests(dbRfqs);
      }
      return { success: true };
    }
    return { success: false, error: result.error || 'Authentication failed.' };
  };

  const adminLogout = async () => {
    await signOutAdministrator();
    setAdminUser(null);
    setIsAdminAuthenticated(false);
  };

  // Compare
  const addToCompare = (product: Product) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      if (prev.length >= 4) {
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
    setIsCompareModalOpen(true);
  };

  const removeFromCompare = (productId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const updateSiteSettings = (newSettings: Partial<SiteSettings>) => {
    setSiteSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Customer RFQs
  const customerRfqs = rfqRequests.filter(
    rfq => currentCustomer && rfq.customer.email.toLowerCase() === currentCustomer.email.toLowerCase()
  );

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedProductId,
        navigateToProduct,
        navigateToCategory,
        navigateToBrand,
        products,
        categories,
        brands,
        productsLoading,
        productsError,
        supabaseSeedPending,
        databaseProductCount,
        refreshProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        togglePublishProduct,
        filters,
        setFilters,
        resetFilters,
        setSearchQuery,
        quoteCart,
        addToQuoteCart,
        removeFromQuoteCart,
        updateQuoteQuantity,
        clearQuoteCart,
        isQuoteDrawerOpen,
        setIsQuoteDrawerOpen,
        rfqRequests,
        submitRfq,
        updateRfqStatus,
        activeRfqForPrint,
        setActiveRfqForPrint,
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isCompareModalOpen,
        setIsCompareModalOpen,
        currentCustomer,
        setCurrentCustomer,
        customerRfqs,
        siteSettings,
        updateSiteSettings,
        isDbConnected,
        adminUser,
        isAdminAuthenticated,
        adminLogin,
        adminLogout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
