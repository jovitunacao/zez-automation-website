import React, { useState } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Cpu, 
  Headphones, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  FileText, 
  ExternalLink,
  Layers,
  Scale,
  ShoppingCart,
  Clock,
  Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { getDisplayBrand, getProductSalesUnit, getProductImageMetadata } from '../utils/productUtils';

export const HomeView: React.FC = () => {
  const { 
    categories, 
    brands, 
    products, 
    setActiveView, 
    navigateToProduct, 
    navigateToCategory, 
    navigateToBrand,
    addToQuoteCart,
    addToCompare
  } = useApp();

  const [featuredTab, setFeaturedTab] = useState<string>('all');

  const featuredCandidateList = products.filter(p => p.isFeatured).length > 0
    ? products.filter(p => p.isFeatured)
    : products;

  const filteredFeatured = featuredCandidateList
    .filter((p) => {
      if (featuredTab === 'all') return true;
      if (featuredTab === 'cabling') return p.categoryId === 'structured-cabling';
      if (featuredTab === 'racks') return p.categoryId === 'racks-cabinets';
      if (featuredTab === 'power') return p.categoryId === 'ups-power-solutions';
      return true;
    })
    .slice(0, 8);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative bg-[#292F36] text-white overflow-hidden">
        {/* Subtle geometric background accents */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#B5121B_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#B5121B]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 text-gray-200 text-xs font-semibold backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-[#B5121B]" />
                <span>Premier Philippine B2B ICT Equipment Distributor</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white">
                Powering Business Through <span className="text-[#B5121B]">Technology.</span>
              </h1>

              <p className="text-base sm:text-lg text-gray-300 font-normal leading-relaxed max-w-2xl">
                Your Trusted Partner for ICT Equipment, Networking Infrastructure, Security Systems, and Enterprise Technology Solutions across the Philippines.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => setActiveView('shop')}
                  className="px-6 py-3.5 bg-[#B5121B] hover:bg-[#8F1018] text-white text-sm font-bold rounded-lg shadow-lg hover:shadow-red-900/30 transition-all flex items-center gap-2 group active:scale-95"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => setActiveView('rfq')}
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-lg backdrop-blur-xs border border-white/20 transition-all flex items-center gap-2 active:scale-95"
                >
                  <FileText className="w-4 h-4 text-[#B5121B]" />
                  <span>Request a Quotation</span>
                </button>
              </div>

              {/* Key Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-700/80 text-xs text-gray-300">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">100%</div>
                  <div className="text-gray-400 mt-0.5">Genuine Enterprise Sourcing</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">24 - 48h</div>
                  <div className="text-gray-400 mt-0.5">Metro Manila Lead Time</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">12+</div>
                  <div className="text-gray-400 mt-0.5">Core Equipment Categories</div>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-gray-700 shadow-2xl bg-gray-900">
                <img
                  src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80"
                  alt="Enterprise Data Center Servers and Switches"
                  className="w-full h-80 sm:h-96 object-cover opacity-85 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#292F36] via-transparent to-transparent" />

                {/* Overlaid Spec Badge */}
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/95 backdrop-blur-md rounded-xl text-[#292F36] shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B5121B]">
                        Ready for Corporate Procurement
                      </span>
                      <p className="text-xs font-bold text-gray-900 mt-0.5">
                        Enterprise Switches, Racks & CCTV Systems
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveView('shop')}
                      className="px-3 py-1.5 bg-[#292F36] text-white hover:bg-[#B5121B] rounded text-xs font-bold transition-colors"
                    >
                      View Catalog
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
              Full Hardware Catalog
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292F36] mt-1">
              Shop by Equipment Category
            </h2>
          </div>
          <button
            onClick={() => setActiveView('categories')}
            className="text-xs font-bold text-[#B5121B] hover:text-[#8F1018] flex items-center gap-1 transition-colors"
          >
            <span>View All 12 Categories</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Grid (12 Categories) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-xs">
                    {cat.itemCount}+ Items
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
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
              In-Demand Hardware
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292F36] mt-1">
              Featured Enterprise Equipment
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-200/80 rounded-lg overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setFeaturedTab('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                featuredTab === 'all'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Catalog ({products.length})
            </button>
            <button
              onClick={() => setFeaturedTab('cabling')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                featuredTab === 'cabling'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Structured Cabling
            </button>
            <button
              onClick={() => setFeaturedTab('racks')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                featuredTab === 'racks'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Racks & Cabinets
            </button>
            <button
              onClick={() => setFeaturedTab('power')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                featuredTab === 'power'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              UPS & Power
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredFeatured.map((product) => {
            const imgMeta = getProductImageMetadata(product);
            const salesUnit = getProductSalesUnit(product);
            const displayBrand = getDisplayBrand(product.brand);
            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Product Visual */}
                <div className="relative p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-center h-48">
                  <img
                    src={product.mainImage}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Stock indicator badge & Image status */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                      {product.stockStatus}
                    </span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border shadow-2xs ${imgMeta.badgeColor}`}>
                      {imgMeta.shortLabel}
                    </span>
                  </div>

                  {/* Compare action button */}
                  <button
                    onClick={() => addToCompare(product)}
                    className="absolute top-3 right-3 p-1.5 bg-white rounded-md shadow-xs text-gray-400 hover:text-[#B5121B] border border-gray-200"
                    title="Compare specs"
                  >
                    <Scale className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Product Information */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#5E646D]">
                      <span className="font-bold text-[#B5121B] uppercase tracking-wide">
                        {displayBrand}
                      </span>
                      <span className="font-mono">{product.sku}</span>
                    </div>

                    <h3
                      onClick={() => navigateToProduct(product.id)}
                      className="font-bold text-sm text-[#292F36] hover:text-[#B5121B] cursor-pointer line-clamp-2 leading-tight transition-colors"
                    >
                      {product.name}
                    </h3>

                    <p className="text-xs text-gray-500 line-clamp-2 pt-0.5">
                      {product.shortDescription}
                    </p>
                  </div>

                  {/* Key Specs Pills */}
                  <div className="py-2 border-y border-gray-100 text-[11px] text-gray-600 space-y-1">
                    {product.keySpecs.slice(0, 2).map((spec, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B5121B] shrink-0" />
                        <span className="truncate">{spec}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price & Actions */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                          SRP Reference
                        </div>
                        <div className="text-base font-extrabold text-[#292F36]">
                          {product.pricePhp ? (
                            <>
                              ₱{product.pricePhp.toLocaleString()}
                              {salesUnit && <span className="text-xs font-normal text-gray-500 ml-1">/ {salesUnit}</span>}
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">Contact for Quote</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 italic">Net of VAT</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => navigateToProduct(product.id)}
                        className="w-full py-2 px-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                      <button
                        onClick={() => addToQuoteCart(product, 1)}
                        className="w-full py-2 px-2 text-xs font-bold text-white bg-[#B5121B] hover:bg-[#8F1018] rounded-lg flex items-center justify-center gap-1 transition-colors shadow-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Quote</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => setActiveView('shop')}
            className="px-6 py-3 bg-[#292F36] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <span>Explore All {products.length} Products</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Corporate Procurement Section */}
      <section className="bg-gradient-to-br from-gray-900 to-[#292F36] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B5121B] bg-red-950/60 px-2.5 py-1 rounded border border-red-900/60 inline-block mb-3">
              Corporate & Government B2B Sourcing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Technology Procurement Made Simple.
            </h2>
            <p className="text-sm sm:text-base text-gray-300 mt-3 leading-relaxed">
              We streamline ICT equipment acquisition for enterprises, engineering contractors, call centers, hotels, schools, and government agencies across the Philippines. Submit your Bill of Materials (BOM) or project requirements directly to our dedicated B2B sales desk.
            </p>
          </div>

          {/* 4 Steps to Procurement */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="p-5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#B5121B] text-white flex items-center justify-center font-black text-sm">
                01
              </div>
              <h4 className="font-bold text-base text-white">Assemble Quotation Cart</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Add equipment with required quantities directly from our online catalog or paste your custom item list.
              </p>
            </div>

            <div className="p-5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#B5121B] text-white flex items-center justify-center font-black text-sm">
                02
              </div>
              <h4 className="font-bold text-base text-white">Submit Corporate RFQ</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Provide your company name, TIN, delivery site, and project timeline without any upfront payment.
              </p>
            </div>

            <div className="p-5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#B5121B] text-white flex items-center justify-center font-black text-sm">
                03
              </div>
              <h4 className="font-bold text-base text-white">Receive Signed Pro-Forma</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Our sales engineers send an official itemized quotation with project volume discounts and confirmed lead times.
              </p>
            </div>

            <div className="p-5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#B5121B] text-white flex items-center justify-center font-black text-sm">
                04
              </div>
              <h4 className="font-bold text-base text-white">PO Approval & Delivery</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Release your Corporate PO. We dispatch via Metro Manila freight or trusted nationwide shipping partners.
              </p>
            </div>
          </div>

          <div className="mt-10 p-6 bg-white/5 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-base font-bold text-white">Have a custom RFP or Tender document?</h4>
              <p className="text-xs text-gray-400">
                You can submit your specs directly or speak with our procurement engineers right away.
              </p>
            </div>
            <button
              onClick={() => setActiveView('rfq')}
              className="px-6 py-3 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg transition-colors shrink-0 shadow-lg"
            >
              Open Request for Quotation Form
            </button>
          </div>
        </div>
      </section>

      {/* Featured Supported Brands Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
            Ecosystem Partners & Manufacturers
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292F36] mt-1">
            Industry-Standard Technology Brands
          </h2>
          <p className="text-xs text-gray-500 mt-2">
            Example catalog brands supplied for corporate and enterprise projects. All manufacturer warranties apply.
          </p>
        </div>

        {/* Brands Logo Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => navigateToBrand(b.name)}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-[#B5121B] hover:shadow-xs transition-all flex flex-col items-center justify-center text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#B5121B] flex items-center justify-center font-bold text-xs group-hover:bg-[#B5121B] group-hover:text-white transition-colors mb-2">
                {b.name.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-[#292F36] group-hover:text-[#B5121B]">
                {b.name}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">
                {b.originCountry}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Why Choose ZEZ - 4 Benefit Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
            The ZEZ Advantage
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292F36] mt-1">
            Why Enterprise Clients Choose ZEZ Automation
          </h2>
          <p className="text-xs text-gray-500 mt-2">
            Delivering consistency, accountability, and technical expertise to Philippine businesses since establishment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3 hover:border-gray-300 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-[#B5121B] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#292F36]">Reliable Technology Sourcing</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              We maintain direct supplier channels to ensure 100% factory-sealed, authentic equipment with verified serials and comprehensive manufacturer warranties.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3 hover:border-gray-300 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-[#B5121B] flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#292F36]">Competitive Business Pricing</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Wholesale tier pricing, volume discounts for bulk rollouts, and project-based registration support to maximize your IT budget ROI.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3 hover:border-gray-300 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-[#B5121B] flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#292F36]">Technical Product Expertise</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Our pre-sales engineers evaluate network topologies, camera lux ratings, PoE load budgets, and server sizing before you procure.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3 hover:border-gray-300 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-[#B5121B] flex items-center justify-center">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#292F36]">Dedicated Corporate Assistance</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              A dedicated enterprise account executive is assigned to your organization for warranty RMA, billing, delivery updates, and re-orders.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-[#B5121B] text-white rounded-2xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black">
              Ready to Upgrade Your Organization's Infrastructure?
            </h2>
            <p className="text-sm text-red-100 max-w-xl">
              Connect with our ICT equipment specialists in Pasig City. Submit your request for quotation online or schedule a corporate consultation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveView('rfq')}
              className="px-6 py-3.5 bg-white text-[#B5121B] hover:bg-gray-100 text-xs font-bold rounded-lg transition-all shadow-md active:scale-95"
            >
              Start Quotation Request
            </button>
            <button
              onClick={() => setActiveView('contact')}
              className="px-6 py-3.5 bg-black/20 hover:bg-black/30 text-white text-xs font-bold rounded-lg transition-all border border-white/20 active:scale-95"
            >
              Contact Sales Desk
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
