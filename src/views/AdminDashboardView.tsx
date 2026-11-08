import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Package, 
  FileText, 
  Sliders, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Printer, 
  Check, 
  X, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Building2, 
  Phone, 
  Mail, 
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Archive,
  Filter,
  Database,
  Lock,
  LogOut,
  RefreshCw,
  UserCheck,
  Key,
  UploadCloud,
  Camera,
  Image as ImageIcon,
  Star,
  Loader2,
  Maximize2,
  Users,
  UserPlus,
  Bell,
  BellOff,
  Send,
  Crown,
  Shield,
  Activity,
  CheckCircle,
  Inbox,
  Calculator,
  FilePlus,
  Copy,
  ExternalLink,
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  Product, 
  RfqStatus, 
  QuotationRequest, 
  StockStatus, 
  ProductImageStatus,
  AdministratorUser,
  AdminRole,
  RfqNotificationLog,
  NotificationQuotaStats,
  Quotation,
  QuotationStatus,
  QuotationLineItem
} from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  getDisplayBrand, 
  getProductSalesUnit, 
  getProductImageMetadata,
  handleProductImageError,
  DEFAULT_PRODUCT_FALLBACK_IMAGE
} from '../utils/productUtils';
import { 
  uploadProductImageToSupabase, 
  deleteProductImageFromSupabase,
  fetchAdministratorUsersFromSupabase,
  inviteAdministratorUser,
  updateAdministratorUser,
  deleteAdministratorUser,
  fetchRfqNotificationLogsFromSupabase,
  retryFailedRfqNotification,
  dispatchPendingRfqNotifications,
  fetchNotificationQuotaStatsFromSupabase
} from '../services/supabaseService';
import { 
  convertRfqToQuotation, 
  createBlankQuotation, 
  duplicateAsRevision, 
  fetchAllQuotations, 
  persistQuotation, 
  dispatchQuotationEmail 
} from '../services/quotationService';
import { downloadQuotationPdf } from '../services/quotationPdfService';
import { QuotationMakerModal } from '../components/quotation/QuotationMakerModal';
import { QuotationPrintView } from '../components/quotation/QuotationPrintView';

