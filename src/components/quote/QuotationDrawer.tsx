import React from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  FileText, 
  ShoppingBag,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDisplayBrand, getProductSalesUnit, handleProductImageError } from '../../utils/productUtils';

export const QuotationDrawer: React.FC = () => {
  const { 
    isQuoteDrawerOpen, 
    setIsQuoteDrawerOpen, 
    quoteCart, 
    updateQuoteQuantity, 
    removeFromQuoteCart, 
    clearQuoteCart, 
    setActiveView 
  } = useApp();

  if (!isQuoteDrawerOpen) return null;

  const totalEstimated = quoteCart.reduce(
    (sum, item) => sum + (item.product.pricePhp ? item.product.pricePhp * item.quantity : 0),
    0
  );

  const totalItemCount = quoteCart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProceedToRfq = () => {
    setIsQuoteDrawerOpen(false);
    setActiveView('rfq');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsQuoteDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#292F36] text-white flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-[#B5121B]" />
              <div>
                <h3 className="font-bold text-base leading-tight">Quotation Cart</h3>
                <p className="text-xs text-gray-400">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} for RFQ Submission
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsQuoteDrawerOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {quoteCart.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-red-50 text-[#B5121B] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-[#292F36]">Your quotation cart is empty</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Browse our ICT equipment catalog and click <strong>"Add to Quote"</strong> to assemble your business procurement request.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsQuoteDrawerOpen(false);
                      setActiveView('shop');
                    }}
                    className="px-4 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Browse Equipment Catalog
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs pb-1 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Selected Equipment</span>
                  <button
                    onClick={clearQuoteCart}
                    className="text-red-600 hover:text-red-700 font-semibold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-3">
                  {quoteCart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs hover:border-gray-300 transition-all flex gap-3"
                    >
                      <img
                        src={item.product.mainImage}
                        alt={item.product.name}
                        onError={handleProductImageError}
                        className="w-16 h-16 object-contain bg-white rounded border border-gray-100 shrink-0 p-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="text-[10px] font-bold text-[#B5121B] uppercase">
                              {getDisplayBrand(item.product.brand)}
                            </span>
                            <h5 className="text-xs font-bold text-[#292F36] line-clamp-2 leading-tight">
                              {item.product.name}
                            </h5>
                          </div>
                          <button
                            onClick={() => removeFromQuoteCart(item.product.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Remove from quote"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          SKU: {item.product.sku}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                          {/* Quantity control */}
                          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                            <button
                              onClick={() => updateQuoteQuantity(item.product.id, item.quantity - 1)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                              title="Decrease"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 py-0.5 text-xs font-bold text-gray-800 min-w-[24px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuoteQuantity(item.product.id, item.quantity + 1)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                              title="Increase"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Line price */}
                          <div className="text-right">
                            {item.product.pricePhp ? (
                              <div>
                                <span className="text-xs font-extrabold text-[#292F36]">
                                  ₱{(item.product.pricePhp * item.quantity).toLocaleString()}
                                </span>
                                <div className="text-[10px] text-gray-400">
                                  @ ₱{item.product.pricePhp.toLocaleString()}/{getProductSalesUnit(item.product)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-gray-600">
                                Call for Quote
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Procurement Info Banner */}
                <div className="p-3 bg-red-50/60 rounded-lg border border-red-100 text-[11px] text-[#8F1018] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>B2B Corporate Quotation Process</span>
                  </div>
                  <p className="text-gray-600 leading-snug">
                    Submission does not require online payment. Our corporate account managers will review your quantities and provide an official signed Pro-Forma Quotation with project pricing and delivery lead-time.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer with Checkout Actions */}
          {quoteCart.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Estimated Total (Sample SRP):</span>
                  <span className="font-mono">
                    ₱{totalEstimated.toLocaleString()} PHP
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-extrabold text-[#292F36]">
                  <span>Estimated Subtotal:</span>
                  <span className="text-base text-[#B5121B]">
                    ₱{totalEstimated.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 italic">
                  * Prices subject to corporate discounts, project registration, and VAT breakdown.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  onClick={handleProceedToRfq}
                  className="w-full py-3 px-4 bg-[#B5121B] hover:bg-[#8F1018] text-white text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <span>Proceed to RFQ Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsQuoteDrawerOpen(false)}
                  className="w-full py-2 px-3 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors text-center"
                >
                  Continue Browsing Catalog
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
