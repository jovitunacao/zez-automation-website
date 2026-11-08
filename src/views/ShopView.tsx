import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  X, 
  Search, 
  Grid, 
  List, 
  RotateCcw, 
  ShoppingCart, 
  Eye, 
  Scale, 
  Check, 
  ChevronDown,
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
  Package
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { getDisplayBrand, getProductSalesUnit, getProductImageMetadata, handleProductImageError, getProductPriceDisplay } from '../utils/productUtils';

export const ShopView: React.FC = () => {
  const { 
    products, 
    categories, 
    brands, 
    productsLoading,
    productsError,
    refreshProducts,
    filters, 
    setFilters, 
    resetFilters, 
    navigateToProduct, 
    addToQuoteCart, 
    addToCompare 
  } = useApp();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(48);

  // Filter products based on active filters (only published items visible to customers)
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Hide archived / unpublished products from public catalog
      if (product.isPublished === false) {
        return false;
      }

      // Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const displayBrand = getDisplayBrand(product.brand).toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesBrand = displayBrand.includes(query) || product.brand.toLowerCase().includes(query);
        const matchesModel = product.model.toLowerCase().includes(query);
        const matchesSku = product.sku.toLowerCase().includes(query);
        const matchesCategory = product.categoryName.toLowerCase().includes(query);
        const matchesSpecs = product.keySpecs.some(s => s.toLowerCase().includes(query));

        if (!matchesName && !matchesBrand && !matchesModel && !matchesSku && !matchesCategory && !matchesSpecs) {
          return false;
        }
      }

      // Categories
      if (filters.selectedCategories.length > 0) {
        if (!filters.selectedCategories.includes(product.categoryId)) {
          return false;
        }
      }

      // Brands
      if (filters.selectedBrands.length > 0) {
        const matchesBrand = filters.selectedBrands.some(selected => {
          if (selected === 'Unspecified') {
            return !product.brand || product.brand.toLowerCase() === 'manufacturer to verify' || product.brand.toLowerCase() === 'unspecified';
          }
          return product.brand.toLowerCase() === selected.toLowerCase() || getDisplayBrand(product.brand).toLowerCase() === selected.toLowerCase();
        });
        if (!matchesBrand) {
          return false;
        }
      }

      // Stock status
      if (filters.stockFilter.length > 0) {
        if (!filters.stockFilter.includes(product.stockStatus)) {
          return false;
        }
      }

      // Price range
      if (product.pricePhp) {
        if (product.pricePhp < filters.priceRange[0] || product.pricePhp > filters.priceRange[1]) {
          return false;
        }
      }

      return true;
    });
  }, [products, filters]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (filters.sortBy) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'price-asc':
        return list.sort((a, b) => (a.pricePhp || 0) - (b.pricePhp || 0));
      case 'price-desc':
        return list.sort((a, b) => (b.pricePhp || 0) - (a.pricePhp || 0));
      case 'newest':
        return list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
      case 'featured':
      default:
        return list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
  }, [filteredProducts, filters.sortBy]);

  // Paginated / Slice view
  const visibleProducts = sortedProducts.slice(0, displayCount);

  // Toggle category
  const toggleCategory = (catId: string) => {
    setFilters(prev => {
      const exists = prev.selectedCategories.includes(catId);
      return {
        ...prev,
        selectedCategories: exists
          ? prev.selectedCategories.filter(c => c !== catId)
          : [...prev.selectedCategories, catId]
      };
    });
  };

  // Toggle brand
  const toggleBrand = (brandName: string) => {
    setFilters(prev => {
      const exists = prev.selectedBrands.includes(brandName);
      return {
        ...prev,
        selectedBrands: exists
          ? prev.selectedBrands.filter(b => b !== brandName)
          : [...prev.selectedBrands, brandName]
      };
    });
  };

  // Toggle stock
  const toggleStock = (status: string) => {
    setFilters(prev => {
      const exists = prev.stockFilter.includes(status);
      return {
        ...prev,
        stockFilter: exists
          ? prev.stockFilter.filter(s => s !== status)
          : [...prev.stockFilter, status]
      };
    });
  };

  // Distinct brand filter options supporting Linkbasic, Unspecified, and catalog brands
  const brandFilterOptions = useMemo(() => {
    const list: { name: string; count: number }[] = [];

    // Linkbasic
    const linkbasicCount = products.filter(p => p.brand.toLowerCase() === 'linkbasic').length;
    if (linkbasicCount > 0 || brands.some(b => b.name.toLowerCase() === 'linkbasic')) {
      list.push({ name: 'Linkbasic', count: linkbasicCount });
    }

    // Unspecified (for items marked Manufacturer to verify)
    const unspecifiedCount = products.filter(p => !p.brand || p.brand.toLowerCase() === 'manufacturer to verify' || p.brand.toLowerCase() === 'unspecified').length;
    if (unspecifiedCount > 0) {
      list.push({ name: 'Unspecified', count: unspecifiedCount });
    }

    // Other brands with active counts
    brands.forEach(b => {
      if (b.name.toLowerCase() !== 'linkbasic') {
        const count = products.filter(p => p.brand.toLowerCase() === b.name.toLowerCase()).length;
        if (count > 0) {
          list.push({ name: b.name, count });
        }
      }
    });

    return list;
  }, [products, brands]);

  // Active filters count
  const activeFilterCount =
    (filters.searchQuery ? 1 : 0) +
    filters.selectedCategories.length +
    filters.selectedBrands.length +
    filters.stockFilter.length +
    (filters.priceRange[1] < 250000 ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">
            <span>B2B Equipment Catalog</span>
            {filters.selectedCategories.length === 1 && (
              <>
                <span className="mx-1.5">/</span>
                <span className="text-[#B5121B] font-bold">
                  {categories.find(c => c.id === filters.selectedCategories[0])?.name}
                </span>
              </>
            )}
            {filters.selectedBrands.length === 1 && (
              <>
                <span className="mx-1.5">/</span>
                <span className="text-[#B5121B] font-bold">
                  {filters.selectedBrands[0]}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F36]">
            All ICT Products & Equipment
          </h1>
        </div>

        {/* Mobile Filter Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 flex items-center justify-center gap-2 shadow-2xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#B5121B]" />
            <span>Filter Equipment {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* DESKTOP SIDEBAR FILTERS */}
        <aside className="hidden lg:block bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-6 sticky top-28">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#B5121B]" />
              <h2 className="font-bold text-sm text-[#292F36]">Filter Catalog</h2>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-[11px] font-semibold text-[#B5121B] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            )}
          </div>

          {/* Search within catalog */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Keyword Filter
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Model, spec, or keyword..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full bg-[#F4F5F7] text-xs rounded-lg pl-8 pr-7 py-2 border border-gray-200 focus:outline-none focus:border-[#B5121B]"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Product Category
            </h3>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const count = products.filter(p => p.categoryId === cat.id).length;
                const checked = filters.selectedCategories.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className="flex items-center justify-between text-xs text-gray-700 hover:text-[#B5121B] cursor-pointer py-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(cat.id)}
                        className="rounded border-gray-300 text-[#B5121B] focus:ring-[#B5121B]"
                      />
                      <span className={checked ? 'font-bold text-[#B5121B]' : ''}>
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      ({count})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Brands Filter */}
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Manufacturer / Brand
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {brandFilterOptions.map((brandOpt) => {
                const checked = filters.selectedBrands.includes(brandOpt.name);
                return (
                  <label
                    key={brandOpt.name}
                    className="flex items-center justify-between text-xs text-gray-700 hover:text-[#B5121B] cursor-pointer py-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBrand(brandOpt.name)}
                        className="rounded border-gray-300 text-[#B5121B] focus:ring-[#B5121B]"
                      />
                      <span className={checked ? 'font-bold text-[#B5121B]' : ''}>
                        {brandOpt.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      ({brandOpt.count})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Availability / Stock Status Filter */}
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Availability
            </h3>
            <div className="space-y-1.5">
              {['Contact for Availability', 'In Stock', 'Pre-Order (5-7 Days)'].map((status) => {
                const checked = filters.stockFilter.includes(status);
                return (
                  <label
                    key={status}
                    className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStock(status)}
                      className="rounded border-gray-300 text-[#B5121B] focus:ring-[#B5121B]"
                    />
                    <span className={checked ? 'font-bold text-[#B5121B]' : ''}>
                      {status}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Reference Price Filter */}
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Price Cap (PHP)
              </h3>
              <span className="text-xs font-mono font-bold text-[#B5121B]">
                Up to ₱{filters.priceRange[1].toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="250000"
              step="5000"
              value={filters.priceRange[1]}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                priceRange: [0, parseInt(e.target.value, 10)]
              }))}
              className="w-full accent-[#B5121B] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>₱0</span>
              <span>₱250,000+</span>
            </div>
          </div>
        </aside>

        {/* MAIN PRODUCT CATALOG AREA */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Controls Toolbar */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#292F36]">
                {sortedProducts.length}
              </span>
              <span className="text-gray-500">
                {sortedProducts.length === 1 ? 'equipment item found' : 'equipment items found'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Sorting Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-medium">Sort by:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 font-semibold text-gray-800 focus:outline-none focus:border-[#B5121B]"
                >
                  <option value="featured">Featured Equipment</option>
                  <option value="name-asc">Name (A – Z)</option>
                  <option value="name-desc">Name (Z – A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="newest">New Arrivals</option>
                </select>
              </div>

              {/* View Layout Toggle */}
              <div className="hidden sm:flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-2xs text-[#B5121B]' : 'text-gray-500'}`}
                  title="Grid View"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-2xs text-[#B5121B]' : 'text-gray-500'}`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Tags Row */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-gray-500 font-medium">Active filters:</span>
              {filters.searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-[#B5121B] rounded-full font-medium">
                  Search: "{filters.searchQuery}"
                  <button onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.selectedCategories.map(cid => (
                <span key={cid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full font-medium">
                  {categories.find(c => c.id === cid)?.name}
                  <button onClick={() => toggleCategory(cid)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {filters.selectedBrands.map(b => (
                <span key={b} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full font-medium">
                  Brand: {b}
                  <button onClick={() => toggleBrand(b)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {filters.stockFilter.map(s => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full font-medium">
                  {s}
                  <button onClick={() => toggleStock(s)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={resetFilters}
                className="text-[#B5121B] font-bold hover:underline ml-1"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Products Container */}
          {productsError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Database Synchronization Notice: </span>
                  <span>{productsError}. Currently displaying verified consignment inventory ({products.length} models).</span>
                </div>
              </div>
              <button
                onClick={() => refreshProducts()}
                className="shrink-0 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Sync</span>
              </button>
            </div>
          )}

          {/* Loading Skeleton if products are loading and empty */}
          {productsLoading && products.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 animate-pulse">
                  <div className="h-44 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
                    <Package className="w-8 h-8 opacity-40" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-8 bg-gray-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-[#B5121B] flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#292F36]">No equipment found matching criteria</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Try loosening your filters, broadening your keyword, or resetting category selections.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#B5121B] text-white text-xs font-bold rounded-lg hover:bg-[#8F1018] transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {visibleProducts.map((product) => {
                const imgMeta = getProductImageMetadata(product);
                const salesUnit = getProductSalesUnit(product);
                const displayBrand = getDisplayBrand(product.brand);
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Image */}
                    <div className="relative p-4 bg-gray-50/60 border-b border-gray-100 flex items-center justify-center h-48">
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={handleProductImageError}
                      />
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                          {product.stockStatus}
                        </span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border shadow-2xs ${imgMeta.badgeColor}`}>
                          {imgMeta.shortLabel}
                        </span>
                      </div>
                      <button
                        onClick={() => addToCompare(product)}
                        className="absolute top-2.5 right-2.5 p-1.5 bg-white rounded-md shadow-2xs text-gray-400 hover:text-[#B5121B] border border-gray-200"
                        title="Compare specifications"
                      >
                        <Scale className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Body */}
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

                      {/* Specs list */}
                      <div className="py-2 border-y border-gray-100 text-[11px] text-gray-600 space-y-1">
                        {product.keySpecs.slice(0, 2).map((s, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B5121B] shrink-0" />
                            <span className="truncate">{s}</span>
                          </div>
                        ))}
                      </div>

                      {/* Price and Buttons */}
                      <div className="space-y-3 pt-1">
                        {(() => {
                          const priceInfo = getProductPriceDisplay(product);
                          return (
                            <div className="flex items-baseline justify-between">
                              <div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                                  {priceInfo.isPriceOnRequest ? 'B2B Procurement' : 'Indicative Price'}
                                </div>
                                <div className={`text-base font-extrabold ${priceInfo.isPriceOnRequest ? 'text-[#B5121B]' : 'text-[#292F36] font-mono'}`}>
                                  {priceInfo.displayPrice}
                                  {!priceInfo.isPriceOnRequest && salesUnit && (
                                    <span className="text-xs font-normal text-gray-500 ml-1">/ {salesUnit}</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] text-gray-400">
                                {priceInfo.isPriceOnRequest ? 'Project Volume' : 'Net of VAT'}
                              </span>
                            </div>
                          );
                        })()}

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => navigateToProduct(product.id)}
                            className="w-full py-2 px-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Specs</span>
                          </button>
                          <button
                            onClick={() => addToQuoteCart(product, 1)}
                            className="w-full py-2 px-2 text-xs font-bold text-white bg-[#B5121B] hover:bg-[#8F1018] rounded-lg flex items-center justify-center gap-1 transition-colors shadow-2xs"
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
          ) : (
            /* List View */
            <div className="space-y-3">
              {visibleProducts.map((product) => {
                const imgMeta = getProductImageMetadata(product);
                const salesUnit = getProductSalesUnit(product);
                const displayBrand = getDisplayBrand(product.brand);
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-4 group"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="w-32 h-32 object-contain rounded-lg border border-gray-100 bg-gray-50 shrink-0"
                        onError={handleProductImageError}
                      />
                      <span className={`absolute bottom-1 left-1 text-[8px] font-semibold px-1 py-0.5 rounded border ${imgMeta.badgeColor}`}>
                        {imgMeta.shortLabel}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5 text-left w-full">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#B5121B] uppercase">{displayBrand}</span>
                        <span>·</span>
                        <span className="font-mono text-gray-500">SKU: {product.sku}</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold">{product.stockStatus}</span>
                      </div>

                      <h3
                        onClick={() => navigateToProduct(product.id)}
                        className="font-bold text-sm text-[#292F36] hover:text-[#B5121B] cursor-pointer transition-colors"
                      >
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {product.shortDescription}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-xs text-gray-600 flex-wrap">
                        {product.keySpecs.slice(0, 3).map((s, idx) => (
                          <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 space-y-2">
                      {(() => {
                        const priceInfo = getProductPriceDisplay(product);
                        return (
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                              {priceInfo.isPriceOnRequest ? 'Procurement' : 'Indicative'}
                            </div>
                            <div className={`text-base font-extrabold ${priceInfo.isPriceOnRequest ? 'text-[#B5121B]' : 'text-[#292F36] font-mono'}`}>
                              {priceInfo.displayPrice}
                              {!priceInfo.isPriceOnRequest && salesUnit && (
                                <span className="text-xs font-normal text-gray-500 ml-1">/ {salesUnit}</span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                      <div className="flex sm:flex-col gap-2">
                        <button
                          onClick={() => addToQuoteCart(product, 1)}
                          className="flex-1 sm:flex-initial py-2 px-3 text-xs font-bold text-white bg-[#B5121B] hover:bg-[#8F1018] rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Quote</span>
                        </button>
                        <button
                          onClick={() => navigateToProduct(product.id)}
                          className="py-1.5 px-3 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-center"
                        >
                          View Full Specs
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {visibleProducts.length < sortedProducts.length && (
            <div className="text-center pt-8">
              <button
                onClick={() => setDisplayCount(prev => prev + 12)}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
              >
                Load More Products ({sortedProducts.length - visibleProducts.length} remaining)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTER MODAL DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white shadow-2xl flex flex-col p-5 space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#B5121B]" />
                  <h3 className="font-bold text-sm text-[#292F36]">Filter Products</h3>
                </div>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Category List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-gray-700">Categories</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={filters.selectedCategories.includes(c.id)}
                        onChange={() => toggleCategory(c.id)}
                        className="rounded text-[#B5121B]"
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Mobile Brands List */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase text-gray-700">Brands</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {brandFilterOptions.map((b) => (
                    <label key={b.name} className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={filters.selectedBrands.includes(b.name)}
                        onChange={() => toggleBrand(b.name)}
                        className="rounded text-[#B5121B]"
                      />
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Mobile Stock Status List */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase text-gray-700">Availability</h4>
                <div className="space-y-1.5">
                  {['Contact for Availability', 'In Stock', 'Pre-Order (5-7 Days)'].map((status) => (
                    <label key={status} className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={filters.stockFilter.includes(status)}
                        onChange={() => toggleStock(status)}
                        className="rounded text-[#B5121B]"
                      />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center gap-2">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-2.5 bg-[#B5121B] text-white text-xs font-bold rounded-lg"
                >
                  Apply Filters ({sortedProducts.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