export const AdminDashboardView: React.FC = () => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    togglePublishProduct,
    categories, 
    brands, 
    rfqRequests, 
    rfqsLoading,
    rfqsError,
    refreshRfqs,
    updateRfqStatus, 
    setActiveRfqForPrint, 
    siteSettings, 
    updateSiteSettings,
    setActiveView,
    navigateToProduct,
    adminUser,
    isSuperAdmin,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    updateOwnNotificationPreference,
    isDbConnected,
    refreshProducts,
    supabaseSeedPending,
    databaseProductCount,
    productsError
  } = useApp();

  // Admin login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [refreshingCatalog, setRefreshingCatalog] = useState(false);

  // Product management error & loading states
  const [prodModalError, setProdModalError] = useState<string | null>(null);
  const [prodModalLoading, setProdModalLoading] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'rfqs' | 'quotations' | 'products' | 'categories' | 'admins' | 'notifications' | 'settings'>('overview');

  // Official B2B Quotations state
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [quotationsError, setQuotationsError] = useState<string | null>(null);
  const [quotationSearch, setQuotationSearch] = useState('');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState<string>('all');
  const [selectedQuotationForEdit, setSelectedQuotationForEdit] = useState<Quotation | null>(null);
  const [isQuotationMakerOpen, setIsQuotationMakerOpen] = useState(false);
  const [selectedQuotationForPrint, setSelectedQuotationForPrint] = useState<Quotation | null>(null);
  const [copiedQuoteToken, setCopiedQuoteToken] = useState<string | null>(null);

  // RFQ filtering & search
  const [rfqSearch, setRfqSearch] = useState('');
  const [rfqStatusFilter, setRfqStatusFilter] = useState<string>('all');

  // Product table filtering & search
  const [prodSearch, setProdSearch] = useState('');
  const [prodPublishFilter, setProdPublishFilter] = useState<'all' | 'published' | 'archived'>('all');
  const [prodCategoryFilter, setProdCategoryFilter] = useState<string>('all');

  // Delete product confirmation modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);
  const [tableActionError, setTableActionError] = useState<string | null>(null);

  // Product modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state for add/edit product
  const [keySpecsText, setKeySpecsText] = useState('');
  const [galleryImagesText, setGalleryImagesText] = useState('');
  const [specificationsList, setSpecificationsList] = useState<Array<{ category: string; label: string; value: string }>>([]);

  // Image Upload, Storage & Gallery State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');
  const [previewLightboxImage, setPreviewLightboxImage] = useState<string | null>(null);
  const desktopFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);

  const [prodForm, setProdForm] = useState<Partial<Product>>({
    name: '',
    brand: 'Linkbasic',
    model: '',
    sku: '',
    categoryId: 'structured-cabling',
    categoryName: 'Structured Cabling',
    shortDescription: '',
    fullDescription: '',
    pricePhp: 4500,
    salesUnit: 'box',
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '1-Year Limited Warranty',
    isFeatured: false,
    isPublished: true,
    imageStatus: 'pending',
    mainImage: '/catalog/image-pending.svg',
    galleryImages: [],
    keySpecs: [],
    specifications: [],
    includedAccessories: []
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(siteSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // ---------------------------------------------------------------------------
  // PHASE 4: ADMINISTRATOR MANAGEMENT STATE (Super Admin Only)
  // ---------------------------------------------------------------------------
  const [adminList, setAdminList] = useState<AdministratorUser[]>([]);
  const [adminListLoading, setAdminListLoading] = useState(false);
  const [adminListError, setAdminListError] = useState<string | null>(null);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(null);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [adminSearch, setAdminSearch] = useState('');

  // Invite Administrator Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('sales_engineer');
  const [inviteReceiveNotifs, setInviteReceiveNotifs] = useState(true);

  // Delete Admin Confirmation State
  const [adminToDelete, setAdminToDelete] = useState<AdministratorUser | null>(null);

  // ---------------------------------------------------------------------------
  // PHASE 4: RFQ EMAIL NOTIFICATIONS & RESEND QUOTA STATE
  // ---------------------------------------------------------------------------
  const [notifLogs, setNotifLogs] = useState<RfqNotificationLog[]>([]);
  const [notifLogsLoading, setNotifLogsLoading] = useState(false);
  const [notifLogsError, setNotifLogsError] = useState<string | null>(null);
  const [notifSearch, setNotifSearch] = useState('');
  const [notifStatusFilter, setNotifStatusFilter] = useState<string>('all');
  const [notifQuotaStats, setNotifQuotaStats] = useState<NotificationQuotaStats>({
    todaySentCount: 0,
    monthSentCount: 0,
    pendingCount: 0,
    failedCount: 0,
    dailyLimit: 100,
    monthlyLimit: 3000,
    lastRefreshedAt: new Date().toISOString()
  });
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);
  const [dispatchingQueue, setDispatchingQueue] = useState(false);
  const [prefUpdating, setPrefUpdating] = useState(false);
  const [prefMessage, setPrefMessage] = useState<string | null>(null);

  // Filtered RFQs
  const filteredRfqs = rfqRequests.filter(rfq => {
    if (rfqStatusFilter !== 'all' && rfq.status !== rfqStatusFilter) return false;
    if (rfqSearch.trim()) {
      const q = rfqSearch.toLowerCase();
      const matchId = rfq.id.toLowerCase().includes(q);
      const matchCompany = rfq.customer.companyName.toLowerCase().includes(q);
      const matchName = rfq.customer.fullName.toLowerCase().includes(q);
      const matchEmail = rfq.customer.email.toLowerCase().includes(q);
      if (!matchId && !matchCompany && !matchName && !matchEmail) return false;
    }
    return true;
  });

  // KPI calculations
  const totalRfqValue = rfqRequests.reduce((sum, r) => sum + (r.totalEstimatedPhp || 0), 0);
  const pendingRfqsCount = rfqRequests.filter(r => r.status === 'New' || r.status === 'Under Review').length;
  const inStockCount = products.filter(p => p.stockStatus === 'In Stock').length;
  const publishedProductsCount = products.filter(p => p.isPublished !== false).length;
  const archivedProductsCount = products.filter(p => p.isPublished === false).length;

  // Filtered Products for Admin Table
  const filteredAdminProducts = products.filter(prod => {
    if (prodPublishFilter === 'published' && prod.isPublished === false) return false;
    if (prodPublishFilter === 'archived' && prod.isPublished !== false) return false;
    if (prodCategoryFilter !== 'all' && prod.categoryId !== prodCategoryFilter) return false;
    if (prodSearch.trim()) {
      const q = prodSearch.toLowerCase();
      const matchName = prod.name.toLowerCase().includes(q);
      const matchSku = prod.sku.toLowerCase().includes(q);
      const matchBrand = (prod.brand || '').toLowerCase().includes(q);
      const matchModel = (prod.model || '').toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchBrand && !matchModel) return false;
    }
    return true;
  });

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setUploadError(null);
    setUploadProgressText(null);
    setShowUrlInput(false);
    setManualUrlInput('');
    setProdForm({
      name: '',
      brand: 'Linkbasic',
      model: '',
      sku: `ZEZ-${Math.floor(1000 + Math.random() * 9000)}`,
      categoryId: 'structured-cabling',
      categoryName: 'Structured Cabling',
      shortDescription: '',
      fullDescription: '',
      pricePhp: 5500,
      salesUnit: 'box',
      stockStatus: 'In Stock',
      leadTimeDays: 1,
      warranty: '1-Year Limited Warranty',
      isFeatured: false,
      isPublished: true,
      imageStatus: 'pending',
      mainImage: '/catalog/image-pending.svg',
      galleryImages: [],
      keySpecs: ['Enterprise Grade Reliability', 'Standard Compliant', 'Certified Performance'],
      specifications: [
        { category: 'Mechanical', label: 'Material', value: 'High-grade copper / steel' },
        { category: 'Compliance', label: 'Certifications', value: 'ISO/IEC, RoHS compliant' }
      ],
      includedAccessories: ['Installation accessories', 'Instruction sheet']
    });
    setKeySpecsText('Enterprise Grade Reliability\nStandard Compliant\nCertified Performance');
    setGalleryImagesText('');
    setSpecificationsList([
      { category: 'Mechanical', label: 'Material', value: 'High-grade copper / steel' },
      { category: 'Compliance', label: 'Certifications', value: 'ISO/IEC, RoHS compliant' }
    ]);
    setProdModalError(null);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setUploadError(null);
    setUploadProgressText(null);
    setShowUrlInput(false);
    setManualUrlInput('');

    const initialStatus: ProductImageStatus = prod.imageStatus || 
      (prod.mainImage?.includes('-pending.svg') || prod.mainImage?.includes('image-pending.svg') ? 'pending' : 'illustrative');

    setProdForm({
      ...prod,
      imageStatus: initialStatus,
      isPublished: prod.isPublished !== false
    });
    setKeySpecsText((prod.keySpecs || []).join('\n'));
    setGalleryImagesText((prod.galleryImages || []).filter(img => img !== prod.mainImage).join('\n'));
    setSpecificationsList(prod.specifications && prod.specifications.length > 0 ? [...prod.specifications] : [
      { category: 'General', label: 'Brand & Origin', value: prod.brand }
    ]);
    setProdModalError(null);
    setProductModalOpen(true);
  };

  // Image Upload handler supporting desktop selection, iPhone/Android photos, and live camera
  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    setUploadError(null);

    const fileArray = Array.from(files);

    // 1. FRONTEND PRE-VALIDATION: Check all files before sending to storage
    for (const file of fileArray) {
      if (file.size > 10 * 1024 * 1024) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setUploadError(`"${file.name}" exceeds the maximum allowed file size of 10 MB (${sizeMb} MB). Upload cancelled.`);
        setUploadingImage(false);
        return;
      }
      const lowerName = file.name.toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const hasValidExt = validExtensions.some(ext => lowerName.endsWith(ext));
      const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
      const hasValidMime = validMimes.includes(file.type?.toLowerCase());

      if (!hasValidExt || (!hasValidMime && file.type && file.type !== 'application/octet-stream')) {
        setUploadError(`"${file.name}" is not an accepted format. Only JPG, PNG, and WebP photographs (up to 10 MB) are permitted.`);
        setUploadingImage(false);
        return;
      }
    }

    setUploadProgressText(`Uploading ${fileArray.length > 1 ? `${fileArray.length} photos` : 'photo'} to Supabase Storage ('product-images')...`);

    const newUrls: string[] = [];
    let uploadFailure: string | null = null;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadProgressText(`Uploading photo ${i + 1} of ${fileArray.length} (${file.name})...`);
      const res = await uploadProductImageToSupabase(file, prodForm.sku);
      if (res.success && res.publicUrl) {
        newUrls.push(res.publicUrl);
      } else {
        uploadFailure = res.error || `Failed to upload "${file.name}".`;
        break;
      }
    }

    setUploadingImage(false);
    setUploadProgressText(null);

    // If any upload failed, abort completely, display error, and roll back any partial uploads
    if (uploadFailure) {
      setUploadError(uploadFailure);
      // Clean up newly uploaded files from this failed batch so no orphaned files remain
      for (const orphanedUrl of newUrls) {
        await deleteProductImageFromSupabase(orphanedUrl);
      }
      return;
    }

    if (newUrls.length > 0) {
      const currentMain = prodForm.mainImage || '/catalog/image-pending.svg';
      const isPlaceholder = currentMain.includes('-pending.svg') || currentMain.includes('image-pending.svg') || !currentMain;

      const newMain = isPlaceholder ? newUrls[0] : currentMain;
      const otherNew = isPlaceholder ? newUrls.slice(1) : newUrls;
      const existingGallery = (prodForm.galleryImages || []).filter(img => img !== newMain && !img.includes('-pending.svg'));
      const combinedGallery = Array.from(new Set([newMain, ...existingGallery, ...otherNew]));

      // Uploaded photos default to illustrative or supplier-provided (never mislabeled as manufacturer-matched)
      const newStatus: ProductImageStatus = prodForm.imageStatus === 'pending' || !prodForm.imageStatus
        ? 'illustrative'
        : prodForm.imageStatus;

      setProdForm(prev => ({
        ...prev,
        mainImage: newMain,
        galleryImages: combinedGallery,
        imageStatus: newStatus
      }));
      setGalleryImagesText(combinedGallery.filter(img => img !== newMain).join('\n'));
    }
  };

  const handleSetMainImage = (targetUrl: string) => {
    const existing = Array.from(new Set([
      prodForm.mainImage,
      ...(prodForm.galleryImages || [])
    ])).filter(img => Boolean(img) && !img?.includes('-pending.svg')) as string[];

    const otherGalleries = existing.filter(img => img !== targetUrl);
    setProdForm(prev => ({
      ...prev,
      mainImage: targetUrl,
      galleryImages: [targetUrl, ...otherGalleries]
    }));
    setGalleryImagesText(otherGalleries.join('\n'));
  };

  const handleRemoveImage = async (targetUrl: string) => {
    // 1. Remove from local form state
    const all = Array.from(new Set([
      prodForm.mainImage,
      ...(prodForm.galleryImages || [])
    ])).filter(img => Boolean(img) && !img?.includes('-pending.svg')) as string[];

    const remaining = all.filter(img => img !== targetUrl);

    if (remaining.length === 0) {
      setProdForm(prev => ({
        ...prev,
        mainImage: '/catalog/image-pending.svg',
        galleryImages: [],
        imageStatus: 'pending'
      }));
      setGalleryImagesText('');
    } else {
      const newMain = prodForm.mainImage === targetUrl ? remaining[0] : prodForm.mainImage!;
      const newGallery = remaining.filter(img => img !== newMain);
      setProdForm(prev => ({
        ...prev,
        mainImage: newMain,
        galleryImages: [newMain, ...newGallery]
      }));
      setGalleryImagesText(newGallery.join('\n'));
    }

    // 2. Safe cleanup of unused storage file:
    // Check if it's a Supabase storage URL, and verify that NO OTHER product in the catalog is using it
    if (targetUrl && targetUrl.includes('/product-images/')) {
      const isSharedWithOtherProducts = products.some(p => {
        // Ignore the product currently being edited
        if (editingProduct && p.id === editingProduct.id) return false;
        return p.mainImage === targetUrl || (p.galleryImages || []).includes(targetUrl);
      });

      if (!isSharedWithOtherProducts) {
        console.info(`[ZEZ Storage] Safely cleaning up unshared storage file: ${targetUrl}`);
        await deleteProductImageFromSupabase(targetUrl);
      } else {
        console.info(`[ZEZ Storage] Preserving shared image ${targetUrl} used by other catalog products.`);
      }
    }
  };

  const handleAddManualUrl = () => {
    const url = manualUrlInput.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/catalog/')) {
      setUploadError('Please enter a valid HTTP/HTTPS URL or local /catalog/ path.');
      return;
    }
    setUploadError(null);
    const currentMain = prodForm.mainImage || '/catalog/image-pending.svg';
    const isPlaceholder = currentMain.includes('-pending.svg') || currentMain.includes('image-pending.svg');
    const newMain = isPlaceholder ? url : currentMain;
    const existingGallery = (prodForm.galleryImages || []).filter(img => img !== newMain && !img.includes('-pending.svg'));
    const combined = Array.from(new Set([newMain, ...existingGallery, url]));

    setProdForm(prev => ({
      ...prev,
      mainImage: newMain,
      galleryImages: combined,
      imageStatus: prev.imageStatus === 'pending' ? 'illustrative' : prev.imageStatus
    }));
    setGalleryImagesText(combined.filter(img => img !== newMain).join('\n'));
    setManualUrlInput('');
    setShowUrlInput(false);
  };

  const handleTogglePublish = async (prod: Product) => {
    setTableActionError(null);
    const res = await togglePublishProduct(prod.id);
    if (!res.success) {
      setTableActionError(res.error || `Failed to update status for "${prod.name}".`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleteConfirmLoading(true);
    setTableActionError(null);
    const res = await deleteProduct(productToDelete.id);
    setDeleteConfirmLoading(false);
    if (!res.success) {
      setTableActionError(res.error || `Failed to delete "${productToDelete.name}".`);
    } else {
      setProductToDelete(null);
    }
  };

  const handleArchiveInsteadOfDelete = async () => {
    if (!productToDelete) return;
    setDeleteConfirmLoading(true);
    setTableActionError(null);
    const res = await updateProduct({ ...productToDelete, isPublished: false });
    setDeleteConfirmLoading(false);
    if (!res.success) {
      setTableActionError(res.error || `Failed to archive "${productToDelete.name}".`);
    } else {
      setProductToDelete(null);
    }
  };

  const handleAddSpecRow = () => {
    setSpecificationsList(prev => [...prev, { category: 'General', label: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setSpecificationsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSpecRow = (index: number, field: 'category' | 'label' | 'value', value: string) => {
    setSpecificationsList(prev => prev.map((spec, i) => i === index ? { ...spec, [field]: value } : spec));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = prodForm.name?.trim() || '';
    const trimmedSku = prodForm.sku?.trim() || '';

    if (!trimmedName || !trimmedSku) {
      setProdModalError('Product Title and SKU are mandatory fields.');
      return;
    }

    // Client-side duplicate SKU check against other items
    const duplicateSku = products.find(
      p => (!editingProduct || p.id !== editingProduct.id) &&
           p.sku?.trim().toLowerCase() === trimmedSku.toLowerCase()
    );
    if (duplicateSku) {
      setProdModalError(`Duplicate SKU: The SKU "${trimmedSku}" is already used by "${duplicateSku.name}". Each product must have a unique SKU.`);
      return;
    }

    setProdModalLoading(true);
    setProdModalError(null);

    const cat = categories.find(c => c.id === prodForm.categoryId);
    const categoryName = cat ? cat.name : (prodForm.categoryName || 'General Equipment');

    // Parse multiline text inputs
    const parsedKeySpecs = keySpecsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const parsedAdditionalGalleries = galleryImagesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const mainImg = prodForm.mainImage?.trim() || '/catalog/image-pending.svg';
    const combinedGallery = Array.from(new Set([mainImg, ...parsedAdditionalGalleries]));
    const computedStatus: ProductImageStatus = prodForm.imageStatus || 
      (mainImg.includes('-pending.svg') || mainImg.includes('image-pending.svg') ? 'pending' : 'illustrative');

    const validSpecs = specificationsList.filter(s => s.label.trim() && s.value.trim());

    try {
      if (editingProduct) {
        const res = await updateProduct({
          ...editingProduct,
          ...prodForm,
          name: trimmedName,
          sku: trimmedSku,
          categoryName,
          mainImage: mainImg,
          galleryImages: combinedGallery,
          imageStatus: computedStatus,
          keySpecs: parsedKeySpecs,
          specifications: validSpecs,
          isPublished: prodForm.isPublished !== false
        } as Product);
        if (!res.success) {
          setProdModalError(res.error || 'Failed to update product in database.');
          setProdModalLoading(false);
          return;
        }
      } else {
        const res = await addProduct({
          ...prodForm,
          name: trimmedName,
          sku: trimmedSku,
          categoryName,
          mainImage: mainImg,
          galleryImages: combinedGallery,
          imageStatus: computedStatus,
          keySpecs: parsedKeySpecs,
          specifications: validSpecs,
          isPublished: prodForm.isPublished !== false
        } as any);
        if (!res.success) {
          setProdModalError(res.error || 'Failed to save product in database.');
          setProdModalLoading(false);
          return;
        }
      }
      setProductModalOpen(false);
    } catch (err: any) {
      setProdModalError(err.message || 'An unexpected error occurred while saving product.');
    } finally {
      setProdModalLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    const res = await adminLogin(loginEmail, loginPassword);
    if (!res.success) {
      setLoginError(res.error || 'Failed to authenticate administrator account.');
    }
    setLoginLoading(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings(settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // ---------------------------------------------------------------------------
  // PHASE 4: ADMINISTRATOR MANAGEMENT HANDLERS (Super Admin)
  // ---------------------------------------------------------------------------
  const loadAdmins = async () => {
    setAdminListLoading(true);
    setAdminListError(null);
    try {
      const data = await fetchAdministratorUsersFromSupabase();
      setAdminList(data);
    } catch (e: any) {
      setAdminListError(e.message || 'Failed to fetch administrators.');
    } finally {
      setAdminListLoading(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminActionLoading(true);
    setAdminActionError(null);
    setAdminActionSuccess(null);

    const res = await inviteAdministratorUser({
      email: inviteEmail.trim(),
      fullName: inviteFullName.trim(),
      role: inviteRole,
      receiveRfqNotifications: inviteReceiveNotifs
    });

    setAdminActionLoading(false);
    if (!res.success) {
      setAdminActionError(res.error || 'Failed to invite administrator.');
      return;
    }

    setAdminActionSuccess(`Invitation dispatched to ${inviteEmail}. Account registered as ${inviteRole}.`);
    setInviteModalOpen(false);
    setInviteEmail('');
    setInviteFullName('');
    setInviteRole('sales_engineer');
    setInviteReceiveNotifs(true);
    await loadAdmins();
  };

  const handleToggleAdminActive = async (admin: AdministratorUser) => {
    // Protection: Prevent deactivating the last active Super Admin
    if (admin.role === 'super_admin' && admin.isActive) {
      const activeSuperAdmins = adminList.filter(a => a.role === 'super_admin' && a.isActive);
      if (activeSuperAdmins.length <= 1) {
        setAdminActionError('Action Rejected: Cannot deactivate the last active Super Admin account. Maintain at least one active Super Admin.');
        return;
      }
    }

    setAdminActionLoading(true);
    setAdminActionError(null);
    setAdminActionSuccess(null);

    const res = await updateAdministratorUser(admin.id, {
      isActive: !admin.isActive
    });

    setAdminActionLoading(false);
    if (!res.success) {
      setAdminActionError(res.error || 'Failed to update account status.');
      return;
    }

    setAdminActionSuccess(`Administrator "${admin.fullName}" status updated to ${!admin.isActive ? 'Active' : 'Inactive'}.`);
    await loadAdmins();
  };

  const handleToggleAdminNotifications = async (admin: AdministratorUser) => {
    setAdminActionLoading(true);
    setAdminActionError(null);
    setAdminActionSuccess(null);

    const res = await updateAdministratorUser(admin.id, {
      receiveRfqNotifications: !admin.receiveRfqNotifications
    });

    setAdminActionLoading(false);
    if (!res.success) {
      setAdminActionError(res.error || 'Failed to update notification setting.');
      return;
    }

    setAdminActionSuccess(`RFQ email alerts for "${admin.fullName}" ${!admin.receiveRfqNotifications ? 'enabled' : 'disabled'}.`);
    await loadAdmins();
  };

  const handleChangeAdminRole = async (admin: AdministratorUser, newRole: AdminRole) => {
    if (admin.role === newRole) return;

    // Protection: Prevent demoting the last active Super Admin
    if (admin.role === 'super_admin' && newRole !== 'super_admin') {
      const activeSuperAdmins = adminList.filter(a => a.role === 'super_admin' && a.isActive);
      if (activeSuperAdmins.length <= 1) {
        setAdminActionError('Action Rejected: Cannot demote the last active Super Admin account. Designate another Super Admin first.');
        return;
      }
    }

    setAdminActionLoading(true);
    setAdminActionError(null);
    setAdminActionSuccess(null);

    const res = await updateAdministratorUser(admin.id, {
      role: newRole
    });

    setAdminActionLoading(false);
    if (!res.success) {
      setAdminActionError(res.error || 'Failed to change administrative role.');
      return;
    }

    setAdminActionSuccess(`Role for "${admin.fullName}" updated to ${newRole}.`);
    await loadAdmins();
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    setAdminActionLoading(true);
    setAdminActionError(null);
    setAdminActionSuccess(null);

    const res = await deleteAdministratorUser(adminToDelete.id);
    setAdminActionLoading(false);

    if (!res.success) {
      setAdminActionError(res.error || 'Failed to delete administrator account.');
      return;
    }

    setAdminActionSuccess(`Administrator account "${adminToDelete.email}" deleted successfully.`);
    setAdminToDelete(null);
    await loadAdmins();
  };

  // ---------------------------------------------------------------------------
  // PHASE 4: RFQ EMAIL NOTIFICATION LOGS & RESEND QUOTA HANDLERS
  // ---------------------------------------------------------------------------
  const loadNotificationData = async () => {
    setNotifLogsLoading(true);
    setNotifLogsError(null);
    try {
      const [logs, stats] = await Promise.all([
        fetchRfqNotificationLogsFromSupabase(100),
        fetchNotificationQuotaStatsFromSupabase()
      ]);
      setNotifLogs(logs);
      setNotifQuotaStats(stats);
    } catch (e: any) {
      setNotifLogsError(e.message || 'Failed to fetch notification logs.');
    } finally {
      setNotifLogsLoading(false);
    }
  };

  const handleRetryLog = async (logId: string) => {
    setRetryingLogId(logId);
    const res = await retryFailedRfqNotification(logId);
    setRetryingLogId(null);
    if (!res.success) {
      alert(`Retry notice: ${res.error}`);
    } else {
      await loadNotificationData();
    }
  };

  const handleDispatchQueue = async () => {
    setDispatchingQueue(true);
    const res = await dispatchPendingRfqNotifications();
    setDispatchingQueue(false);
    if (!res.success) {
      alert(`Dispatch notice: ${res.error}`);
    } else {
      await loadNotificationData();
    }
  };

  const handleToggleOwnNotification = async () => {
    setPrefUpdating(true);
    setPrefMessage(null);
    const current = adminUser?.receiveRfqNotifications !== false;
    const res = await updateOwnNotificationPreference(!current);
    setPrefUpdating(false);
    if (res.success) {
      setPrefMessage(`RFQ email alerts ${!current ? 'enabled' : 'disabled'} for your account.`);
      setTimeout(() => setPrefMessage(null), 4000);
    } else {
      setPrefMessage(`Failed to update preference: ${res.error}`);
    }
  };

  // Official B2B Quotation Handlers
  const loadQuotations = async () => {
    setQuotationsLoading(true);
    setQuotationsError(null);
    const res = await fetchAllQuotations();
    setQuotationsLoading(false);
    if (res.data) {
      setQuotations(res.data);
    }
    if (res.error && (!res.data || res.data.length === 0)) {
      setQuotationsError(res.error);
    }
  };

  const handleConvertRfqToQuote = (rfq: QuotationRequest) => {
    const newQuote = convertRfqToQuotation(rfq, adminUser);
    setSelectedQuotationForEdit(newQuote);
    setIsQuotationMakerOpen(true);
  };

  const handleCreateNewQuote = () => {
    const newQuote = createBlankQuotation(adminUser);
    setSelectedQuotationForEdit(newQuote);
    setIsQuotationMakerOpen(true);
  };

  const handleEditQuote = (quote: Quotation) => {
    setSelectedQuotationForEdit(quote);
    setIsQuotationMakerOpen(true);
  };

  const handleDuplicateQuote = (quote: Quotation) => {
    const revision = duplicateAsRevision(quote, adminUser);
    setSelectedQuotationForEdit(revision);
    setIsQuotationMakerOpen(true);
  };

  const handleCopyCustomerLink = (quote: Quotation) => {
    const origin = window.location.origin;
    const url = `${origin}?quote_token=${quote.customerAccessToken}&quote_id=${quote.id}`;
    navigator.clipboard.writeText(url);
    setCopiedQuoteToken(quote.id);
    setTimeout(() => setCopiedQuoteToken(null), 2500);
  };

  const handleQuotationSaved = (savedQuote: Quotation) => {
    setQuotations(prev => [
      savedQuote,
      ...prev.filter(q => q.id !== savedQuote.id)
    ]);
  };

  // Tab switching data loaders
  useEffect(() => {
    if (isAdminAuthenticated) {
      if (activeAdminTab === 'rfqs') {
        refreshRfqs();
      } else if (activeAdminTab === 'quotations') {
        loadQuotations();
      } else if (activeAdminTab === 'admins' && isSuperAdmin) {
        loadAdmins();
      } else if (activeAdminTab === 'notifications') {
        loadNotificationData();
      }
    }
  }, [activeAdminTab, isAdminAuthenticated, isSuperAdmin]);

  // Initial load of quotations when authenticated
  useEffect(() => {
    if (isAdminAuthenticated) {
      loadQuotations();
    }
  }, [isAdminAuthenticated]);

  // If not authenticated, render the secure administrator login gate
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-[#292F36] p-6 text-white text-center">
            <div className="w-14 h-14 bg-[#B5121B] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">ZEZ Operations Portal</h2>
            <p className="text-xs text-gray-300 mt-1">Authorized Administrator Authentication</p>
          </div>

          <div className="p-6 space-y-5">
            {loginError && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#B5121B] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Access Denied</p>
                  <p>{loginError}</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 flex items-start gap-2">
              <Lock className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-800">Protected B2B Distributor Resource</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Access requires Supabase administrator role verification. Unauthenticated requests cannot read or modify quotation records.
                </p>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@zezautomation.ph"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#B5121B] focus:ring-1 focus:ring-[#B5121B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#B5121B] focus:ring-1 focus:ring-[#B5121B]"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#B5121B] hover:bg-[#8F1018] text-white py-2.5 px-4 rounded-lg font-bold text-xs tracking-wider uppercase transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Authenticate & Access Console</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <button
                type="button"
                onClick={() => setActiveView('shop')}
                className="hover:text-gray-900 underline cursor-pointer"
              >
                ← Return to Public Catalog
              </button>
              <span className="text-[11px] text-gray-400">
                {isSupabaseConfigured() ? 'Supabase Auth Mode' : 'Local Sandbox Mode'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-[#292F36] text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#B5121B] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black">ZEZ Operations & B2B Admin Console</h1>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                SECURE AUTHENTICATED
              </span>
              {isSupabaseConfigured() ? (
                supabaseSeedPending ? (
                  <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-600 px-2 py-0.5 rounded flex items-center gap-1.5" title="Consignment seed pending: run supabase/consignment_seed.sql in Supabase SQL editor">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <span>Supabase: Connected (Product Import Pending: {databaseProductCount}/46 in DB)</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono bg-emerald-900/60 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded flex items-center gap-1">
                    <Database className="w-3 h-3 text-emerald-400" />
                    <span>Supabase PostgreSQL: Connected & Authoritative ({products.length} Products)</span>
                  </span>
                )
              ) : (
                <span className="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded flex items-center gap-1">
                  <Database className="w-3 h-3 text-blue-400" />
                  <span>Database: Local Consignment Catalog ({products.length} Items)</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
              <span className="flex items-center gap-1.5 text-gray-300">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-white">{adminUser?.fullName || adminUser?.email || 'Administrator'}</span>
                <span className="text-[10px] bg-red-900/60 text-red-300 border border-red-700 px-1.5 py-0.2 rounded font-mono uppercase font-bold">
                  {adminUser?.role || 'admin'}
                </span>
              </span>
              <span>·</span>
              <span>Distributor Operations & Quotations Management</span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-gray-800 rounded-lg text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveAdminTab('overview')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeAdminTab === 'overview' ? 'bg-[#B5121B] text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveAdminTab('rfqs')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeAdminTab === 'rfqs' ? 'bg-[#B5121B] text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              <span>Quotations (RFQs)</span>
              {pendingRfqsCount > 0 && (
                <span className="bg-amber-400 text-gray-950 px-1.5 py-0.2 rounded-full font-bold text-[10px]">
                  {pendingRfqsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveAdminTab('quotations')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeAdminTab === 'quotations' ? 'bg-[#B5121B] text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Official Quotes</span>
              {quotations.length > 0 && (
                <span className="bg-gray-700 text-white px-1.5 py-0.2 rounded-full font-mono text-[10px]">
                  {quotations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveAdminTab('products')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeAdminTab === 'products' ? 'bg-[#B5121B] text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setActiveAdminTab('categories')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeAdminTab === 'categories' ? 'bg-[#B5121B] text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              Categories & Brands
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveAdminTab('admins')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeAdminTab === 'admins' ? 'bg-[#B5121B] text-white' : 'text-amber-300 hover:text-white'
                }`}
                title="Authorized Administrator Management (Super Admin Exclusive)"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Administrators</span>
              </button>
            )}
            <button
              onClick={() => setActiveAdminTab('notifications')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeAdminTab === 'notifications' ? 'bg-[#B5121B] text-white' : 'text-gray-300 hover:text-white'
              }`}
              title="RFQ Email Alerts, Delivery Logs & Resend Quotas"
            >
              <Bell className="w-3.5 h-3.5 text-red-400" />
              <span>RFQ Alerts & Logs</span>
              {notifQuotaStats.failedCount > 0 && (
                <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-full font-bold text-[10px]">
                  {notifQuotaStats.failedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveAdminTab('settings')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeAdminTab === 'settings' ? 'bg-[#B5121B] text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              Settings
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={async () => {
                setRefreshingCatalog(true);
                await refreshProducts();
                setRefreshingCatalog(false);
              }}
              disabled={refreshingCatalog}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg border border-gray-700 transition-colors cursor-pointer"
              title="Sync / Refresh Catalog with Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingCatalog ? 'animate-spin text-[#B5121B]' : ''}`} />
            </button>
            <button
              onClick={() => adminLogout()}
              className="flex items-center gap-1 bg-gray-800 hover:bg-red-950/80 text-gray-300 hover:text-red-300 px-3 py-1.5 rounded-lg border border-gray-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Sign out of Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Administrator Warning: Pending Seed Banner */}
          {isSupabaseConfigured() && supabaseSeedPending && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-amber-950">
                      Supabase Product Import Pending: Action Required
                    </h3>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      Supabase PostgreSQL is connected, but the 46 consignment products from <code>supabase/consignment_seed.sql</code> have not been executed in your Supabase project yet. Currently, your database contains <strong>{databaseProductCount} records</strong> in the <code>products</code> table.
                    </p>
                    <p className="text-xs text-amber-800">
                      To ensure seamless customer procurement, the public showroom is currently serving the verified 46 consignment models. To make your Supabase database the authoritative catalog for online inventory and admin management, execute the product seed script.
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setRefreshingCatalog(true);
                    await refreshProducts();
                    setRefreshingCatalog(false);
                  }}
                  disabled={refreshingCatalog}
                  className="shrink-0 px-3.5 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingCatalog ? 'animate-spin' : ''}`} />
                  <span>Re-check Database</span>
                </button>
              </div>
              <div className="bg-white/90 border border-amber-200 rounded-lg p-3 text-xs text-gray-800 space-y-1 font-mono">
                <div className="font-bold text-gray-900 mb-1">Execution Steps for Administrator:</div>
                <div>1. Open your Supabase Project Dashboard → <strong>SQL Editor</strong></div>
                <div>2. Open or copy the contents of <code>supabase/consignment_seed.sql</code></div>
                <div>3. Click <strong>Run</strong> (imports all 46 consignment SKUs atomically with public SRP)</div>
                <div>4. Click <strong>"Re-check Database"</strong> above to verify authoritative synchronization</div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-xs text-gray-500 font-medium">Total Catalog Products</span>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">{products.length}</div>
              <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                <span className="text-emerald-700 font-semibold">{inStockCount} In Stock</span>
                <span className="text-gray-300">·</span>
                <span className={supabaseSeedPending ? 'text-amber-700 font-medium' : 'text-blue-700 font-medium'}>
                  {isSupabaseConfigured()
                    ? (supabaseSeedPending ? `DB Seed Pending (${databaseProductCount}/46 in DB)` : 'Supabase Live')
                    : 'Local Consignment'}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-xs text-gray-500 font-medium">Quotation Requests (RFQs)</span>
              <div className="text-2xl sm:text-3xl font-black text-[#B5121B]">{rfqRequests.length}</div>
              <span className="text-[11px] text-amber-700 font-semibold">{pendingRfqsCount} Pending Review</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-xs text-gray-500 font-medium">Estimated Pipeline Value</span>
              <div className="text-xl sm:text-2xl font-black text-gray-900 font-mono">
                ₱{totalRfqValue.toLocaleString()}
              </div>
              <span className="text-[11px] text-gray-500">Subject to volume discounting</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-xs text-gray-500 font-medium">Active Categories & Brands</span>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">{categories.length} / {brands.length}</div>
              <span className="text-[11px] text-gray-500">Enterprise suppliers</span>
            </div>
          </div>

          {/* Recent RFQs */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#B5121B]" />
                <h3 className="font-bold text-base text-[#292F36]">Recent Quotation Submissions</h3>
              </div>
              <button
                onClick={() => setActiveAdminTab('rfqs')}
                className="text-xs font-bold text-[#B5121B] hover:underline"
              >
                View All RFQs →
              </button>
            </div>

            {rfqRequests.length === 0 ? (
              <div className="py-10 text-center text-gray-500 space-y-2">
                <FileText className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="font-bold text-gray-700">No quotation requests in database</p>
                <p className="text-xs text-gray-400">
                  {isSupabaseConfigured() 
                    ? 'Submissions by enterprise customers will appear here once submitted.' 
                    : 'Running in demo mode. Submit a test quotation through the showroom.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Company / Client</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Items</th>
                      <th className="py-2.5 px-3 text-right">Est. Value (PHP)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rfqRequests.slice(0, 5).map((rfq) => (
                      <tr key={rfq.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-[#B5121B]">{rfq.id}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900">{rfq.customer.companyName || rfq.customer.fullName}</div>
                          <div className="text-[11px] text-gray-500">{rfq.customer.email}</div>
                        </td>
                        <td className="py-3 px-3 text-gray-600">
                          {new Date(rfq.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-medium text-gray-800">
                          {rfq.items.length} models ({rfq.items.reduce((s, i) => s + i.quantity, 0)} units)
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                          ₱{rfq.totalEstimatedPhp?.toLocaleString() || '0'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {rfq.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setActiveRfqForPrint(rfq)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded cursor-pointer"
                          >
                            Print Slip
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. QUOTATION MANAGEMENT TAB */}
      {activeAdminTab === 'rfqs' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reference ID, company name, email..."
                value={rfqSearch}
                onChange={(e) => setRfqSearch(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refreshRfqs()}
                disabled={rfqsLoading}
                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                title="Refresh quotation requests from Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#B5121B] ${rfqsLoading ? 'animate-spin' : ''}`} />
                <span>{rfqsLoading ? 'Refreshing...' : 'Refresh RFQs'}</span>
              </button>

              <span className="text-gray-500 font-medium">Filter Status:</span>
              <select
                value={rfqStatusFilter}
                onChange={(e) => setRfqStatusFilter(e.target.value)}
                className="p-2 bg-gray-50 border border-gray-300 rounded-lg font-semibold"
              >
                <option value="all">All Statuses ({rfqRequests.length})</option>
                <option value="New">New</option>
                <option value="Under Review">Under Review</option>
                <option value="Quotation Prepared">Quotation Prepared</option>
                <option value="Quotation Sent">Quotation Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Declined">Declined</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Database Error State */}
          {rfqsError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs flex items-start justify-between gap-3 text-red-900 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-red-900">Database Connection Error</h4>
                  <p className="text-red-700">
                    Failed to query quotation requests from Supabase: {rfqsError}
                  </p>
                  <p className="text-[11px] text-red-600">
                    Please verify your administrator session permissions or network connectivity.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => refreshRfqs()}
                disabled={rfqsLoading}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 cursor-pointer text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${rfqsLoading ? 'animate-spin' : ''}`} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Quotations List / Loading / Empty States */}
          {rfqsLoading && rfqRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-3 shadow-2xs">
              <Loader2 className="w-8 h-8 text-[#B5121B] animate-spin mx-auto" />
              <h3 className="font-bold text-gray-800 text-sm">Loading Quotation Requests...</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Retrieving live B2B quotation submissions and line items from Supabase database.
              </p>
            </div>
          ) : !rfqsError && filteredRfqs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-3 shadow-2xs">
              <FileText className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="font-bold text-gray-800 text-sm">No Quotation Requests Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {rfqRequests.length === 0
                  ? 'No quotation submissions have been recorded in the Supabase database yet.'
                  : 'No quotation requests match your current search and status filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRfqs.map((rfq) => (
                <div
                  key={rfq.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4 hover:border-gray-300 transition-all text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-sm text-[#B5121B]">{rfq.id}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-700 font-bold">{rfq.customer.companyName || 'Private Individual'}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500">Attn: {rfq.customer.fullName}</span>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">Status:</span>
                      <select
                        value={rfq.status}
                        onChange={(e) => updateRfqStatus(rfq.id, e.target.value as RfqStatus)}
                        className="py-1 px-2.5 font-bold rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-[#B5121B]"
                      >
                        <option value="New">New</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Quotation Prepared">Quotation Prepared</option>
                        <option value="Quotation Sent">Quotation Sent</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Declined">Declined</option>
                        <option value="Closed">Closed</option>
                      </select>

                      <button
                        onClick={() => setActiveRfqForPrint(rfq)}
                        className="px-3 py-1 bg-[#B5121B] text-white font-bold rounded-lg hover:bg-[#8F1018] flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Slip</span>
                      </button>

                      <button
                        onClick={() => handleConvertRfqToQuote(rfq)}
                        className="px-3 py-1 bg-[#292F36] hover:bg-black text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                        title="Convert this incoming customer RFQ into an official B2B Quotation"
                      >
                        <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Create Official Quote</span>
                      </button>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Client Info */}
                    <div className="space-y-1 text-gray-600 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      <span className="font-bold text-gray-900 block mb-1">Customer Contact:</span>
                      <p>Email: <a href={`mailto:${rfq.customer.email}`} className="text-[#B5121B] underline">{rfq.customer.email}</a></p>
                      <p>Mobile: <strong>{rfq.customer.mobileNumber}</strong></p>
                      <p>Delivery: <strong>{rfq.customer.deliveryCityProvince}</strong></p>
                      <p>Customer Type: <strong>{rfq.customer.customerType}</strong></p>
                    </div>

                    {/* Items List */}
                    <div className="space-y-1 text-gray-600 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      <span className="font-bold text-gray-900 block mb-1">
                        Line Items ({rfq.items.length}):
                      </span>
                      <ul className="space-y-1">
                        {rfq.items.map((it, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span className="truncate pr-1">
                              {it.quantity}x {it.productName} ({it.model})
                            </span>
                            <span className="font-mono font-bold text-gray-800 shrink-0">
                              ₱{it.subtotalPhp ? it.subtotalPhp.toLocaleString() : 'TBD'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Internal Staff Notes */}
                    <div className="space-y-2 bg-gray-50/50 p-3 rounded-lg border border-gray-100 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-gray-900 block mb-1">Staff Remarks:</span>
                        <p className="text-gray-600 italic text-[11px]">
                          {rfq.adminNotes || 'No notes added yet.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
                        <span className="text-gray-500">Estimated Total:</span>
                        <span className="font-mono font-black text-sm text-[#B5121B]">
                          ₱{rfq.totalEstimatedPhp?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. OFFICIAL B2B QUOTATION MAKER TAB */}
      {activeAdminTab === 'quotations' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#292F36] flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#B5121B]" />
                <span>B2B Official Quotations & Commercial Proposals</span>
              </h2>
              <p className="text-xs text-gray-500">
                Generate atomic sequential quotation numbers (ZEZ-Q-YYYY-XXXXX), calculate Philippine VAT, email via Resend, and track client approvals.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadQuotations}
                disabled={quotationsLoading}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh Quotations"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${quotationsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleCreateNewQuote}
                className="px-4 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <FilePlus className="w-4 h-4" />
                <span>New Blank Quotation</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Quotes</p>
              <p className="text-xl font-black text-gray-900 mt-1">{quotations.length}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pipeline Value</p>
              <p className="text-lg font-black text-[#B5121B] mt-1 font-mono truncate">
                ₱{quotations.reduce((s, q) => s + (q.grandTotalPhp || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Drafts</p>
              <p className="text-xl font-black text-gray-700 mt-1">
                {quotations.filter(q => q.status === 'Draft' || q.status === 'Pending Approval').length}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
              <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Sent to Clients</p>
              <p className="text-xl font-black text-indigo-700 mt-1">
                {quotations.filter(q => q.status === 'Sent' || q.status === 'Approved').length}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs col-span-2 sm:col-span-1">
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Accepted / Won</p>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {quotations.filter(q => q.status === 'Accepted').length}
              </p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by quote #, client company, contact, or email..."
                  value={quotationSearch}
                  onChange={(e) => setQuotationSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#B5121B]"
                />
              </div>

              <select
                value={quotationStatusFilter}
                onChange={(e) => setQuotationStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 font-medium"
              >
                <option value="all">All Statuses ({quotations.length})</option>
                <option value="Draft">Draft</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Declined">Declined</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Error Banner */}
          {quotationsError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Database Notice</p>
                <p className="mt-0.5">{quotationsError}</p>
                <p className="mt-1 text-[11px] text-amber-700">
                  Quotations remain fully functional and saved locally in your browser storage until the <code>20261108_b2b_quotation_system.sql</code> database migration is executed.
                </p>
              </div>
              <button
                onClick={loadQuotations}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded text-xs transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Quotations List */}
          {quotationsLoading ? (
            <div className="py-16 text-center bg-white rounded-xl border border-gray-200 space-y-3">
              <RefreshCw className="w-8 h-8 text-[#B5121B] animate-spin mx-auto" />
              <p className="text-xs text-gray-500 font-medium">Loading official quotations database...</p>
            </div>
          ) : quotations.filter(q => {
            if (quotationStatusFilter !== 'all' && q.status !== quotationStatusFilter) return false;
            if (quotationSearch.trim()) {
              const term = quotationSearch.toLowerCase();
              const matchNum = q.id.toLowerCase().includes(term);
              const matchClient = (q.customerCompanyName || '').toLowerCase().includes(term);
              const matchAttn = (q.customerFullName || '').toLowerCase().includes(term);
              const matchEmail = (q.customerEmail || '').toLowerCase().includes(term);
              const matchRfq = (q.rfqId || '').toLowerCase().includes(term);
              if (!matchNum && !matchClient && !matchAttn && !matchEmail && !matchRfq) return false;
            }
            return true;
          }).length === 0 ? (
            <div className="py-16 text-center bg-white rounded-xl border border-gray-200 p-8 space-y-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">No official quotations found</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  {quotationSearch || quotationStatusFilter !== 'all'
                    ? 'No quotations match your current search or status filter.'
                    : 'Start by converting an incoming RFQ from the RFQs tab, or click "+ New Blank Quotation" above.'}
                </p>
              </div>
              <button
                onClick={handleCreateNewQuote}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <FilePlus className="w-4 h-4" />
                <span>Create First Quotation</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {quotations
                .filter(q => {
                  if (quotationStatusFilter !== 'all' && q.status !== quotationStatusFilter) return false;
                  if (quotationSearch.trim()) {
                    const term = quotationSearch.toLowerCase();
                    const matchNum = q.id.toLowerCase().includes(term);
                    const matchClient = (q.customerCompanyName || '').toLowerCase().includes(term);
                    const matchAttn = (q.customerFullName || '').toLowerCase().includes(term);
                    const matchEmail = (q.customerEmail || '').toLowerCase().includes(term);
                    const matchRfq = (q.rfqId || '').toLowerCase().includes(term);
                    if (!matchNum && !matchClient && !matchAttn && !matchEmail && !matchRfq) return false;
                  }
                  return true;
                })
                .map((quote) => {
                  const isExpired = new Date(quote.validUntil) < new Date() && quote.status !== 'Accepted';
                  const statusColors: Record<QuotationStatus, string> = {
                    'Draft': 'bg-gray-100 text-gray-700 border-gray-300',
                    'Pending Approval': 'bg-amber-100 text-amber-800 border-amber-300',
                    'Approved': 'bg-blue-100 text-blue-800 border-blue-300',
                    'Sent': 'bg-indigo-100 text-indigo-800 border-indigo-300',
                    'Accepted': 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    'Declined': 'bg-rose-100 text-rose-800 border-rose-300',
                    'Expired': 'bg-gray-200 text-gray-600 border-gray-400',
                    'Cancelled': 'bg-gray-100 text-gray-400 border-gray-200'
                  };

                  return (
                    <div
                      key={quote.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:shadow-sm transition-all duration-150 space-y-3"
                    >
                      {/* Top Row: Quotation ID, Status, Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-black text-sm text-[#292F36]">
                            {quote.id}
                          </span>
                          <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
                            Rev {quote.revisionNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColors[quote.status]}`}>
                            {quote.status}
                          </span>
                          {quote.rfqId && (
                            <span className="text-[10px] text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                              RFQ: {quote.rfqId}
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Validity Expired
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap text-xs">
                          <button
                            onClick={() => handleCopyCustomerLink(quote)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title="Copy customer portal acceptance link"
                          >
                            {copiedQuoteToken === quote.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Link Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => downloadQuotationPdf(quote)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-[#B5121B] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-red-200"
                            title="Download official corporate branded PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>

                          <button
                            onClick={() => setSelectedQuotationForPrint(quote)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title="Generate and print official corporate quotation slip"
                          >
                            <Printer className="w-3.5 h-3.5 text-gray-600" />
                            <span>Print Slip</span>
                          </button>

                          <button
                            onClick={() => handleDuplicateQuote(quote)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title="Clone as new revision (Rev +1)"
                          >
                            <FilePlus className="w-3.5 h-3.5 text-gray-600" />
                            <span>New Rev</span>
                          </button>

                          <button
                            onClick={() => handleEditQuote(quote)}
                            className="px-3 py-1 bg-[#B5121B] hover:bg-[#8F1018] text-white font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit / Review</span>
                          </button>
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Client Info */}
                        <div className="space-y-1 text-gray-600 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                          <span className="font-bold text-gray-900 block mb-1">Customer / Client:</span>
                          <p className="font-bold text-gray-800">{quote.customerCompanyName || 'Direct Client'}</p>
                          <p>Attn: <strong>{quote.customerFullName || 'Purchasing Department'}</strong></p>
                          <p>Email: <a href={`mailto:${quote.customerEmail}`} className="text-[#B5121B] underline">{quote.customerEmail}</a></p>
                          {quote.customerMobileNumber && <p>Phone: <strong>{quote.customerMobileNumber}</strong></p>}
                          {quote.deliveryAddress && <p className="truncate">Destination: <strong>{quote.deliveryAddress}</strong></p>}
                        </div>

                        {/* Commercial Terms & Items Summary */}
                        <div className="space-y-1 text-gray-600 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                          <span className="font-bold text-gray-900 block mb-1">
                            Line Items & Terms ({quote.items.length}):
                          </span>
                          <ul className="space-y-1 mb-2">
                            {quote.items.slice(0, 3).map((item, idx) => (
                              <li key={idx} className="flex justify-between text-[11px]">
                                <span className="truncate pr-1">
                                  {item.quantity}x {item.productName}
                                </span>
                                <span className="font-mono font-bold text-gray-800 shrink-0">
                                  ₱{item.lineTotalPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </li>
                            ))}
                            {quote.items.length > 3 && (
                              <li className="text-[10px] text-gray-400 italic">
                                + {quote.items.length - 3} more items...
                              </li>
                            )}
                          </ul>
                          <div className="pt-1.5 border-t border-gray-200/80 text-[11px] space-y-0.5">
                            <p>VAT Model: <strong className="uppercase">{quote.vatType.replace(/_/g, ' ')}</strong></p>
                            <p>Payment: <strong>{quote.paymentTerms}</strong></p>
                            <p>Valid until: <strong>{new Date(quote.validUntil).toLocaleDateString()}</strong></p>
                          </div>
                        </div>

                        {/* Totals & Approval State */}
                        <div className="space-y-2 bg-gray-50/50 p-3 rounded-lg border border-gray-100 flex flex-col justify-between">
                          <div>
                            <span className="font-bold text-gray-900 block mb-1">Financial Breakdown:</span>
                            <div className="space-y-1 text-[11px] text-gray-600">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="font-mono">₱{quote.subtotalPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              {quote.discountAmountPhp > 0 && (
                                <div className="flex justify-between text-emerald-700">
                                  <span>Discount:</span>
                                  <span className="font-mono">-₱{quote.discountAmountPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>VAT (12%):</span>
                                <span className="font-mono">₱{quote.vatAmountPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>

                          {/* Client acceptance note if present */}
                          {quote.clientPoNumber && (
                            <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-[11px] text-emerald-900">
                              <span className="font-bold block">Conformed PO #: {quote.clientPoNumber}</span>
                              {quote.customerResponseNotes && (
                                <span className="text-[10px] italic">{quote.customerResponseNotes}</span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
                            <span className="text-gray-500 font-bold">Grand Total (PHP):</span>
                            <span className="font-mono font-black text-base text-[#B5121B]">
                              ₱{quote.grandTotalPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* 3. PRODUCT CATALOG MANAGEMENT TAB */}
      {activeAdminTab === 'products' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Administrator Warning: Pending Seed Banner */}
          {isSupabaseConfigured() && supabaseSeedPending && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-amber-950">
                      Supabase Product Seed Pending ({databaseProductCount} / 46 in Database)
                    </h3>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      The catalog currently displayed is served from <code>src/data/consignmentProducts.ts</code> because your Supabase database has not had <code>supabase/consignment_seed.sql</code> executed yet.
                    </p>
                    <p className="text-xs text-amber-800">
                      To enable database persistence for stock updates, pricing edits, and product management, execute the seed in your Supabase SQL Editor.
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setRefreshingCatalog(true);
                    await refreshProducts();
                    setRefreshingCatalog(false);
                  }}
                  disabled={refreshingCatalog}
                  className="shrink-0 px-3.5 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingCatalog ? 'animate-spin' : ''}`} />
                  <span>Re-check Database</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#292F36]">Hardware Catalog & Inventory</h2>
              <p className="text-xs text-gray-500">
                Manage all {products.length} products ({publishedProductsCount} published, {archivedProductsCount} archived), SRP prices, technical specs, and stock availability.
              </p>
            </div>

            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Equipment</span>
            </button>
          </div>

          {/* Search & Publication Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by title, SKU, brand, or model..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#B5121B]"
                />
              </div>

              <select
                value={prodCategoryFilter}
                onChange={(e) => setProdCategoryFilter(e.target.value)}
                className="py-1.5 px-2.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-700"
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setProdPublishFilter('all')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  prodPublishFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({products.length})
              </button>
              <button
                onClick={() => setProdPublishFilter('published')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  prodPublishFilter === 'published'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Published ({publishedProductsCount})
              </button>
              <button
                onClick={() => setProdPublishFilter('archived')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  prodPublishFilter === 'archived'
                    ? 'bg-white text-amber-800 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Archived ({archivedProductsCount})
              </button>
            </div>
          </div>

          {/* Action error banner */}
          {tableActionError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#B5121B] shrink-0" />
                <span>{tableActionError}</span>
              </div>
              <button 
                onClick={() => setTableActionError(null)} 
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Product Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#292F36] text-white">
                  <tr>
                    <th className="py-3 px-3">Equipment</th>
                    <th className="py-3 px-3">Brand</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">SKU / Model</th>
                    <th className="py-3 px-3 text-right">Price (PHP)</th>
                    <th className="py-3 px-3 text-center">Stock Status</th>
                    <th className="py-3 px-3 text-center">Visibility</th>
                    <th className="py-3 px-3 text-center">Featured</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAdminProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500">
                        <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-gray-700">No products match your current filter</p>
                        <p className="text-[11px] text-gray-400 mt-1">Try resetting the search keyword or status tab</p>
                        <button
                          onClick={() => {
                            setProdSearch('');
                            setProdPublishFilter('all');
                            setProdCategoryFilter('all');
                          }}
                          className="mt-3 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredAdminProducts.map((prod) => (
                      <tr key={prod.id} className={`hover:bg-gray-50/50 ${prod.isPublished === false ? 'bg-gray-50/70' : ''}`}>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={prod.mainImage}
                              alt={prod.name}
                              className="w-10 h-10 object-contain rounded border border-gray-200 bg-white shrink-0"
                              onError={handleProductImageError}
                            />
                            <div className="min-w-0">
                              <span 
                                onClick={() => navigateToProduct(prod.id)}
                                className="font-bold text-gray-900 hover:text-[#B5121B] cursor-pointer line-clamp-1"
                              >
                                {prod.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {(() => {
                                  const imgMeta = getProductImageMetadata(prod);
                                  return (
                                    <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${imgMeta.badgeColor}`}>
                                      {imgMeta.shortLabel}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#B5121B]">{getDisplayBrand(prod.brand)}</td>
                        <td className="py-3 px-3 text-gray-600">{prod.categoryName}</td>
                        <td className="py-3 px-3">
                          <div className="font-mono text-[11px] font-semibold text-gray-800">{prod.sku}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {supabaseSeedPending ? (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200" title="Serving from local consignment catalog (execute consignment_seed.sql to persist in database)">
                                Consignment
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200" title="Authoritative record in Supabase database">
                                Supabase Live
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 font-mono truncate max-w-[100px]">{prod.model}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                          {prod.pricePhp ? (
                            <>
                              ₱{prod.pricePhp.toLocaleString()}
                              {getProductSalesUnit(prod) && <span className="text-[10px] text-gray-400 font-sans ml-1">/ {getProductSalesUnit(prod)}</span>}
                            </>
                          ) : (
                            'Project Pricing'
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {prod.stockStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {prod.isPublished !== false ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              <EyeOff className="w-2.5 h-2.5 text-amber-600" />
                              Archived
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {prod.isFeatured ? (
                            <span className="text-amber-500 font-bold">★ Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleTogglePublish(prod)}
                              className={`p-1.5 rounded cursor-pointer transition-colors ${
                                prod.isPublished !== false 
                                  ? 'text-gray-500 hover:text-amber-700 hover:bg-amber-50' 
                                  : 'text-amber-700 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={prod.isPublished !== false ? 'Archive / Hide from public customers' : 'Publish / Show in storefront'}
                            >
                              {prod.isPublished !== false ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="p-1.5 text-gray-600 hover:text-[#B5121B] hover:bg-gray-100 rounded cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(prod)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. CATEGORIES & BRANDS TAB */}
      {activeAdminTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
          {/* Categories */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-[#292F36]">Equipment Categories ({categories.length})</h3>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 text-xs">
              {categories.map((c) => (
                <div key={c.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">{c.name}</h4>
                    <p className="text-[11px] text-gray-500">{c.subcategories.join(', ')}</p>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">
                    {products.filter(p => p.categoryId === c.id).length} items
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-[#292F36]">Supported Brand Directory ({brands.length})</h3>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 text-xs">
              {brands.map((b) => (
                <div key={b.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">{b.name}</h4>
                    <p className="text-[11px] text-gray-500">{b.description}</p>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">
                    {b.originCountry}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. ADMINISTRATOR MANAGEMENT TAB (SUPER ADMIN EXCLUSIVE) */}
      {activeAdminTab === 'admins' && isSuperAdmin && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-[#292F36]">Authorized Administrator Management</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Super Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage system administrators, assign roles, configure RFQ notification recipients, and safeguard access.
              </p>
            </div>

            <button
              onClick={() => {
                setInviteModalOpen(true);
                setAdminActionError(null);
                setAdminActionSuccess(null);
              }}
              className="px-4 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Administrator</span>
            </button>
          </div>

          {/* Feedback messages */}
          {adminActionError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#B5121B] shrink-0" />
                <span>{adminActionError}</span>
              </div>
              <button onClick={() => setAdminActionError(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {adminActionSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{adminActionSuccess}</span>
              </div>
              <button onClick={() => setAdminActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Admin Users Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#292F36] text-white">
                  <tr>
                    <th className="py-3 px-3">Administrator</th>
                    <th className="py-3 px-3">Email Address</th>
                    <th className="py-3 px-3">Assigned Role</th>
                    <th className="py-3 px-3 text-center">RFQ Email Alerts</th>
                    <th className="py-3 px-3 text-center">Account Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adminListLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#B5121B] mx-auto mb-2" />
                        <p className="font-semibold text-gray-700">Loading authorized administrators...</p>
                      </td>
                    </tr>
                  ) : adminList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-gray-700">No administrator records found.</p>
                      </td>
                    </tr>
                  ) : (
                    adminList.map((admin) => {
                      const isCurrentUser = adminUser?.email?.toLowerCase() === admin.email.toLowerCase();
                      return (
                        <tr key={admin.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700 text-xs">
                                {admin.fullName ? admin.fullName.charAt(0).toUpperCase() : 'A'}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                  <span>{admin.fullName || 'Administrator'}</span>
                                  {isCurrentUser && (
                                    <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">
                                  ID: {admin.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-gray-700">
                            {admin.email}
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={admin.role}
                              onChange={(e) => handleChangeAdminRole(admin, e.target.value as AdminRole)}
                              disabled={adminActionLoading}
                              className="py-1 px-2 text-xs font-semibold rounded border border-gray-300 bg-white focus:outline-none focus:border-[#B5121B]"
                            >
                              <option value="super_admin">Super Admin (Full Access)</option>
                              <option value="admin">Administrator (Operations)</option>
                              <option value="sales_engineer">Sales Engineer (Catalog & RFQ)</option>
                            </select>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleToggleAdminNotifications(admin)}
                              disabled={adminActionLoading}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                                admin.receiveRfqNotifications !== false
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                              }`}
                              title="Click to toggle RFQ email notifications"
                            >
                              {admin.receiveRfqNotifications !== false ? (
                                <>
                                  <Bell className="w-3 h-3 text-emerald-600" />
                                  <span>Enabled</span>
                                </>
                              ) : (
                                <>
                                  <BellOff className="w-3 h-3 text-gray-400" />
                                  <span>Disabled</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleToggleAdminActive(admin)}
                              disabled={adminActionLoading}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                                admin.isActive
                                  ? 'bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100'
                                  : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                              }`}
                              title="Click to toggle active status"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-blue-600' : 'bg-amber-600'}`}></span>
                              <span>{admin.isActive ? 'Active' : 'Suspended'}</span>
                            </button>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setAdminToDelete(admin)}
                              disabled={adminActionLoading || isCurrentUser}
                              className="text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-1 transition-colors cursor-pointer"
                              title={isCurrentUser ? 'Cannot delete your own account' : 'Delete administrator account'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Safeguards footer banner */}
            <div className="bg-gray-50 border-t border-gray-200 p-3.5 text-xs text-gray-600 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Super Admin Safeguards Active:</strong> Privilege escalation is strictly prevented at the database trigger layer. Standard administrators cannot modify other users' roles, status, or notifications. The last remaining active Super Admin account is permanently protected against deactivation, demotion, or deletion.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. RFQ NOTIFICATION ALERTS, DELIVERY LOGS & QUOTA HEALTH TAB */}
      {activeAdminTab === 'notifications' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#B5121B]" />
                <h2 className="text-base font-bold text-[#292F36]">RFQ Email Alerts & Resend Quotas</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Automated email delivery to administrators via Resend Free tier. Monitor real-time daily/monthly quota usage and delivery audit logs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadNotificationData}
                disabled={notifLogsLoading}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh Quota and Delivery Logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${notifLogsLoading ? 'animate-spin text-[#B5121B]' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleDispatchQueue}
                disabled={dispatchingQueue}
                className="px-4 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {dispatchingQueue ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Queue...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Pending Queue</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quota & Status Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Daily Quota */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Daily Resend Quota</span>
                <span className="text-[10px] font-mono text-gray-400">PST (UTC+8)</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">{notifQuotaStats.todaySentCount}</span>
                <span className="text-xs text-gray-400 font-bold">/ {notifQuotaStats.dailyLimit}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    notifQuotaStats.todaySentCount >= notifQuotaStats.dailyLimit
                      ? 'bg-rose-600'
                      : notifQuotaStats.todaySentCount > 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (notifQuotaStats.todaySentCount / notifQuotaStats.dailyLimit) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 block">
                {Math.max(0, notifQuotaStats.dailyLimit - notifQuotaStats.todaySentCount)} emails remaining today
              </span>
            </div>

            {/* Monthly Quota */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Monthly Quota</span>
                <span className="text-[10px] font-mono text-gray-400">Free Tier</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">{notifQuotaStats.monthSentCount}</span>
                <span className="text-xs text-gray-400 font-bold">/ {notifQuotaStats.monthlyLimit}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, (notifQuotaStats.monthSentCount / notifQuotaStats.monthlyLimit) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 block">
                {Math.max(0, notifQuotaStats.monthlyLimit - notifQuotaStats.monthSentCount)} emails remaining this month
              </span>
            </div>

            {/* Pending In Queue */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
              <span className="text-xs text-gray-500 font-medium">Pending Queue</span>
              <div className="text-2xl font-black text-blue-600">{notifQuotaStats.pendingCount}</div>
              <span className="text-[10px] text-gray-500 block">
                {notifQuotaStats.pendingCount > 0 ? 'Ready for automatic dispatch' : 'Queue is fully caught up'}
              </span>
            </div>

            {/* Failed & Quota Exceeded */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
              <span className="text-xs text-gray-500 font-medium">Failed / Exceeded</span>
              <div className="text-2xl font-black text-[#B5121B]">{notifQuotaStats.failedCount}</div>
              <span className="text-[10px] text-gray-500 block">
                {notifQuotaStats.failedCount > 0 ? 'Review errors below to retry' : 'Zero delivery failures'}
              </span>
            </div>
          </div>

          {/* Delivery Logs Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#292F36]">Recent RFQ Delivery Audit Logs</h3>
              <span className="text-xs text-gray-400 font-mono">Showing {notifLogs.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#292F36] text-white">
                  <tr>
                    <th className="py-2.5 px-3">RFQ Reference</th>
                    <th className="py-2.5 px-3">Recipient Admin</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Attempts</th>
                    <th className="py-2.5 px-3">Delivery Time (PST)</th>
                    <th className="py-2.5 px-3">Details / Resend ID</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {notifLogsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#B5121B] mx-auto mb-2" />
                        <p className="font-semibold text-gray-700">Loading delivery logs...</p>
                      </td>
                    </tr>
                  ) : notifLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-gray-700">No email notification logs recorded yet.</p>
                        <p className="text-[11px] text-gray-400 mt-1">Logs will appear automatically when customers submit new RFQs.</p>
                      </td>
                    </tr>
                  ) : (
                    notifLogs.map((log) => {
                      const isSent = log.status === 'sent';
                      const isPending = log.status === 'pending' || log.status === 'queued';
                      const isProcessing = log.status === 'processing';
                      const isFailed = log.status === 'failed';
                      const isRetrying = log.status === 'retrying';
                      const isQuotaExceeded = log.status === 'quota_exceeded';

                      return (
                        <tr key={log.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-3">
                            <span
                              onClick={() => {
                                setRfqSearch(log.rfqId);
                                setActiveAdminTab('rfqs');
                              }}
                              className="font-mono font-bold text-[#B5121B] hover:underline cursor-pointer"
                              title="Click to view full RFQ in Quotations tab"
                            >
                              {log.rfqId}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-gray-900">{log.recipientName}</div>
                            <div className="text-[11px] text-gray-500">{log.recipientEmail}</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isSent
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isProcessing
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : isPending
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : isRetrying
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-gray-600">
                            {log.attemptCount} / {log.maxAttempts}
                          </td>
                          <td className="py-3 px-3 text-gray-600">
                            {log.sentAt
                              ? new Date(log.sentAt).toLocaleString('en-US', { timeZone: 'Asia/Manila' })
                              : new Date(log.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            {log.resendId ? (
                              <span className="font-mono text-[11px] text-gray-600 truncate block">
                                ID: {log.resendId}
                              </span>
                            ) : log.errorMessage ? (
                              <span className="text-[11px] text-red-600 line-clamp-1" title={log.errorMessage}>
                                {log.errorMessage}
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Pending dispatch</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {(isFailed || isRetrying || isQuotaExceeded) && (
                              <button
                                onClick={() => handleRetryLog(log.id)}
                                disabled={retryingLogId === log.id}
                                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {retryingLogId === log.id ? 'Queuing...' : 'Retry'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. SETTINGS TAB */}
      {activeAdminTab === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-2xs max-w-3xl space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-base font-bold text-[#292F36]">Company Profile & Contact Information</h2>
            <p className="text-xs text-gray-500">
              Update official hotline, Viber number, office address, and promotional announcement strip.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Company Registered Name</label>
                <input
                  type="text"
                  value={settingsForm.companyName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Company Tagline</label>
                <input
                  type="text"
                  value={settingsForm.tagline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Primary Hotline</label>
                <input
                  type="text"
                  value={settingsForm.phonePrimary}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phonePrimary: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Mobile / Viber Support</label>
                <input
                  type="text"
                  value={settingsForm.mobileViber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, mobileViber: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Corporate Sales Email</label>
                <input
                  type="email"
                  value={settingsForm.emailSales}
                  onChange={(e) => setSettingsForm({ ...settingsForm, emailSales: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Office & Warehouse Depot Address</label>
              <textarea
                rows={2}
                value={settingsForm.officeAddress}
                onChange={(e) => setSettingsForm({ ...settingsForm, officeAddress: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Top Announcement Banner</label>
              <input
                type="text"
                value={settingsForm.bannerAnnouncement}
                onChange={(e) => setSettingsForm({ ...settingsForm, bannerAnnouncement: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bannerToggle"
                checked={settingsForm.isBannerActive}
                onChange={(e) => setSettingsForm({ ...settingsForm, isBannerActive: e.target.checked })}
                className="rounded text-[#B5121B]"
              />
              <label htmlFor="bannerToggle" className="font-semibold text-gray-700">
                Display top announcement banner on public storefront
              </label>
            </div>

            {settingsSaved && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
                Site contact settings updated successfully!
              </div>
            )}

            <button
              type="submit"
              className="py-2.5 px-6 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Save Configuration
            </button>
          </form>

          {/* PERSONAL RFQ NOTIFICATION SETTINGS CARD */}
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#B5121B]" />
                <h3 className="font-bold text-sm text-[#292F36]">Personal RFQ Email Notifications</h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure whether your administrator email ({adminUser?.email}) receives automated alerts when clients submit new quotation requests.
              </p>
            </div>

            {prefMessage && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{prefMessage}</span>
                </div>
                <button onClick={() => setPrefMessage(null)} className="text-blue-500 hover:text-blue-700 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-gray-900 text-xs">Automated Quotation Alert Emails</p>
                <p className="text-[11px] text-gray-500">
                  Current Status:{' '}
                  <span className={`font-bold ${adminUser?.receiveRfqNotifications !== false ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {adminUser?.receiveRfqNotifications !== false ? 'Enabled (Receiving alerts)' : 'Disabled (Paused)'}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleOwnNotification}
                disabled={prefUpdating}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  adminUser?.receiveRfqNotifications !== false
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    : 'bg-[#B5121B] hover:bg-[#8F1018] text-white shadow-sm'
                }`}
              >
                {prefUpdating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : adminUser?.receiveRfqNotifications !== false ? (
                  <>
                    <BellOff className="w-3.5 h-3.5" />
                    <span>Disable My Alerts</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>Enable My Alerts</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-base text-[#292F36]">
                  {editingProduct ? `Edit Product: ${editingProduct.sku}` : 'Add New ICT Equipment'}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {editingProduct 
                    ? 'Changes will be saved to Supabase and immediately reflected across the website.' 
                    : 'Enter complete equipment details, pricing, and technical specifications.'}
                </p>
              </div>
              <button 
                onClick={() => setProductModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs max-h-[78vh] overflow-y-auto pr-2">
              {prodModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#B5121B] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Cannot Save Product</p>
                    <p>{prodModalError}</p>
                  </div>
                </div>
              )}

              {/* Title & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Product Title *</label>
                  <input
                    required
                    type="text"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    placeholder="e.g. Cat5e UTP 4-Pair 24AWG Solid Cable (305m)"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B5121B]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Brand *</label>
                  <input
                    required
                    type="text"
                    value={prodForm.brand}
                    onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                    placeholder="e.g. Linkbasic, Cisco, Ubiquiti"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B5121B]"
                  />
                </div>
              </div>

              {/* Model, SKU & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Model Number *</label>
                  <input
                    required
                    type="text"
                    value={prodForm.model}
                    onChange={(e) => setProdForm({ ...prodForm, model: e.target.value })}
                    placeholder="e.g. CLA04-UC5E-7035"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B5121B]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    SKU * {products.some(p => (!editingProduct || p.id !== editingProduct.id) && p.sku?.trim().toLowerCase() === (prodForm.sku?.trim() || '').toLowerCase()) && (
                      <span className="text-[10px] text-red-600 font-normal ml-1">Duplicate!</span>
                    )}
                  </label>
                  <input
                    required
                    type="text"
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    className={`w-full p-2.5 border rounded-lg font-mono focus:outline-none ${
                      products.some(p => (!editingProduct || p.id !== editingProduct.id) && p.sku?.trim().toLowerCase() === (prodForm.sku?.trim() || '').toLowerCase())
                        ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-600'
                        : 'border-gray-300 focus:border-[#B5121B]'
                    }`}
                  />
                  {products.some(p => (!editingProduct || p.id !== editingProduct.id) && p.sku?.trim().toLowerCase() === (prodForm.sku?.trim() || '').toLowerCase()) && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold">
                      This SKU is already used by another product.
                    </p>
                  )}
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Category *</label>
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => {
                      const selCat = categories.find(c => c.id === e.target.value);
                      setProdForm({ 
                        ...prodForm, 
                        categoryId: e.target.value,
                        categoryName: selCat ? selCat.name : prodForm.categoryName
                      });
                    }}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B5121B] bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price, Sales Unit, Stock Status, Lead Time */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">SRP Price (PHP)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prodForm.pricePhp !== undefined ? prodForm.pricePhp : ''}
                    onChange={(e) => setProdForm({ ...prodForm, pricePhp: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    placeholder="e.g. 5200"
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-[#B5121B]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Sales Unit</label>
                  <input
                    type="text"
                    value={prodForm.salesUnit || ''}
                    onChange={(e) => setProdForm({ ...prodForm, salesUnit: e.target.value })}
                    placeholder="e.g. box, unit, roll"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B5121B]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Stock Status</label>
                  <select
                    value={prodForm.stockStatus}
                    onChange={(e) => setProdForm({ ...prodForm, stockStatus: e.target.value as StockStatus })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B5121B] bg-white"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Pre-Order (5-7 Days)">Pre-Order (5-7 Days)</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Contact for Availability">Contact for Availability</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Warranty Term</label>
                  <input
                    type="text"
                    value={prodForm.warranty}
                    onChange={(e) => setProdForm({ ...prodForm, warranty: e.target.value })}
                    placeholder="e.g. 1-Year Limited Warranty"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B5121B]"
                  />
                </div>
              </div>

              {/* Product Photography & Gallery Management */}
              {(() => {
                const activeImages = Array.from(new Set([
                  prodForm.mainImage,
                  ...(prodForm.galleryImages || [])
                ])).filter(img => Boolean(img) && !img?.includes('-pending.svg') && !img?.includes('image-pending.svg')) as string[];

                return (
                  <div className="space-y-3 p-4 bg-gray-50/90 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-[#B5121B]" />
                          <span>Product Photography & Gallery</span>
                        </label>
                        <p className="text-[11px] text-gray-500">
                          Upload genuine equipment photos to Supabase Storage (<code className="text-gray-700 bg-gray-200/70 px-1 rounded">product-images</code> bucket). JPG, PNG, or WebP up to 10 MB.
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {/* Hidden file inputs strictly restricted to JPG, PNG, WebP */}
                        <input
                          ref={desktopFileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) handleUploadFiles(e.target.files);
                            e.target.value = '';
                          }}
                        />
                        <input
                          ref={cameraInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) handleUploadFiles(e.target.files);
                            e.target.value = '';
                          }}
                        />

                        <button
                          type="button"
                          disabled={uploadingImage}
                          onClick={() => desktopFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                          title="Upload product photo from desktop or mobile photo library"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload Photo</span>
                        </button>

                        <button
                          type="button"
                          disabled={uploadingImage}
                          onClick={() => cameraInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                          title="Capture photo using camera (iPhone / Android / Tablet)"
                        >
                          <Camera className="w-3.5 h-3.5 text-gray-600" />
                          <span className="hidden sm:inline">Camera</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-600 border border-gray-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          title="Enter direct image URL or local catalog path"
                        >
                          {showUrlInput ? 'Cancel URL' : '+ Link URL'}
                        </button>
                      </div>
                    </div>

                    {/* Upload progress & error notices */}
                    {uploadingImage && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-[#B5121B] font-medium animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>{uploadProgressText || 'Uploading photograph to Supabase Storage...'}</span>
                      </div>
                    )}

                    {uploadError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-bold">Upload Error: </span>
                          <span>{uploadError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadError(null)}
                          className="text-rose-500 hover:text-rose-800 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Manual URL Input Bar */}
                    {showUrlInput && (
                      <div className="p-2.5 bg-white rounded-lg border border-gray-300 flex items-center gap-2 shadow-2xs">
                        <input
                          type="text"
                          value={manualUrlInput}
                          onChange={(e) => setManualUrlInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManualUrl(); } }}
                          placeholder="https://... or /catalog/... image URL"
                          className="flex-1 text-xs p-1.5 border border-gray-300 rounded focus:outline-none focus:border-[#B5121B]"
                        />
                        <button
                          type="button"
                          onClick={handleAddManualUrl}
                          className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                          Add URL
                        </button>
                      </div>
                    )}

                    {/* Active Image Cards Gallery */}
                    {activeImages.length === 0 ? (
                      <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-white space-y-2">
                        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-gray-700">Official Equipment Photo Pending</p>
                        <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                          Currently using neutral technical SVG placeholder (<code className="text-gray-600 bg-gray-100 px-1 rounded">{prodForm.mainImage || '/catalog/image-pending.svg'}</code>). Click <strong>Upload Photo</strong> or <strong>Camera</strong> to add high-resolution photos.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>Active Photographs ({activeImages.length})</span>
                          <span>Click photo to enlarge preview</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {activeImages.map((imgUrl, idx) => {
                            const isMain = imgUrl === prodForm.mainImage;
                            return (
                              <div
                                key={idx}
                                className={`relative group bg-white rounded-lg border p-2 flex flex-col justify-between transition-all ${
                                  isMain ? 'border-[#B5121B] ring-2 ring-red-100 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {/* Thumbnail */}
                                <div
                                  onClick={() => setPreviewLightboxImage(imgUrl)}
                                  className="w-full h-24 rounded bg-gray-50/80 flex items-center justify-center p-1 cursor-pointer overflow-hidden relative"
                                  title="Click to view full-size preview"
                                >
                                  <img
                                    src={imgUrl}
                                    alt={`Photo ${idx + 1}`}
                                    className="max-h-full max-w-full object-contain"
                                    onError={handleProductImageError}
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Maximize2 className="w-4 h-4" />
                                  </div>
                                </div>

                                {/* Badges & Actions */}
                                <div className="mt-2 flex items-center justify-between gap-1 text-[11px]">
                                  {isMain ? (
                                    <span className="inline-flex items-center gap-1 font-bold text-[#B5121B] text-[10px]">
                                      <Star className="w-3 h-3 fill-[#B5121B]" />
                                      <span>Main Photo</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSetMainImage(imgUrl)}
                                      className="text-gray-600 hover:text-[#B5121B] font-semibold text-[10px] hover:underline cursor-pointer"
                                    >
                                      Set as Main
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(imgUrl)}
                                    className="text-gray-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                                    title="Remove photo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Image Source & Verification Classification */}
                    <div className="pt-3 border-t border-gray-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-xs text-gray-700">
                          Photograph Source & Verification Classification
                        </label>
                        <span className="text-[10px] text-gray-500 font-mono">Column: image_status</span>
                      </div>
                      <select
                        value={prodForm.imageStatus || 'pending'}
                        onChange={(e) => setProdForm({ ...prodForm, imageStatus: e.target.value as ProductImageStatus })}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#B5121B]"
                      >
                        <option value="pending">Official Photo Pending — Neutral equipment silhouette placeholder</option>
                        <option value="illustrative">Storefront Reference Photo — Uploaded staff / facility photography</option>
                        <option value="supplier-provided">Supplier Consignment Photo — Verified delivery package intake</option>
                        <option value="manufacturer-matched">Manufacturer Reference Photo — Exact model verified against datasheet</option>
                      </select>
                      <p className="text-[10px] text-gray-500">
                        <strong>Catalog Discipline:</strong> Uploaded staff photographs are classified as Storefront Reference Photos. Only select "Manufacturer Reference Photo" when exact model specifications, port count, and color have been verified against official manufacturer documentation.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Descriptions */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Short Description (1 sentence)</label>
                <input
                  type="text"
                  value={prodForm.shortDescription}
                  onChange={(e) => setProdForm({ ...prodForm, shortDescription: e.target.value })}
                  placeholder="e.g. Cat5e UTP 4-Pair Solid Copper Lan Cable in 305m easy-pull box."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B5121B]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Technical Overview</label>
                <textarea
                  rows={3}
                  value={prodForm.fullDescription}
                  onChange={(e) => setProdForm({ ...prodForm, fullDescription: e.target.value })}
                  placeholder="Detailed technical specifications, engineering compliance, and deployment applications..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B5121B]"
                />
              </div>

              {/* Key Specs */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Key Specifications Bullet Points (one item per line)
                </label>
                <textarea
                  rows={3}
                  value={keySpecsText}
                  onChange={(e) => setKeySpecsText(e.target.value)}
                  placeholder="Cat5e 4-pair unshielded twisted pair&#10;24 AWG solid bare copper conductor&#10;305m pull-box packaging"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B5121B]"
                />
              </div>

              {/* Structured Specifications Table */}
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-700">Detailed Technical Specifications</label>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="text-[11px] text-[#B5121B] hover:text-[#8F1018] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Spec Row</span>
                  </button>
                </div>

                {specificationsList.length === 0 ? (
                  <p className="text-gray-400 italic text-[11px]">No structured specifications added yet.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {specificationsList.map((spec, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Category (e.g. Electrical)"
                          value={spec.category}
                          onChange={(e) => handleUpdateSpecRow(idx, 'category', e.target.value)}
                          className="w-1/3 p-1.5 border border-gray-300 rounded bg-white text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Label (e.g. Conductor)"
                          value={spec.label}
                          onChange={(e) => handleUpdateSpecRow(idx, 'label', e.target.value)}
                          className="w-1/3 p-1.5 border border-gray-300 rounded bg-white text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. 24AWG Copper)"
                          value={spec.value}
                          onChange={(e) => handleUpdateSpecRow(idx, 'value', e.target.value)}
                          className="w-1/3 p-1.5 border border-gray-300 rounded bg-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecRow(idx)}
                          className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                          title="Remove row"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Publication & Showcase Toggles */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
                  <input
                    type="checkbox"
                    id="publishedToggle"
                    checked={prodForm.isPublished !== false}
                    onChange={(e) => setProdForm({ ...prodForm, isPublished: e.target.checked })}
                    className="rounded text-[#B5121B] mt-0.5"
                  />
                  <div>
                    <label htmlFor="publishedToggle" className="font-bold text-gray-900 cursor-pointer block">
                      Published to Public Storefront
                    </label>
                    <p className="text-[11px] text-gray-500">
                      When checked, visitors can search, view, and add this product to quotation requests. When unchecked, this item is archived and hidden from customers without permanent deletion.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 px-3">
                  <input
                    type="checkbox"
                    id="featuredToggle"
                    checked={prodForm.isFeatured}
                    onChange={(e) => setProdForm({ ...prodForm, isFeatured: e.target.checked })}
                    className="rounded text-[#B5121B]"
                  />
                  <label htmlFor="featuredToggle" className="font-semibold text-gray-700 cursor-pointer">
                    Feature this item on homepage showcase
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={prodModalLoading}
                  className="px-5 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white font-bold rounded-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm transition-colors"
                >
                  {prodModalLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Persisting to Supabase...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Save Changes' : 'Create & Persist Equipment'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PRODUCT CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[#292F36]">Confirm Product Deletion</h3>
                <p className="text-xs text-gray-500">
                  Are you sure you want to permanently delete this product from the catalog?
                </p>
              </div>
            </div>

            {/* Product Summary Card */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
              <img
                src={productToDelete.mainImage}
                alt={productToDelete.name}
                className="w-12 h-12 object-contain bg-white rounded border border-gray-200 p-0.5 shrink-0"
                onError={handleProductImageError}
              />
              <div className="min-w-0 text-xs">
                <p className="font-bold text-gray-900 truncate">{productToDelete.name}</p>
                <p className="text-gray-500 font-mono text-[11px]">{productToDelete.sku} • {productToDelete.brand}</p>
                {productToDelete.pricePhp && (
                  <p className="text-[#B5121B] font-bold font-mono text-[11px]">₱{productToDelete.pricePhp.toLocaleString()}</p>
                )}
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                Permanent Database Removal
              </p>
              <p className="text-[11px] text-amber-800">
                This will delete the row from your Supabase PostgreSQL database. If you only want to temporarily hide it from customers, you can choose <strong>Archive / Hide</strong> instead.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-end gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={deleteConfirmLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchiveInsteadOfDelete}
                disabled={deleteConfirmLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors"
              >
                Archive Instead
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                {deleteConfirmLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewLightboxImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewLightboxImage(null)}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl p-4 shadow-2xl overflow-hidden flex flex-col items-center" 
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewLightboxImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer z-10"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full max-h-[75vh] flex items-center justify-center p-2 bg-gray-50/50 rounded-xl overflow-hidden">
              <img
                src={previewLightboxImage}
                alt="Enlarged Preview"
                className="max-h-[72vh] max-w-full object-contain"
                onError={handleProductImageError}
              />
            </div>
            <div className="w-full mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="truncate font-mono text-[11px] max-w-md">{previewLightboxImage}</span>
              <button
                onClick={() => setPreviewLightboxImage(null)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVITE ADMINISTRATOR MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#B5121B]" />
                <h3 className="font-bold text-base text-[#292F36]">Invite New Administrator</h3>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteAdmin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B5121B]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Corporate Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="msantos@zezautomation.ph"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B5121B]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Administrative Role *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white font-semibold text-gray-800 focus:outline-none focus:border-[#B5121B]"
                >
                  <option value="sales_engineer">Sales Engineer (RFQ Processing & Catalog Read/Write)</option>
                  <option value="admin">Operations Administrator (Catalog & RFQ Management)</option>
                  <option value="super_admin">Super Administrator (Full System & User Management)</option>
                </select>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <input
                  type="checkbox"
                  id="inviteNotifs"
                  checked={inviteReceiveNotifs}
                  onChange={(e) => setInviteReceiveNotifs(e.target.checked)}
                  className="rounded text-[#B5121B] mt-0.5"
                />
                <div>
                  <label htmlFor="inviteNotifs" className="font-bold text-gray-900 cursor-pointer block">
                    Receive Automated RFQ Alerts
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Send immediate notification emails to this user whenever a new RFQ is submitted.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 font-bold">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminActionLoading}
                  className="px-5 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {adminActionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Invitation...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Invite</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ADMINISTRATOR CONFIRMATION MODAL */}
      {adminToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[#292F36]">Confirm Administrator Removal</h3>
                <p className="text-xs text-gray-500">
                  Are you sure you want to permanently remove this administrator account?
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
              <p className="font-bold text-gray-900">{adminToDelete.fullName}</p>
              <p className="text-gray-500 font-mono text-[11px]">{adminToDelete.email}</p>
              <p className="text-gray-600 text-[11px] mt-1">Role: <span className="font-bold">{adminToDelete.role}</span></p>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                Permanent Account Deletion
              </p>
              <p className="text-[11px] text-amber-800">
                This will delete the administrator record from Supabase and revoke all system privileges. This action cannot be undone.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAdminToDelete(null)}
                disabled={adminActionLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAdmin}
                disabled={adminActionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {adminActionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B2B QUOTATION MAKER MODAL */}
      {isQuotationMakerOpen && selectedQuotationForEdit && (
        <QuotationMakerModal
          initialQuotation={selectedQuotationForEdit}
          isOpen={isQuotationMakerOpen}
          onClose={() => setIsQuotationMakerOpen(false)}
          onSaved={handleQuotationSaved}
          onPreviewPrint={(quote) => setSelectedQuotationForPrint(quote)}
        />
      )}

      {/* OFFICIAL CORPORATE QUOTATION PRINT/PDF VIEW */}
      {selectedQuotationForPrint && (
        <QuotationPrintView
          quotation={selectedQuotationForPrint}
          onClose={() => setSelectedQuotationForPrint(null)}
        />
      )}
    </div>
  );
};
