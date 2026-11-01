import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Scale, 
  Download, 
  ShieldCheck, 
  Truck, 
  FileCheck, 
  Check, 
  PhoneCall, 
  Building2, 
  HelpCircle,
  X,
  Share2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProductDetailView: React.FC = () => {
  const { 
    selectedProductId, 
    products, 
    setActiveView, 
    addToQuoteCart, 
    addToCompare, 
    navigateToProduct, 
    siteSettings 
  } = useApp();

  const product = products.find(p => p.id === selectedProductId) || products[0];

  const [selectedImage, setSelectedImage] = useState(product?.mainImage || '');
  const [quantity, setQuantity] = useState(1);
  const [customNote, setCustomNote] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'features' | 'box' | 'warranty'>('overview');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoSubmitted, setInfoSubmitted] = useState(false);
  const [datasheetNotice, setDatasheetNotice] = useState(false);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Product not found</h2>
        <button
          onClick={() => setActiveView('shop')}
          className="px-4 py-2 bg-[#B5121B] text-white rounded text-xs font-bold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  // Related products from the same category
  const relatedProducts = products
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  const handleAddToQuote = () => {
    addToQuoteCart(product, quantity, customNote);
    setCustomNote('');
  };

  const handleDownloadDatasheet = () => {
    setDatasheetNotice(true);
    setTimeout(() => setDatasheetNotice(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-10">
      {/* Breadcrumb & Back button */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <button
          onClick={() => setActiveView('shop')}
          className="inline-flex items-center gap-1.5 text-gray-600 hover:text-[#B5121B] font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span>Home</span>
          <span>/</span>
          <span>{product.categoryName}</span>
          <span>/</span>
          <span className="font-semibold text-gray-800">{product.brand}</span>
          <span>/</span>
          <span className="font-mono text-gray-400">{product.model}</span>
        </div>
      </div>

      {/* Main Top Section: Gallery (Left) & Purchasing / Specs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          {/* Large Main Display */}
          <div className="relative aspect-4/3 bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center shadow-2xs overflow-hidden">
            <img
              src={selectedImage || product.mainImage}
              alt={product.name}
              className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-4 left-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                {product.stockStatus}
              </span>
            </div>
            <button
              onClick={() => addToCompare(product)}
              className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-2xs text-gray-400 hover:text-[#B5121B] border border-gray-200"
              title="Add to spec comparison"
            >
              <Scale className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedImage(product.mainImage)}
              className={`w-20 h-20 rounded-lg border-2 p-1 bg-white shrink-0 overflow-hidden transition-all ${
                selectedImage === product.mainImage ? 'border-[#B5121B]' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img src={product.mainImage} alt={product.name} className="w-full h-full object-contain" />
            </button>
            {product.galleryImages.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(imgUrl)}
                className={`w-20 h-20 rounded-lg border-2 p-1 bg-white shrink-0 overflow-hidden transition-all ${
                  selectedImage === imgUrl ? 'border-[#B5121B]' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img src={imgUrl} alt={`${product.name} alternate view ${idx + 1}`} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>

          {/* Quick Assurance Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-[11px] text-gray-600">
            <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B5121B] shrink-0" />
              <span>Authentic Hardware</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#B5121B] shrink-0" />
              <span>Fast Metro Manila Dispatch</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#B5121B] shrink-0" />
              <span>BIR Tax Invoice</span>
            </div>
          </div>
        </div>

        {/* Right Column: Commercial Details & RFQ Actions */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#B5121B] uppercase tracking-wider text-sm">
                {product.brand}
              </span>
              <span className="font-mono text-gray-500">SKU: {product.sku}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#292F36] leading-snug">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
              <span>Model: <strong className="text-gray-900 font-mono">{product.model}</strong></span>
              <span>·</span>
              <span>Category: <strong>{product.categoryName}</strong></span>
            </div>
          </div>

          {/* Price & Lead Time */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-gray-500 block">Sample Distributor Reference Price:</span>
                <span className="text-2xl sm:text-3xl font-black text-[#292F36]">
                  {product.pricePhp ? `₱${product.pricePhp.toLocaleString()}` : 'For Project Pricing'}
                </span>
                <span className="text-xs text-gray-400 ml-2">PHP (Net of VAT)</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  {product.stockStatus}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 italic">
              * Official volume project discounts, lead-times, and payment terms will be provided in your Pro-Forma Quotation.
            </p>
          </div>

          {/* Key Bullet Highlights */}
          <div className="space-y-1.5 text-xs text-gray-700">
            <span className="font-bold uppercase tracking-wider text-gray-500 text-[10px] block">
              Key Features:
            </span>
            {product.keySpecs.map((s, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#B5121B] shrink-0 mt-0.5" />
                <span>{s}</span>
              </div>
            ))}
          </div>

          {/* Warranty Info */}
          <div className="text-xs text-gray-600 bg-red-50/40 p-3 rounded-lg border border-red-100 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#B5121B] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#8F1018]">Warranty Coverage: </span>
              <span>{product.warranty}</span>
            </div>
          </div>

          {/* Quantity and RFQ Controls */}
          <div className="space-y-4 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-gray-700">Quantity Needed:</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center text-xs font-bold text-gray-900 focus:outline-none"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {product.pricePhp ? `₱${(product.pricePhp * quantity).toLocaleString()} Est.` : ''}
              </span>
            </div>

            {/* Optional Procurement Note */}
            <div>
              <input
                type="text"
                placeholder="Optional procurement note (e.g. need with SFP transceivers, requires 3-year warranty)"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-[#B5121B]"
              />
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToQuote}
                className="py-3 px-4 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Quotation Cart</span>
              </button>

              <button
                onClick={() => setInfoModalOpen(true)}
                className="py-3 px-4 border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-gray-500" />
                <span>Request Specification Sheet</span>
              </button>
            </div>

            {/* Datasheet download button */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                onClick={handleDownloadDatasheet}
                className="text-[#B5121B] hover:underline font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official Datasheet ({product.datasheetFileName || 'PDF'})</span>
              </button>
              <button
                onClick={() => addToCompare(product)}
                className="text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Compare Specs</span>
              </button>
            </div>

            {datasheetNotice && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 animate-fadeIn flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Specification sheet downloaded: {product.datasheetFileName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section: Overview, Technical Specifications, Features, Included Accessories, Warranty */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 px-6 whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#B5121B] text-[#B5121B] bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Product Overview
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3.5 px-6 whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'specs'
                ? 'border-[#B5121B] text-[#B5121B] bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Technical Specifications ({product.specifications.length})
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`py-3.5 px-6 whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'features'
                ? 'border-[#B5121B] text-[#B5121B] bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Features & Capabilities
          </button>
          <button
            onClick={() => setActiveTab('box')}
            className={`py-3.5 px-6 whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'box'
                ? 'border-[#B5121B] text-[#B5121B] bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Included Accessories
          </button>
          <button
            onClick={() => setActiveTab('warranty')}
            className={`py-3.5 px-6 whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'warranty'
                ? 'border-[#B5121B] text-[#B5121B] bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Warranty & Support
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8 text-xs text-gray-700 leading-relaxed">
          {activeTab === 'overview' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-base font-bold text-[#292F36]">Executive Summary</h3>
              <p className="text-sm leading-relaxed text-gray-700">
                {product.fullDescription}
              </p>
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                  <h4 className="font-bold text-gray-900">Recommended Enterprise Use:</h4>
                  <p className="text-gray-600">
                    Suitable for commercial branch offices, IT data closets, enterprise campuses, hotel hospitality systems, and corporate multi-site backbones.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                  <h4 className="font-bold text-gray-900">ZEZ Presales Assistance:</h4>
                  <p className="text-gray-600">
                    Our Pasig City sales engineering team provides complimentary bill-of-materials sizing and compatibility verification prior to quote confirmation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#292F36]">Structured Technical Specifications</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-gray-200">
                  <thead className="bg-[#292F36] text-white">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold w-1/4">Specification Field</th>
                      <th className="py-2.5 px-4 font-semibold w-3/4">Manufacturer Parameter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {product.specifications.map((spec, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2.5 px-4 font-bold text-gray-900">
                          {spec.label}
                          <span className="block text-[10px] text-gray-400 font-normal">{spec.category}</span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-gray-800">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-base font-bold text-[#292F36]">Key Feature Highlights</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.keySpecs.map((feat, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-start gap-3">
                    <div className="w-6 h-6 rounded bg-[#B5121B]/10 text-[#B5121B] flex items-center justify-center shrink-0 font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{feat}</h4>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Engineered to meet stringent commercial performance and compliance standards.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'box' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-base font-bold text-[#292F36]">What's Included in the Package</h3>
              <p className="text-gray-600">
                Official OEM packaging includes all manufacturer components required for deployment:
              </p>
              <ul className="space-y-2">
                {product.includedAccessories.map((acc, idx) => (
                  <li key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 font-semibold text-gray-800">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{acc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-base font-bold text-[#292F36]">Warranty Policy & RMA Support</h3>
              <div className="p-4 bg-red-50/50 rounded-lg border border-red-100 space-y-2">
                <div className="font-bold text-[#8F1018] text-sm">
                  Official Warranty Terms: {product.warranty}
                </div>
                <p className="text-gray-700">
                  All equipment distributed by ZEZ Automation Corporation carries official manufacturer serial registration. In case of hardware anomalies, our warranty desk facilitates repair, parts replacement, or whole-unit swap according to distributor terms.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-gray-900">RMA Depots & Service Hours:</h4>
                <p className="text-gray-600">
                  Main Depot: Ortigas Center, Pasig City · Open Monday to Friday 8:30 AM to 5:30 PM.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#292F36]">
              Related {product.categoryName} Equipment
            </h3>
            <button
              onClick={() => setActiveView('shop')}
              className="text-xs font-bold text-[#B5121B] hover:underline"
            >
              Browse Full Category →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <div
                key={rel.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <img
                    src={rel.mainImage}
                    alt={rel.name}
                    className="w-full h-36 object-contain rounded bg-gray-50 mb-3"
                  />
                  <span className="text-[10px] font-bold text-[#B5121B] uppercase">{rel.brand}</span>
                  <h4
                    onClick={() => navigateToProduct(rel.id)}
                    className="text-xs font-bold text-[#292F36] hover:text-[#B5121B] cursor-pointer line-clamp-2 leading-tight"
                  >
                    {rel.name}
                  </h4>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-900">
                    {rel.pricePhp ? `₱${rel.pricePhp.toLocaleString()}` : 'For Project Pricing'}
                  </span>
                  <button
                    onClick={() => addToQuoteCart(rel, 1)}
                    className="p-1.5 bg-[#B5121B] text-white rounded hover:bg-[#8F1018]"
                    title="Add to quote"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Information Modal */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="font-bold text-base text-[#292F36]">Inquire About This Equipment</h3>
              <button onClick={() => setInfoModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {infoSubmitted ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-900">Inquiry Received</h4>
                <p className="text-xs text-gray-500">
                  Our enterprise product specialist will email you the full technical datasheet and project pricing within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setInfoModalOpen(false);
                    setInfoSubmitted(false);
                  }}
                  className="px-4 py-2 bg-[#B5121B] text-white text-xs font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setInfoSubmitted(true);
                }}
                className="space-y-3 text-xs"
              >
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="font-bold text-gray-900">{product.name}</div>
                  <div className="font-mono text-gray-500 text-[11px]">Model: {product.model} · SKU: {product.sku}</div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Your Full Name</label>
                  <input required type="text" placeholder="e.g. Juan dela Cruz" className="w-full p-2 border border-gray-300 rounded" />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Company / Institution</label>
                  <input required type="text" placeholder="e.g. Acme Corporation" className="w-full p-2 border border-gray-300 rounded" />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Corporate Email</label>
                  <input required type="email" placeholder="name@company.ph" className="w-full p-2 border border-gray-300 rounded" />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Mobile / Phone</label>
                  <input required type="tel" placeholder="+63 9XX XXX XXXX" className="w-full p-2 border border-gray-300 rounded" />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Specific Questions or Requirements</label>
                  <textarea rows={3} placeholder="Tell us about your project or questions..." className="w-full p-2 border border-gray-300 rounded" />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setInfoModalOpen(false)}
                    className="px-3 py-2 border border-gray-300 rounded text-gray-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#B5121B] text-white font-bold rounded"
                  >
                    Send Inquiries
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
