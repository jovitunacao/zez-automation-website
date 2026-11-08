import React, { useState } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  ChevronRight, 
  FileText, 
  ExternalLink,
  Layers,
  Scale,
  ShoppingCart,
  Wrench,
  Server,
  Network,
  Video,
  Flame,
  PhoneCall,
  Zap,
  Building2,
  HardHat,
  Phone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { getDisplayBrand, getProductSalesUnit, getProductImageMetadata, handleProductImageError, getProductPriceDisplay } from '../utils/productUtils';
import { ENGINEERING_SERVICES } from '../data/services';

export const HomeView: React.FC = () => {
  const { 
    categories, 
    brands, 
    products, 
    productsLoading,
    setActiveView, 
    navigateToProduct, 
    navigateToCategory, 
    navigateToBrand,
    addToQuoteCart,
    addToCompare,
    siteSettings
  } = useApp();

  const [featuredTab, setFeaturedTab] = useState<string>('all');

  const publishedProducts = products.filter(p => p.isPublished !== false);
  const featuredCandidateList = publishedProducts.filter(p => p.isFeatured).length > 0
    ? publishedProducts.filter(p => p.isFeatured)
    : publishedProducts;

  const filteredFeatured = featuredCandidateList
    .filter((p) => {
      if (featuredTab === 'all') return true;
      if (featuredTab === 'cabling') return p.categoryId === 'structured-cabling';
      if (featuredTab === 'racks') return p.categoryId === 'racks-cabinets';
      if (featuredTab === 'power') return p.categoryId === 'ups-power-solutions';
      return true;
    })
    .slice(0, 8);

  // 7 Technology Capabilities for Section B
  const technologyCapabilities = [
    {
      title: 'Networking Infrastructure',
      category: 'Enterprise Connectivity',
      description: 'High-throughput managed switches, core routers, optical transceivers, and secure wireless networks.',
      imageUrl: '/categories/networking-equipment.jpg',
      categoryId: 'networking-equipment'
    },
    {
      title: 'Servers and Data Centers',
      category: 'Compute & Storage',
      description: 'Rackmount server chassis, NAS/SAN storage arrays, enterprise hardware, and data hall infrastructure.',
      imageUrl: '/categories/servers-storage.jpg',
      categoryId: 'servers-storage'
    },
    {
      title: 'CCTV and Security Systems',
      category: 'Physical Security',
      description: 'High-definition IP surveillance cameras, network video recorders (NVR), and perimeter monitoring hardware.',
      imageUrl: '/categories/cctv-surveillance.jpg',
      categoryId: 'cctv-surveillance'
    },
    {
      title: 'Structured Cabling',
      category: 'Layer 1 Physical Media',
      description: 'Certified Cat5e/Cat6/Cat6A copper reels, keystone jacks, modular patch panels, and patch cords.',
      imageUrl: '/categories/structured-cabling.jpg',
      categoryId: 'structured-cabling'
    },
    {
      title: 'Fire Detection & Protection',
      category: 'Life Safety Systems',
      description: 'Addressable fire alarm control panels, intelligent smoke sensors, and wet-pipe sprinkler suppression lines.',
      imageUrl: '/services/fire-detection-alarm.jpg',
      serviceId: 'fire-detection-alarm'
    },
    {
      title: 'Telecommunications',
      category: 'Unified Communications',
      description: 'Enterprise IP PBX telephony appliances, VoIP executive desk phones, SIP trunking, and intercom gateways.',
      imageUrl: '/services/telephone-system.jpg',
      serviceId: 'telephone-system'
    },
    {
      title: 'Power & Backup Systems',
      category: 'Electrical Continuity',
      description: 'True online double-conversion UPS systems, industrial generator sets, and surge protection distribution.',
      imageUrl: '/categories/ups-power-solutions.jpg',
      categoryId: 'ups-power-solutions'
    }
  ];

  return (
    <div className="space-y-20 sm:space-y-28 pb-20">
      {/* =========================================================================
          PART 2.A — PREMIUM HERO SECTION
          ========================================================================= */}
      <section className="relative bg-[#292F36] text-white overflow-hidden">
        {/* Subtle geometric architectural accents */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#B5121B_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#B5121B]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300">
                <span className="text-[#B5121B] font-bold">ZEZ Automation Corporation</span>
                <span aria-hidden="true" className="text-gray-500">·</span>
                <span>Equipment Distribution & Infrastructure Engineering</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                Technology. Infrastructure. <span className="text-[#B5121B]">Reliability.</span>
              </h1>

              <p className="text-base sm:text-lg text-gray-300 font-normal leading-relaxed max-w-2xl">
                Enterprise ICT equipment, integrated technology solutions, and professional installation services for businesses and infrastructure projects.
              </p>

              {/* Action Buttons (3 Clear CTAs) */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveView('shop')}
                  className="px-6 py-3.5 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs sm:text-sm font-bold rounded-lg shadow-lg hover:shadow-red-900/30 transition-all flex items-center gap-2 active:scale-95"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveView('rfq')}
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold rounded-lg backdrop-blur-xs border border-white/20 transition-all flex items-center gap-2 active:scale-95"
                >
                  <FileText className="w-4 h-4 text-[#B5121B]" />
                  <span>Request a Quotation</span>
                </button>

                <button
                  onClick={() => setActiveView('services')}
                  className="px-6 py-3.5 bg-transparent hover:bg-white/5 text-gray-200 hover:text-white text-xs sm:text-sm font-bold rounded-lg border border-gray-600 transition-all flex items-center gap-2 active:scale-95"
                >
                  <Wrench className="w-4 h-4 text-gray-300" />
                  <span>Our Services</span>
                </button>
              </div>

              {/* Key Quantitative Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-gray-700/80 text-xs text-gray-300">
                <div>
                  <div className="text-2xl font-black text-white font-mono">12</div>
                  <div className="text-gray-400 mt-0.5">Equipment Categories</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-mono">7</div>
                  <div className="text-gray-400 mt-0.5">Engineering Disciplines</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">DVO · ZAM</div>
                  <div className="text-gray-400 mt-0.5">Dual Operations Hubs</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">Nationwide</div>
                  <div className="text-gray-400 mt-0.5">Logistics Forwarding</div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-gray-700 shadow-2xl bg-gray-900">
                <img
                  src="/hero/hero-datacenter.jpg"
                  alt="Enterprise Data Center and Infrastructure Engineering"
                  loading="eager"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith('/categories/category-fallback.svg')) {
                      target.src = '/categories/category-fallback.svg';
                    }
                  }}
                  className="w-full h-80 sm:h-96 object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#292F36] via-[#292F36]/20 to-transparent" />

                {/* Overlaid Verified Scope Badge */}
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/95 backdrop-blur-md rounded-xl text-[#292F36] shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B5121B]">
                        Engineering & Supply Bundles
                      </span>
                      <p className="text-xs font-bold text-gray-900 mt-0.5">
                        Hardware Sourcing & Complete Field Installation
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveView('services')}
                      className="px-3 py-1.5 bg-[#292F36] text-white hover:bg-[#B5121B] rounded text-xs font-bold transition-colors shrink-0"
                    >
                      View Services
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PART 2.B — TECHNOLOGY CAPABILITIES
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
              Integrated Systems Portfolio
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292F36] mt-1">
              Technology & Engineering Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              Authentic hardware supply paired with certified field engineering across critical enterprise technology systems.
            </p>
          </div>
          <button
            onClick={() => setActiveView('services')}
            className="text-xs font-bold text-[#B5121B] hover:text-[#8F1018] flex items-center gap-1 transition-colors self-start md:self-end"
          >
            <span>Explore All 7 Engineering Disciplines</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {technologyCapabilities.map((cap, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (cap.categoryId) {
                  navigateToCategory(cap.categoryId);
                } else {
                  setActiveView('services');
                }
              }}
              className="group cursor-pointer bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:border-[#B5121B] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={cap.imageUrl}
                    alt={cap.title}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.endsWith('/categories/category-fallback.svg')) {
                        target.src = '/categories/category-fallback.svg';
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 block">
                      {cap.category}
                    </span>
                    <h3 className="font-bold text-sm leading-snug">{cap.title}</h3>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-gray-100 mt-2 flex items-center justify-between text-xs font-semibold text-[#B5121B]">
                <span>{cap.categoryId ? 'View Equipment' : 'View Scope'}</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          PART 2.C — SHOP BY EQUIPMENT CATEGORY (Preserved & Modernized)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
              Full Hardware Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292F36] mt-1">
              Shop by Equipment Category
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              Authentic enterprise ICT hardware, structured cabling, server enclosures, and CCTV surveillance equipment.
            </p>
          </div>

          <button
            onClick={() => setActiveView('categories')}
            className="text-xs font-bold text-[#B5121B] hover:text-[#8F1018] flex items-center gap-1 transition-colors self-start sm:self-end"
          >
            <span>View All 12 Categories</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Grid (12 Categories) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const publishedCount = products.filter(
              (p) => p.categoryId === cat.id && p.isPublished !== false
            ).length;

            return (
              <div
                key={cat.id}
                onClick={() => navigateToCategory(cat.id)}
                className="group cursor-pointer bg-white rounded-xl border border-gray-200 p-4 hover:border-[#B5121B] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 mb-3 relative">
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.endsWith('/categories/category-fallback.svg')) {
                          target.src = '/categories/category-fallback.svg';
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 right-2 bg-black/75 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-xs">
                      {productsLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : publishedCount > 0 ? (
                        `${publishedCount} ${publishedCount === 1 ? 'Product' : 'Products'}`
                      ) : (
                        'Coming Soon'
                      )}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#292F36] group-hover:text-[#B5121B] transition-colors leading-snug">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#B5121B]">
                  <span>Browse Products</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          PART 2.D — OUR SERVICES (Seven Engineering Disciplines)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B5121B] flex items-center gap-1.5">
              <HardHat className="w-4 h-4" />
              <span>Professional Installation & Contracting</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292F36] mt-1">
              Our Services
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              In addition to ICT equipment supply, ZEZ provides end-to-end engineering, installation, testing, and commissioning services for corporate and infrastructure projects.
            </p>
          </div>

          <button
            onClick={() => setActiveView('services')}
            className="text-xs font-bold text-[#B5121B] hover:text-[#8F1018] flex items-center gap-1 transition-colors self-start sm:self-end"
          >
            <span>Detailed Services Directory</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 7 Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ENGINEERING_SERVICES.map((srv, idx) => (
            <div
              key={srv.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#B5121B] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={srv.imageUrl}
                    alt={srv.name}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.endsWith('/categories/category-fallback.svg')) {
                        target.src = '/categories/category-fallback.svg';
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-2.5 left-3 bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-xs font-bold">
                    0{idx + 1}
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 block">
                      {srv.shortName}
                    </span>
                    <h3 className="font-bold text-base leading-snug">{srv.name}</h3>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {srv.description}
                  </p>

                  <ul className="pt-2 border-t border-gray-100 space-y-1">
                    {srv.deliverables.slice(0, 2).map((item, dIdx) => (
                      <li key={dIdx} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#B5121B] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveView('rfq')}
                  className="flex-1 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Request Scope Quote</span>
                </button>
                <a
                  href={srv.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Source services reference on zigmatech.shop"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          PART 2.E — FEATURED PRODUCTS (Preserved with Live Supabase Data)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
              In-Demand Hardware
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292F36] mt-1">
              Featured Enterprise Equipment
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              Consignment hardware backed by authentic Philippine distribution warranties and official BIR billing.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-200/80 rounded-lg overflow-x-auto text-xs font-semibold self-start md:self-end">
            <button
              onClick={() => setFeaturedTab('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                featuredTab === 'all' ? 'bg-[#B5121B] text-white shadow-xs' : 'text-gray-700 hover:text-black'
              }`}
            >
              All Hardware
            </button>
            <button
              onClick={() => setFeaturedTab('cabling')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                featuredTab === 'cabling' ? 'bg-[#B5121B] text-white shadow-xs' : 'text-gray-700 hover:text-black'
              }`}
            >
              Cabling
            </button>
            <button
              onClick={() => setFeaturedTab('racks')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                featuredTab === 'racks' ? 'bg-[#B5121B] text-white shadow-xs' : 'text-gray-700 hover:text-black'
              }`}
            >
              Racks
            </button>
            <button
              onClick={() => setFeaturedTab('power')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                featuredTab === 'power' ? 'bg-[#B5121B] text-white shadow-xs' : 'text-gray-700 hover:text-black'
              }`}
            >
              Power
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredFeatured.map((prod) => {
            const displayBrand = getDisplayBrand(prod.brand);
            const salesUnit = getProductSalesUnit(prod);
            const imgMeta = getProductImageMetadata(prod);
            const priceInfo = getProductPriceDisplay(prod);

            return (
              <div
                key={prod.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#B5121B] transition-all flex flex-col justify-between group"
              >
                <div className="p-4">
                  {/* Image Container with Fallback Handling */}
                  <div 
                    onClick={() => navigateToProduct(prod.id)}
                    className="w-full h-44 rounded-lg bg-gray-50 flex items-center justify-center p-3 relative cursor-pointer overflow-hidden border border-gray-100"
                  >
                    <img
                      src={prod.mainImage}
                      alt={prod.name}
                      loading="lazy"
                      onError={handleProductImageError}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Stock Status Badge */}
                    <span className="absolute top-2 left-2 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                      {prod.stockStatus === 'In Stock' ? 'In Stock' : prod.stockStatus || 'Available'}
                    </span>

                    {/* Photo Source Classification */}
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded backdrop-blur-xs">
                      {imgMeta.shortLabel}
                    </span>
                  </div>

                  {/* Brand & SKU */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="font-bold text-[#B5121B]">{displayBrand}</span>
                    <span className="font-mono">{prod.sku}</span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => navigateToProduct(prod.id)}
                    className="font-bold text-sm text-[#292F36] mt-1 line-clamp-2 group-hover:text-[#B5121B] transition-colors cursor-pointer leading-snug"
                    title={prod.name}
                  >
                    {prod.name}
                  </h3>

                  {/* Price / B2B Price on Request */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        {priceInfo.isPriceOnRequest ? 'B2B Procurement' : 'Indicative Price'}
                      </div>
                      <div className={`text-sm sm:text-base font-extrabold ${priceInfo.isPriceOnRequest ? 'text-[#B5121B]' : 'text-[#292F36] font-mono'}`}>
                        {priceInfo.displayPrice}
                      </div>
                    </div>
                    {salesUnit && (
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                        {salesUnit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                  <button
                    onClick={() => addToQuoteCart(prod, 1)}
                    className="flex-1 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Quote</span>
                  </button>

                  <button
                    onClick={() => addToCompare(prod)}
                    className="p-2 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors"
                    title="Compare specifications"
                  >
                    <Scale className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          PART 2.F — CLOSING CALL TO ACTION
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-[#292F36] text-white rounded-2xl p-8 sm:p-14 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#B5121B_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

          <div className="space-y-3 max-w-2xl relative z-10 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
              Integrated Quotation & Turnkey Delivery
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Planning Your Next Technology or Infrastructure Project?
            </h2>
            <p className="text-xs sm:text-base text-gray-300 leading-relaxed">
              Whether you require volume ICT hardware supply, structured cabling deployment, or full MEP and fire protection contracting, our engineering team is ready to assist.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
            <button
              onClick={() => setActiveView('rfq')}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#B5121B] hover:bg-[#8F1018] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Request a Quotation</span>
            </button>
            <button
              onClick={() => setActiveView('contact')}
              className="w-full sm:w-auto px-7 py-3.5 bg-white text-[#292F36] hover:bg-gray-100 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-[#B5121B]" />
              <span>Contact Our Team</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
