import React, { useState } from 'react';
import { 
  FileText, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle, 
  Printer, 
  ArrowRight, 
  Building2, 
  Clock, 
  ShieldCheck, 
  ShoppingBag,
  Sparkles,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RfqCustomerInfo, QuotationRequest, CustomerType, ContactMethod } from '../types';
import { getDisplayBrand, getProductSalesUnit, handleProductImageError, getProductPriceDisplay } from '../utils/productUtils';

export const RfqCheckoutView: React.FC = () => {
  const { 
    quoteCart, 
    updateQuoteQuantity, 
    removeFromQuoteCart, 
    clearQuoteCart, 
    submitRfq, 
    currentCustomer, 
    setActiveView, 
    setActiveRfqForPrint,
    siteSettings
  } = useApp();

  const [formData, setFormData] = useState<RfqCustomerInfo>({
    fullName: currentCustomer?.fullName || '',
    companyName: currentCustomer?.companyName || '',
    email: currentCustomer?.email || '',
    mobileNumber: currentCustomer?.mobileNumber || '',
    deliveryCityProvince: currentCustomer?.deliveryCityProvince || 'Metro Manila',
    deliveryAddress: currentCustomer?.deliveryAddress || '',
    tinNumber: currentCustomer?.tinNumber || '',
    customerType: currentCustomer?.customerType || 'Company',
    preferredContactMethod: currentCustomer?.preferredContactMethod || 'Email',
    targetDeliveryDate: '2026-11-20',
    additionalRequirements: ''
  });

  const [submittedRfq, setSubmittedRfq] = useState<QuotationRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rfqError, setRfqError] = useState<string | null>(null);

  const totalEstimated = quoteCart.reduce(
    (sum, item) => sum + (item.product.pricePhp ? item.product.pricePhp * item.quantity : 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteCart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setRfqError(null);

    try {
      const result = await submitRfq(formData);
      if (result.success && result.rfq) {
        setSubmittedRfq(result.rfq);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setRfqError(result.error || 'Failed to submit quotation request. Please check your connection and try again.');
      }
    } catch (err: any) {
      setRfqError(err.message || 'An unexpected error occurred during quotation submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoData = () => {
    setFormData({
      fullName: 'Arch. Miguel Hernandez',
      companyName: 'Metro Build & Telecommunications Corp.',
      email: 'm.hernandez@metrobuild.ph',
      mobileNumber: '+63 917 889 4210',
      deliveryCityProvince: 'Davao City, Davao del Sur',
      deliveryAddress: 'Unit 402, Enterprise IT Tower, J.P. Laurel Avenue, Bajada, Davao City',
      tinNumber: '109-342-876-000',
      customerType: 'Contractor',
      preferredContactMethod: 'Email',
      targetDeliveryDate: '2026-11-25',
      additionalRequirements: 'Delivery with certified testing reports for Cat6A cables and 3-year local warranty for all Cisco switches.'
    });
  };

  // SUCCESS CONFIRMATION SCREEN
  if (submittedRfq) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-8 animate-fadeIn">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 shadow-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
              Quotation Request Successfully Submitted
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#292F36]">
              Thank You for Inquiring with ZEZ Automation
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
              Your Request for Quotation has been recorded in our enterprise CRM. A dedicated technical sales engineer will prepare your official Pro-Forma Quotation with volume project pricing.
            </p>
          </div>

          {/* Reference Card */}
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 max-w-md mx-auto text-left space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="text-xs text-gray-500">RFQ Reference Number:</span>
              <span className="font-mono font-black text-sm text-[#B5121B]">{submittedRfq.id}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Company Name:</span>
              <span className="font-bold text-gray-800">{submittedRfq.customer.companyName || 'Private Account'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Attention:</span>
              <span className="font-semibold text-gray-800">{submittedRfq.customer.fullName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Equipment Requested:</span>
              <span className="font-semibold text-gray-800">{submittedRfq.items.length} Product Models</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Estimated Total (Sample SRP):</span>
              <span className="font-mono font-bold text-gray-900">
                ₱{submittedRfq.totalEstimatedPhp?.toLocaleString() || 'Project Pricing'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
              <span className="text-gray-500">Status:</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                {submittedRfq.status}
              </span>
            </div>
          </div>

          {submittedRfq.isDemo && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-800 text-left max-w-md mx-auto flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Demonstration Notice:</span>
                <p className="mt-0.5 text-[11px] text-amber-700">
                  This transaction was simulated in Local Demonstration Mode. Supabase environment variables are not active, so this quotation was recorded locally and not dispatched to remote production servers.
                </p>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setActiveRfqForPrint(submittedRfq)}
              className="px-6 py-3 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Pro-Forma Quotation Slip</span>
            </button>

            <button
              onClick={() => setActiveView('account')}
              className="px-6 py-3 bg-[#292F36] hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Track RFQ Status in Account Portal</span>
            </button>
          </div>

          <div className="pt-4 text-xs text-gray-500">
            For urgent procurement expediting, call our sales hotline at <strong>{siteSettings.phonePrimary}</strong> quoting reference <strong>{submittedRfq.id}</strong>.
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART STATE
  if (quoteCart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-[#B5121B] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#292F36]">Your Quotation Cart is Empty</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Please add equipment from our catalog before proceeding to the Request for Quotation checkout.
        </p>
        <button
          onClick={() => setActiveView('shop')}
          className="px-6 py-3 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg transition-colors"
        >
          Browse Equipment Catalog
        </button>
      </div>
    );
  }

  // RFQ CHECKOUT PAGE
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="text-xs font-semibold text-[#B5121B] uppercase tracking-wider">
            Commercial Procurement
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F36] mt-0.5">
            Request for Quotation (RFQ) Checkout
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review your equipment line items and provide corporate recipient details for formal pro-forma pricing.
          </p>
        </div>

        <button
          onClick={fillDemoData}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg self-start sm:self-auto flex items-center gap-1.5 transition-colors"
          title="Conveniently autofill Philippine B2B contractor test data"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#B5121B]" />
          <span>Autofill Sample Company Info</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Customer Information Form */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Building2 className="w-5 h-5 text-[#B5121B]" />
            <h2 className="font-bold text-base text-[#292F36]">Client & Company Details</h2>
          </div>

          <form onSubmit={handleSubmit} id="rfq-form" className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Full Name of Contact Person *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Engr. Juan Dela Cruz"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Company / Organization Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Acme Tech Solutions Inc."
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Corporate Email Address *
                </label>
                <input
                  required
                  type="email"
                  placeholder="name@company.ph"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Mobile / Viber Number *
                </label>
                <input
                  required
                  type="tel"
                  placeholder="+63 9XX XXX XXXX"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Customer Type *
                </label>
                <select
                  value={formData.customerType}
                  onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
                  className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white font-medium"
                >
                  <option value="Company">Enterprise / Corporation</option>
                  <option value="Contractor">Engineering Contractor / SI</option>
                  <option value="Government">Government / LGU</option>
                  <option value="School/University">School / University</option>
                  <option value="Hospital/Clinic">Healthcare / Hospital</option>
                  <option value="Individual">Individual Business</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Preferred Contact *
                </label>
                <select
                  value={formData.preferredContactMethod}
                  onChange={(e) => setFormData({ ...formData, preferredContactMethod: e.target.value as ContactMethod })}
                  className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white font-medium"
                >
                  <option value="Email">Email</option>
                  <option value="Mobile / Phone">Mobile Phone</option>
                  <option value="Viber">Viber</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Company TIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="000-000-000-000"
                  value={formData.tinNumber}
                  onChange={(e) => setFormData({ ...formData, tinNumber: e.target.value })}
                  className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Delivery City / Province *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Davao City / Zamboanga / Cebu / Metro Manila"
                  value={formData.deliveryCityProvince}
                  onChange={(e) => setFormData({ ...formData, deliveryCityProvince: e.target.value })}
                  className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Target Project Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.targetDeliveryDate}
                  onChange={(e) => setFormData({ ...formData, targetDeliveryDate: e.target.value })}
                  className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Project Scope / Specific Technical Requirements (Optional)
              </label>
              <textarea
                rows={4}
                placeholder="Include specifications, cable reel lengths, patch cord lengths, warranty requests, or request for installation support..."
                value={formData.additionalRequirements}
                onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
                className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
              />
            </div>
          </form>
        </div>

        {/* Right: Quotation Cart Summary */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6 sticky top-28">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#B5121B]" />
              <h2 className="font-bold text-base text-[#292F36]">Itemized Equipment Review</h2>
            </div>
            <span className="text-xs text-gray-500 font-mono">
              ({quoteCart.length} {quoteCart.length === 1 ? 'model' : 'models'})
            </span>
          </div>

          {/* List of cart items */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {quoteCart.map((item) => (
              <div
                key={item.product.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex gap-3 text-xs"
              >
                <img
                  src={item.product.mainImage}
                  alt={item.product.name}
                  onError={handleProductImageError}
                  className="w-14 h-14 object-cover rounded bg-white border border-gray-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="text-[10px] font-bold text-[#B5121B] uppercase">
                        {getDisplayBrand(item.product.brand)}
                      </span>
                      <h4 className="font-bold text-gray-900 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-mono">SKU: {item.product.sku}</p>
                    </div>
                    <button
                      onClick={() => removeFromQuoteCart(item.product.id)}
                      className="text-gray-400 hover:text-red-600 p-0.5"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                    {/* Quantity Modifier */}
                    <div className="flex items-center border border-gray-300 rounded bg-white">
                      <button
                        onClick={() => updateQuoteQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-gray-600 hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="px-2 py-0.5 font-bold min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuoteQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-gray-600 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      {(() => {
                        const priceInfo = getProductPriceDisplay(item.product);
                        if (priceInfo.isPriceOnRequest || !priceInfo.numericPrice) {
                          return (
                            <div>
                              <span className="font-bold text-[#B5121B] text-xs block">
                                Price on Request
                              </span>
                              <span className="text-[10px] text-gray-400">
                                B2B Volume Quote
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div>
                            <span className="font-bold text-gray-900 block font-mono">
                              ₱{(priceInfo.numericPrice * item.quantity).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              ₱{priceInfo.numericPrice.toLocaleString()}{getProductSalesUnit(item.product) ? ` / ${getProductSalesUnit(item.product)}` : ''}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="space-y-2 pt-2 border-t border-gray-200 text-xs">
            {quoteCart.every(item => getProductPriceDisplay(item.product).isPriceOnRequest) ? (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <div className="flex justify-between items-center text-gray-700 font-semibold">
                  <span>Pricing Structure:</span>
                  <span className="text-[#B5121B] font-bold">Price on Request (B2B)</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Custom project bill-of-materials pricing, volume discounts, and payment terms will be computed by our sales engineering team in your official quotation slip.
                </p>
                <div className="pt-2 flex justify-between text-gray-500 text-[11px]">
                  <span>Immediate Payment:</span>
                  <span className="font-semibold text-emerald-700">₱0.00 (No Payment Required Now)</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Estimated Sample Subtotal:</span>
                  <span className="font-mono">₱{totalEstimated.toLocaleString()} PHP</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Payment Requirement:</span>
                  <span className="font-semibold text-emerald-700">₱0.00 (No Payment Required Now)</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-extrabold text-[#292F36]">
                  <span>Estimated Indicative Total:</span>
                  <span className="text-base text-[#B5121B] font-mono">₱{totalEstimated.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          {/* Submission Error Banner */}
          {rfqError && (
            <div className="p-3 bg-red-50 text-[#8F1018] rounded-lg border border-red-200 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-[#B5121B] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Quotation Submission Error</p>
                <p className="text-[11px] mt-0.5">{rfqError}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            form="rfq-form"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-[#B5121B] hover:bg-[#8F1018] text-white text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Generating Quotation Request...</span>
            ) : (
              <>
                <span>Submit Request for Quotation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="p-3 bg-red-50/50 rounded-lg border border-red-100 text-[11px] text-gray-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#8F1018]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ZEZ Corporate SLA Guarantee</span>
            </div>
            <p>
              Your RFQ reference number will be generated immediately. Formal quotations with official BIR breakdown will be dispatched to your email within 24 business hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
