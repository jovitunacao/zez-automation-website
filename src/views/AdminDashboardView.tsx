import React, { useState } from 'react';
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
  Eye,
  Filter,
  Database,
  Lock,
  LogOut,
  RefreshCw,
  UserCheck,
  Key
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, RfqStatus, QuotationRequest, StockStatus } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { getDisplayBrand, getProductSalesUnit } from '../utils/productUtils';

export const AdminDashboardView: React.FC = () => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    categories, 
    brands, 
    rfqRequests, 
    updateRfqStatus, 
    setActiveRfqForPrint, 
    siteSettings, 
    updateSiteSettings,
    setActiveView,
    navigateToProduct,
    adminUser,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
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
  const [tableActionError, setTableActionError] = useState<string | null>(null);

  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'rfqs' | 'products' | 'categories' | 'settings'>('overview');

  // RFQ filtering & search
  const [rfqSearch, setRfqSearch] = useState('');
  const [rfqStatusFilter, setRfqStatusFilter] = useState<string>('all');

  // Product modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state for add/edit product
  const [prodForm, setProdForm] = useState<Partial<Product>>({
    name: '',
    brand: 'Cisco',
    model: '',
    sku: '',
    categoryId: 'networking-equipment',
    categoryName: 'Networking Equipment',
    shortDescription: '',
    fullDescription: '',
    pricePhp: 25000,
    stockStatus: 'In Stock',
    warranty: '1-Year Warranty',
    isFeatured: true,
    mainImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    keySpecs: ['Enterprise standard hardware', 'High reliability and throughput', 'Universal rackmount'],
    specifications: [
      { category: 'General', label: 'Form Factor', value: '1U Rackmount' },
      { category: 'Power', label: 'Input Voltage', value: '220V AC 50/60Hz' }
    ],
    includedAccessories: ['Power cord', 'Mounting bracket screws', 'Quick Start Guide']
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(siteSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

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

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      brand: 'Cisco',
      model: '',
      sku: `ZEZ-${Math.floor(1000 + Math.random() * 9000)}`,
      categoryId: 'networking-equipment',
      categoryName: 'Networking Equipment',
      shortDescription: '',
      fullDescription: '',
      pricePhp: 35000,
      stockStatus: 'In Stock',
      warranty: '2-Year Authorized Warranty',
      isFeatured: false,
      mainImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
      galleryImages: [],
      keySpecs: ['Enterprise Grade Reliability', 'Gigabit Connectivity', 'Rackmount Ready'],
      specifications: [
        { category: 'Networking', label: 'Form Factor', value: '1U 19-inch standard' },
        { category: 'Power', label: 'Power Supply', value: '100-240V AC' }
      ],
      includedAccessories: ['Power cord', 'Mounting brackets']
    });
    setProdModalError(null);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm(prod);
    setProdModalError(null);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.sku) {
      setProdModalError('Product Name and SKU are mandatory fields.');
      return;
    }

    setProdModalLoading(true);
    setProdModalError(null);

    const cat = categories.find(c => c.id === prodForm.categoryId);
    const categoryName = cat ? cat.name : 'Networking Equipment';

    try {
      if (editingProduct) {
        const res = await updateProduct({
          ...editingProduct,
          ...prodForm,
          categoryName
        } as Product);
        if (!res.success) {
          setProdModalError(res.error || 'Failed to update product in database.');
          setProdModalLoading(false);
          return;
        }
      } else {
        const res = await addProduct({
          ...prodForm,
          categoryName,
          galleryImages: prodForm.galleryImages && prodForm.galleryImages.length > 0 ? prodForm.galleryImages : [prodForm.mainImage || '']
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

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" from the catalog? This action will remove it from the Supabase database.`)) {
      return;
    }
    setTableActionError(null);
    const res = await deleteProduct(id);
    if (!res.success) {
      setTableActionError(res.error || `Failed to delete "${name}". Please check database connection.`);
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

          {/* Quotations List */}
          {filteredRfqs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-3">
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

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#292F36]">Hardware Catalog & Inventory</h2>
              <p className="text-xs text-gray-500">
                Manage all {products.length} products, SRP prices, technical specs, and stock availability.
              </p>
            </div>

            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Equipment</span>
            </button>
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
                    <th className="py-3 px-3 text-center">Featured</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={prod.mainImage}
                            alt={prod.name}
                            className="w-10 h-10 object-contain rounded border border-gray-200 bg-white shrink-0"
                          />
                          <div className="min-w-0">
                            <span 
                              onClick={() => navigateToProduct(prod.id)}
                              className="font-bold text-gray-900 hover:text-[#B5121B] cursor-pointer line-clamp-1"
                            >
                              {prod.name}
                            </span>
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
                        {prod.isFeatured ? (
                          <span className="text-amber-500 font-bold">★ Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-1.5 text-gray-600 hover:text-[#B5121B] hover:bg-gray-100 rounded cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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

      {/* 5. SETTINGS TAB */}
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
              className="py-2.5 px-6 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg transition-colors"
            >
              Save Configuration
            </button>
          </form>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="font-bold text-base text-[#292F36]">
                {editingProduct ? 'Edit Catalog Product' : 'Add New ICT Equipment'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-2">
              {prodModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#B5121B] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Database Error</p>
                    <p>{prodModalError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Product Title *</label>
                  <input
                    required
                    type="text"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    placeholder="e.g. Cisco Catalyst 9200L 48-Port Switch"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Brand *</label>
                  <input
                    required
                    type="text"
                    value={prodForm.brand}
                    onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                    placeholder="e.g. Cisco, Ubiquiti, Hikvision"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Model Number *</label>
                  <input
                    required
                    type="text"
                    value={prodForm.model}
                    onChange={(e) => setProdForm({ ...prodForm, model: e.target.value })}
                    placeholder="e.g. C9200L-48P-4G"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">SKU *</label>
                  <input
                    required
                    type="text"
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Category *</label>
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Reference Price (PHP)</label>
                  <input
                    type="number"
                    value={prodForm.pricePhp || ''}
                    onChange={(e) => setProdForm({ ...prodForm, pricePhp: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 89500"
                    className="w-full p-2 border border-gray-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Stock Status</label>
                  <select
                    value={prodForm.stockStatus}
                    onChange={(e) => setProdForm({ ...prodForm, stockStatus: e.target.value as StockStatus })}
                    className="w-full p-2 border border-gray-300 rounded"
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
                    placeholder="e.g. 3-Year Limited Lifetime"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Main Image URL</label>
                <input
                  type="url"
                  value={prodForm.mainImage}
                  onChange={(e) => setProdForm({ ...prodForm, mainImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Short Description</label>
                <input
                  type="text"
                  value={prodForm.shortDescription}
                  onChange={(e) => setProdForm({ ...prodForm, shortDescription: e.target.value })}
                  placeholder="Brief 1-sentence product summary"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Technical Overview</label>
                <textarea
                  rows={3}
                  value={prodForm.fullDescription}
                  onChange={(e) => setProdForm({ ...prodForm, fullDescription: e.target.value })}
                  placeholder="Comprehensive technical breakdown and enterprise applications"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredToggle"
                  checked={prodForm.isFeatured}
                  onChange={(e) => setProdForm({ ...prodForm, isFeatured: e.target.checked })}
                  className="rounded text-[#B5121B]"
                />
                <label htmlFor="featuredToggle" className="font-semibold text-gray-700">
                  Feature this item on homepage showcase
                </label>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={prodModalLoading}
                  className="px-5 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white font-bold rounded flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {prodModalLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <span>Save Product to Catalog</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
