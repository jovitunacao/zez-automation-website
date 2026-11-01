import React from 'react';
import { ChevronRight, Layers, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CategoriesView: React.FC = () => {
  const { categories, products, navigateToCategory, setActiveView } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
          Infrastructure Directory
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F36] mt-0.5">
          ICT Equipment & Supplies Categories
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
          Explore all 12 enterprise technology categories distributed by ZEZ Automation Corporation for Philippine businesses and data centers.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const categoryProducts = products.filter(p => p.categoryId === cat.id);
          return (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#B5121B] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-300 block">
                      Hardware Category
                    </span>
                    <h3 className="font-bold text-base leading-tight">{cat.name}</h3>
                  </div>
                  <span className="absolute top-3 right-3 bg-white/90 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                    {categoryProducts.length} Demo Items
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {cat.description}
                  </p>

                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Included Subcategories:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subcategories.map((sub, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => navigateToCategory(cat.id)}
                  className="w-full py-2 bg-white hover:bg-[#B5121B] text-gray-800 hover:text-white border border-gray-200 hover:border-[#B5121B] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>Filter Catalog by {cat.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
