import React from 'react';
import { X, Trash2, ShoppingCart, Plus, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDisplayBrand, getProductSalesUnit, handleProductImageError } from '../../utils/productUtils';

export const ProductCompareModal: React.FC = () => {
  const { 
    compareList, 
    removeFromCompare, 
    clearCompare, 
    isCompareModalOpen, 
    setIsCompareModalOpen, 
    addToQuoteCart,
    navigateToProduct
  } = useApp();

  if (!isCompareModalOpen || compareList.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-4 sm:p-6 no-print">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#292F36] text-white flex items-center justify-between border-b border-gray-800">
          <div>
            <h3 className="font-bold text-base">Equipment Specification Comparison</h3>
            <p className="text-xs text-gray-400">
              Comparing {compareList.length} products side-by-side
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearCompare}
              className="text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              Clear Comparison
            </button>
            <button
              onClick={() => setIsCompareModalOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="min-w-[640px]">
            {/* Products Row */}
            <div className={`grid gap-4 pb-6 border-b border-gray-200 grid-cols-${compareList.length}`}>
              {compareList.map((prod) => {
                const salesUnit = getProductSalesUnit(prod);
                return (
                  <div key={prod.id} className="space-y-3 relative flex flex-col justify-between">
                    <button
                      onClick={() => removeFromCompare(prod.id)}
                      className="absolute top-0 right-0 p-1 text-gray-400 hover:text-red-600 bg-white/80 rounded"
                      title="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="space-y-2">
                      <img
                        src={prod.mainImage}
                        alt={prod.name}
                        onError={handleProductImageError}
                        className="w-full h-36 object-contain rounded-lg border border-gray-100 bg-gray-50"
                      />
                      <span className="text-[11px] font-bold text-[#B5121B] uppercase tracking-wide">
                        {getDisplayBrand(prod.brand)}
                      </span>
                      <h4 
                        onClick={() => {
                          setIsCompareModalOpen(false);
                          navigateToProduct(prod.id);
                        }}
                        className="text-xs font-bold text-gray-900 hover:text-[#B5121B] cursor-pointer line-clamp-2"
                      >
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-mono">Model: {prod.model}</p>
                      <div className="text-sm font-extrabold text-[#292F36]">
                        {prod.pricePhp ? (
                          <>
                            ₱{prod.pricePhp.toLocaleString()}
                            {salesUnit && <span className="text-xs font-normal text-gray-500 ml-1">/ {salesUnit}</span>}
                          </>
                        ) : (
                          'For Project Pricing'
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => addToQuoteCart(prod, 1)}
                      className="w-full mt-2 py-2 px-3 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Quote</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Spec Sections */}
            <div className="divide-y divide-gray-100 text-xs">
              {/* Category */}
              <div className="py-3">
                <span className="font-bold text-gray-500 uppercase tracking-wider block text-[10px] mb-2">
                  Category
                </span>
                <div className={`grid gap-4 grid-cols-${compareList.length}`}>
                  {compareList.map((p) => (
                    <div key={p.id} className="text-gray-800 font-medium">
                      {p.categoryName}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock Status */}
              <div className="py-3">
                <span className="font-bold text-gray-500 uppercase tracking-wider block text-[10px] mb-2">
                  Stock Status
                </span>
                <div className={`grid gap-4 grid-cols-${compareList.length}`}>
                  {compareList.map((p) => (
                    <div key={p.id} className="font-semibold text-emerald-700">
                      {p.stockStatus}
                    </div>
                  ))}
                </div>
              </div>

              {/* Warranty */}
              <div className="py-3">
                <span className="font-bold text-gray-500 uppercase tracking-wider block text-[10px] mb-2">
                  Warranty Coverage
                </span>
                <div className={`grid gap-4 grid-cols-${compareList.length}`}>
                  {compareList.map((p) => (
                    <div key={p.id} className="text-gray-700">
                      {p.warranty}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Features */}
              <div className="py-3">
                <span className="font-bold text-gray-500 uppercase tracking-wider block text-[10px] mb-2">
                  Key Specifications
                </span>
                <div className={`grid gap-4 grid-cols-${compareList.length}`}>
                  {compareList.map((p) => (
                    <ul key={p.id} className="space-y-1 text-gray-600">
                      {p.keySpecs.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#B5121B] shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
          <button
            onClick={() => setIsCompareModalOpen(false)}
            className="px-4 py-2 border border-gray-300 text-xs font-bold rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
