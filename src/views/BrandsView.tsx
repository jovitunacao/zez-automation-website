import React from 'react';
import { ArrowRight, Globe, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BrandsView: React.FC = () => {
  const { brands, products, navigateToBrand, setActiveView } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
          Ecosystem Partners
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F36] mt-0.5">
          Supported Technology Brands & Manufacturers
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
          ZEZ Automation Corporation sources and distributes enterprise hardware across leading international network, computing, and security brands.
        </p>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {brands.map((brand) => {
          const brandItemsCount = products.filter(
            p => p.brand.toLowerCase() === brand.name.toLowerCase() || p.brand.includes(brand.name)
          ).length;

          return (
            <div
              key={brand.id}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs hover:shadow-md hover:border-[#B5121B] transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-[#B5121B] font-black text-sm flex items-center justify-center group-hover:bg-[#B5121B] group-hover:text-white transition-colors">
                    {brand.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {brand.originCountry}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-[#292F36] group-hover:text-[#B5121B] transition-colors">
                    {brand.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-3 leading-relaxed">
                    {brand.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                  {brandItemsCount} Products in Catalog
                </span>

                <button
                  onClick={() => navigateToBrand(brand.name)}
                  className="px-3 py-1.5 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <span>Filter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manufacturer Warranty Notice */}
      <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#B5121B] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-gray-900">Distributor Catalog Notice:</p>
          <p>
            The listed trademarks and manufacturer logos are the property of their respective owners. Products are cataloged for commercial technology sourcing and enterprise quotation purposes in the Philippines.
          </p>
        </div>
      </div>
    </div>
  );
};
