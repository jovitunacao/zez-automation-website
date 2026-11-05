import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Phone, 
  MapPin, 
  ChevronDown, 
  Menu, 
  X, 
  FileText, 
  Scale, 
  ShieldAlert, 
  Clock, 
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../brand/Logo';
import { handleProductImageError } from '../../utils/productUtils';

export const Header: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    categories, 
    brands, 
    products, 
    quoteCart, 
    setIsQuoteDrawerOpen, 
    navigateToProduct, 
    navigateToCategory, 
    navigateToBrand,
    setSearchQuery,
    compareList,
    setIsCompareModalOpen,
    siteSettings
  } = useApp();

  // Smart auto-hiding scroll state
  const [isAtTop, setIsAtTop] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isCompact, setIsCompact] = useState(false);
  const [fullHeaderHeight, setFullHeaderHeight] = useState<number>(0);

  // Interaction states
  const [searchFocused, setSearchFocused] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);

  // Refs
  const headerContainerRef = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const compactSearchRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Check if user is actively typing, interacting, or has menus open
  const isInteracting = 
    searchFocused || 
    localSearch.trim().length > 0 || 
    mobileMenuOpen || 
    categoriesOpen || 
    brandsOpen;

  // Measure full uncollapsed header height for the spacer
  const measureFullHeight = useCallback(() => {
    if (headerContainerRef.current && isAtTop) {
      const height = headerContainerRef.current.offsetHeight;
      if (height > 0) {
        setFullHeaderHeight(height);
      }
    }
  }, [isAtTop]);

  useEffect(() => {
    measureFullHeight();

    if (!headerContainerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      measureFullHeight();
    });
    resizeObserver.observe(headerContainerRef.current);

    return () => resizeObserver.disconnect();
  }, [measureFullHeight, siteSettings.isBannerActive]);

  // Click outside listener for search suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const insideDesktop = desktopSearchRef.current?.contains(target);
      const insideMobile = mobileSearchRef.current?.contains(target);
      const insideCompact = compactSearchRef.current?.contains(target);

      if (!insideDesktop && !insideMobile && !insideCompact) {
        setSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Professional smart auto-hiding scroll detection
  useEffect(() => {
    const SCROLL_DELTA_THRESHOLD = 10; // Minimum scroll delta to prevent micro-jitter

    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        // Clamp scrollY to >= 0 to handle iOS Safari rubber-band elastic bounce at page top
        const currentScrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
        const prevScrollY = lastScrollY.current;
        const scrollDiff = currentScrollY - prevScrollY;

        // Check if user is at the top of the page
        if (currentScrollY <= 15) {
          setIsAtTop(true);
          setIsHeaderVisible(true);
          setIsCompact(false);
          lastScrollY.current = currentScrollY;
          ticking.current = false;
          return;
        }

        setIsAtTop(false);

        // Never hide while user is typing in search, focusing search, or has menus open
        if (isInteracting) {
          setIsHeaderVisible(true);
          lastScrollY.current = currentScrollY;
          ticking.current = false;
          return;
        }

        // Avoid toggling state when bouncing against bottom of document on iOS / mobile
        const maxScrollY = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );
        if (currentScrollY >= maxScrollY - 25) {
          ticking.current = false;
          return;
        }

        // Only react if scroll delta exceeds threshold to prevent flickering
        if (Math.abs(scrollDiff) >= SCROLL_DELTA_THRESHOLD) {
          if (scrollDiff > 0) {
            // Scrolling DOWN -> smoothly hide complete header
            setIsHeaderVisible(false);
          } else {
            // Scrolling UP -> reveal compact header
            setIsHeaderVisible(true);
            setIsCompact(true);
          }
          lastScrollY.current = currentScrollY;
        }

        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInteracting]);

  // Filter products for instant search suggestions
  const suggestedProducts = localSearch.trim()
    ? products
        .filter(
          p =>
            p.name.toLowerCase().includes(localSearch.toLowerCase()) ||
            p.model.toLowerCase().includes(localSearch.toLowerCase()) ||
            p.brand.toLowerCase().includes(localSearch.toLowerCase()) ||
            p.sku.toLowerCase().includes(localSearch.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const totalCartCount = quoteCart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSearch.trim()) return;
    setSearchQuery(localSearch);
    setActiveView('shop');
    setSearchFocused(false);
    setMobileMenuOpen(false);
  };

  const handleNavClick = (view: typeof activeView, action?: () => void) => {
    if (action) action();
    setActiveView(view);
    setMobileMenuOpen(false);
    setCategoriesOpen(false);
    setBrandsOpen(false);
    setSearchFocused(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Document Flow Spacer: prevents content jump or large empty gaps while header is fixed */}
      <div 
        aria-hidden="true" 
        className="w-full shrink-0 min-h-[96px] md:min-h-[148px] pointer-events-none select-none transition-[height] duration-200"
        style={{ height: fullHeaderHeight > 0 ? `${fullHeaderHeight}px` : undefined }} 
      />

      {/* Smart Auto-Hiding Fixed Header */}
      <header 
        ref={headerContainerRef}
        className={`fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 transition-transform duration-300 ease-in-out motion-reduce:transition-none motion-reduce:transform-none no-print ${
          isHeaderVisible ? 'translate-y-0 pointer-events-auto' : '-translate-y-full pointer-events-none'
        } ${isCompact ? 'shadow-md' : 'shadow-sm'}`}
      >
        {/* Top Corporate Bar: Only shown when at top of page */}
        {!isCompact && (
          <div className="bg-[#292F36] text-gray-300 text-xs py-2 px-4 sm:px-8 border-b border-gray-800 transition-opacity duration-200">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-white font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>PHILIPPINE ICT SUPPLIES DISTRIBUTOR</span>
                </div>
                <div className="hidden md:flex items-center gap-1.5 text-gray-400">
                  <MapPin className="w-3.5 h-3.5 text-[#B5121B]" />
                  <span>Ortigas Center, Pasig City · Metro Manila Depot</span>
                </div>
                <div className="hidden lg:flex items-center gap-1 text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{siteSettings.operatingHours}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <a 
                  href={`tel:${siteSettings.phonePrimary.replace(/[^0-9+]/g, '')}`} 
                  className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#B5121B]" />
                  <span className="font-semibold">{siteSettings.phonePrimary}</span>
                </a>
                <div className="h-3 w-px bg-gray-700 hidden sm:block" />
                <button
                  onClick={() => handleNavClick('account')}
                  className="text-gray-300 hover:text-white transition-colors hidden sm:flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Track RFQ</span>
                </button>
                <div className="h-3 w-px bg-gray-700" />
                <button
                  onClick={() => handleNavClick('admin')}
                  className="text-amber-400 hover:text-amber-300 transition-colors font-medium flex items-center gap-1 text-[11px]"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Staff Portal</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- COMPACT MOBILE HEADER (When scrolling up on mobile) ----------------- */}
        {isCompact && (
          <div className="md:hidden px-3 py-2 flex items-center justify-between gap-2">
            {/* Logo */}
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center text-left focus:outline-none shrink-0"
              aria-label="ZEZ Automation Home"
            >
              <Logo size="sm" variant="light" showSubtitle={false} />
            </button>

            {/* Compact Search Bar with instant autocomplete suggestions */}
            <div ref={compactSearchRef} className="relative flex-1 min-w-0 max-w-[200px] sm:max-w-xs">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="w-full bg-[#F4F5F7] text-xs text-[#292F36] placeholder-gray-500 rounded-lg pl-7 pr-7 py-1.5 border border-gray-200 focus:border-[#B5121B] focus:bg-white focus:outline-none transition-all"
                />
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => setLocalSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </form>

              {/* Suggestions Popover for Compact Mobile */}
              {searchFocused && suggestedProducts.length > 0 && (
                <div className="absolute top-full left-[-60px] right-[-60px] mt-1.5 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                  <div className="p-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                    Product Suggestions
                  </div>
                  {suggestedProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        navigateToProduct(p.id);
                        setSearchFocused(false);
                        setLocalSearch('');
                      }}
                      className="w-full p-2 flex items-center gap-2 hover:bg-red-50/50 text-left transition-colors"
                    >
                      <img
                        src={p.mainImage}
                        alt={p.name}
                        onError={handleProductImageError}
                        className="w-8 h-8 object-contain bg-white rounded border border-gray-200 shrink-0 p-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#292F36] truncate">{p.name}</p>
                        <p className="text-[10px] text-[#5E646D] truncate">
                          {p.brand} · {p.model}
                        </p>
                      </div>
                      {p.pricePhp && (
                        <span className="text-[11px] font-bold text-[#B5121B] shrink-0">
                          ₱{p.pricePhp.toLocaleString()}
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="p-1.5 text-center bg-gray-50">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-[11px] font-medium text-[#B5121B] hover:underline"
                    >
                      View all matching equipment →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Compact Action Icons: Quotation Cart & Menu Toggle */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsQuoteDrawerOpen(true)}
                className="relative p-2 rounded-lg text-gray-700 hover:text-[#B5121B] hover:bg-gray-100 transition-colors"
                aria-label="View Quotation Cart"
              >
                <ShoppingCart className="w-5 h-5 text-[#B5121B]" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-[#B5121B] rounded-full flex items-center justify-center shadow-xs">
                    {totalCartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-[#B5121B] hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {/* ----------------- FULL STATE MAIN HEADER (Desktop & Default Mobile) ----------------- */}
        <div className={`max-w-7xl mx-auto px-4 sm:px-8 ${isCompact ? 'hidden md:block py-2' : 'py-3.5'}`}>
          <div className="flex items-center justify-between gap-4 lg:gap-8">
            {/* Logo */}
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center text-left focus:outline-none shrink-0"
              aria-label="ZEZ Automation Home"
            >
              <Logo size={isCompact ? 'sm' : 'md'} variant="light" />
            </button>

            {/* Desktop Search Bar with Autocomplete Dropdown */}
            <div ref={desktopSearchRef} className="relative flex-1 max-w-xl hidden md:block">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search models, brands, SKUs (e.g. Cisco, Ubiquiti, Cat6, UPS)..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className={`w-full bg-[#F4F5F7] text-[#292F36] placeholder-gray-500 text-sm rounded-lg pl-10 pr-24 border border-transparent focus:border-[#B5121B] focus:bg-white focus:outline-none transition-all ${
                    isCompact ? 'py-1.5' : 'py-2.5'
                  }`}
                />
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="submit"
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-semibold rounded-md transition-colors ${
                    isCompact ? 'px-2.5 py-1' : 'px-3 py-1.5'
                  }`}
                >
                  Search
                </button>
              </form>

              {/* Suggestions Popover */}
              {searchFocused && suggestedProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100">
                  <div className="p-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                    Product Suggestions
                  </div>
                  {suggestedProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        navigateToProduct(p.id);
                        setSearchFocused(false);
                        setLocalSearch('');
                      }}
                      className="w-full p-2.5 flex items-center gap-3 hover:bg-red-50/50 text-left transition-colors"
                    >
                      <img
                        src={p.mainImage}
                        alt={p.name}
                        onError={handleProductImageError}
                        className="w-10 h-10 object-contain bg-white rounded border border-gray-200 shrink-0 p-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#292F36] truncate">{p.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-[#5E646D]">
                          <span className="font-semibold text-[#B5121B]">{p.brand}</span>
                          <span>·</span>
                          <span>{p.model}</span>
                          <span>·</span>
                          <span className="font-mono text-[10px]">{p.sku}</span>
                        </div>
                      </div>
                      {p.pricePhp && (
                        <span className="text-xs font-bold text-[#292F36] shrink-0">
                          ₱{p.pricePhp.toLocaleString()}
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="p-2 text-center bg-gray-50">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-xs font-medium text-[#B5121B] hover:underline"
                    >
                      View all matching equipment →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Icons & RFQ Cart */}
            <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
              {/* Compare shortcut */}
              {compareList.length > 0 && (
                <button
                  onClick={() => setIsCompareModalOpen(true)}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#292F36] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Compare Products"
                >
                  <Scale className="w-4 h-4 text-[#B5121B]" />
                  <span>Compare ({compareList.length})</span>
                </button>
              )}

              {/* Customer Account Button */}
              <button
                onClick={() => handleNavClick('account')}
                className={`p-2 rounded-lg text-gray-700 hover:text-[#B5121B] hover:bg-gray-100 transition-colors flex items-center gap-1.5 ${
                  activeView === 'account' ? 'text-[#B5121B] bg-red-50' : ''
                }`}
                title="Customer Account & RFQs"
              >
                <User className="w-5 h-5" />
                <span className="text-xs font-medium hidden sm:inline">Account</span>
              </button>

              {/* Quotation Cart Button */}
              <button
                onClick={() => setIsQuoteDrawerOpen(true)}
                className={`relative flex items-center gap-2 rounded-lg bg-[#B5121B] hover:bg-[#8F1018] text-white transition-all shadow-sm active:scale-95 ${
                  isCompact ? 'px-3 py-1.5' : 'px-3.5 py-2'
                }`}
                aria-label="View Quotation Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-xs font-bold hidden sm:inline">Quotation Cart</span>
                {totalCartCount > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-black text-[#B5121B] bg-white rounded-full">
                    {totalCartCount}
                  </span>
                ) : (
                  <span className="text-xs opacity-75 hidden sm:inline">(0)</span>
                )}
              </button>

              {/* Mobile Menu Toggle (Only in full mode, compact mode has its own row) */}
              {!isCompact && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-gray-700 hover:text-[#B5121B]"
                  aria-label="Toggle Navigation"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Search Input (Full state only) */}
          {!isCompact && (
            <div ref={mobileSearchRef} className="mt-3 md:hidden relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search equipment, models, brands..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="w-full bg-[#F4F5F7] text-sm rounded-lg pl-9 pr-16 py-2 border border-gray-200 focus:outline-none focus:border-[#B5121B]"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#B5121B] text-white text-xs font-medium rounded"
                >
                  Go
                </button>
              </form>

              {/* Suggestions Popover for Full Mobile State */}
              {searchFocused && suggestedProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                  <div className="p-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                    Product Suggestions
                  </div>
                  {suggestedProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        navigateToProduct(p.id);
                        setSearchFocused(false);
                        setLocalSearch('');
                      }}
                      className="w-full p-2.5 flex items-center gap-3 hover:bg-red-50/50 text-left transition-colors"
                    >
                      <img
                        src={p.mainImage}
                        alt={p.name}
                        onError={handleProductImageError}
                        className="w-10 h-10 object-contain bg-white rounded border border-gray-200 shrink-0 p-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#292F36] truncate">{p.name}</p>
                        <p className="text-[11px] text-[#5E646D] truncate">
                          {p.brand} · {p.model}
                        </p>
                      </div>
                      {p.pricePhp && (
                        <span className="text-xs font-bold text-[#B5121B] shrink-0">
                          ₱{p.pricePhp.toLocaleString()}
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="p-2 text-center bg-gray-50">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-xs font-medium text-[#B5121B] hover:underline"
                    >
                      View all matching equipment →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ----------------- MAIN DESKTOP NAVIGATION BAR ----------------- */}
        <nav className={`bg-white border-t border-gray-100 hidden md:block ${isCompact ? 'py-0' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
            <div className="flex items-center gap-1 lg:gap-2 text-sm font-semibold text-[#292F36]">
              {/* All Products Link */}
              <button
                onClick={() => handleNavClick('shop')}
                className={`transition-colors border-b-2 flex items-center gap-1.5 ${
                  isCompact ? 'px-3 py-2 text-xs' : 'px-3 py-3 text-sm'
                } ${
                  activeView === 'shop'
                    ? 'border-[#B5121B] text-[#B5121B]'
                    : 'border-transparent hover:text-[#B5121B]'
                }`}
              >
                <Layers className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[#B5121B]`} />
                <span>Shop All Products</span>
              </button>

              {/* Categories Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setCategoriesOpen(true)}
                onMouseLeave={() => setCategoriesOpen(false)}
              >
                <button
                  onClick={() => handleNavClick('categories')}
                  className={`transition-colors border-b-2 flex items-center gap-1 ${
                    isCompact ? 'px-3 py-2 text-xs' : 'px-3 py-3 text-sm'
                  } ${
                    activeView === 'categories'
                      ? 'border-[#B5121B] text-[#B5121B]'
                      : 'border-transparent hover:text-[#B5121B]'
                  }`}
                >
                  <span>Categories</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Categories Mega Menu */}
                {categoriesOpen && (
                  <div className="absolute top-full left-0 w-[580px] bg-white rounded-b-xl shadow-2xl border border-gray-200 p-4 grid grid-cols-2 gap-2 z-50 animate-fadeIn">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          navigateToCategory(cat.id);
                          setCategoriesOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-left p-2 rounded-lg hover:bg-gray-50 flex items-start gap-2.5 group transition-colors"
                      >
                        <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-[#B5121B] font-bold text-xs shrink-0 group-hover:bg-[#B5121B] group-hover:text-white transition-colors">
                          {cat.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900 group-hover:text-[#B5121B]">
                            {cat.name}
                          </div>
                          <div className="text-[11px] text-gray-500 line-clamp-1">
                            {cat.subcategories.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </button>
                    ))}
                    <div className="col-span-2 pt-2 border-t border-gray-100 text-center">
                      <button
                        onClick={() => {
                          handleNavClick('categories');
                        }}
                        className="text-xs font-semibold text-[#B5121B] hover:underline"
                      >
                        Browse All 12 Equipment Categories →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Brands Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setBrandsOpen(true)}
                onMouseLeave={() => setBrandsOpen(false)}
              >
                <button
                  onClick={() => handleNavClick('brands')}
                  className={`transition-colors border-b-2 flex items-center gap-1 ${
                    isCompact ? 'px-3 py-2 text-xs' : 'px-3 py-3 text-sm'
                  } ${
                    activeView === 'brands'
                      ? 'border-[#B5121B] text-[#B5121B]'
                      : 'border-transparent hover:text-[#B5121B]'
                  }`}
                >
                  <span>Brands</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${brandsOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Brands Menu */}
                {brandsOpen && (
                  <div className="absolute top-full left-0 w-80 bg-white rounded-b-xl shadow-2xl border border-gray-200 p-3 z-50 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-1.5">
                      {brands.slice(0, 10).map((brand) => (
                        <button
                          key={brand.id}
                          onClick={() => {
                            navigateToBrand(brand.name);
                            setBrandsOpen(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-left px-2.5 py-1.5 rounded text-xs font-semibold text-gray-700 hover:text-[#B5121B] hover:bg-red-50/50 flex items-center justify-between"
                        >
                          <span>{brand.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({brand.productCount})</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 text-center">
                      <button
                        onClick={() => {
                          handleNavClick('brands');
                        }}
                        className="text-xs font-semibold text-[#B5121B] hover:underline"
                      >
                        View All Supported Brands →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* About Us */}
              <button
                onClick={() => handleNavClick('about')}
                className={`transition-colors border-b-2 ${
                  isCompact ? 'px-3 py-2 text-xs' : 'px-3 py-3 text-sm'
                } ${
                  activeView === 'about'
                    ? 'border-[#B5121B] text-[#B5121B]'
                    : 'border-transparent hover:text-[#B5121B]'
                }`}
              >
                About Us
              </button>

              {/* Contact Us */}
              <button
                onClick={() => handleNavClick('contact')}
                className={`transition-colors border-b-2 ${
                  isCompact ? 'px-3 py-2 text-xs' : 'px-3 py-3 text-sm'
                } ${
                  activeView === 'contact'
                    ? 'border-[#B5121B] text-[#B5121B]'
                    : 'border-transparent hover:text-[#B5121B]'
                }`}
              >
                Contact Us
              </button>
            </div>

            {/* Right Direct RFQ Link */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNavClick('rfq')}
                className={`font-bold text-[#B5121B] hover:text-[#8F1018] flex items-center gap-1.5 rounded-md bg-red-50 hover:bg-red-100 transition-colors ${
                  isCompact ? 'text-[11px] py-1 px-2.5' : 'text-xs py-1.5 px-3'
                }`}
              >
                <FileText className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                <span>Submit RFQ Inquiry</span>
              </button>
            </div>
          </div>
        </nav>

        {/* ----------------- MOBILE DRAWER NAVIGATION ----------------- */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3 shadow-lg max-h-[80vh] overflow-y-auto">
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => handleNavClick('home')}
                className="text-left py-2 font-semibold text-gray-800 hover:text-[#B5121B]"
              >
                Home
              </button>
              <button
                onClick={() => handleNavClick('shop')}
                className="text-left py-2 font-semibold text-gray-800 hover:text-[#B5121B]"
              >
                Shop All Products
              </button>
              <button
                onClick={() => handleNavClick('categories')}
                className="text-left py-2 font-semibold text-gray-800 hover:text-[#B5121B]"
              >
                Product Categories (12)
              </button>
              <button
                onClick={() => handleNavClick('brands')}
                className="text-left py-2 font-semibold text-gray-800 hover:text-[#B5121B]"
              >
                Brand Directory
              </button>
              <button
                onClick={() => handleNavClick('rfq')}
                className="text-left py-2 font-semibold text-[#B5121B]"
              >
                Request for Quotation
              </button>
              <button
                onClick={() => handleNavClick('account')}
                className="text-left py-2 font-semibold text-gray-800 hover:text-[#B5121B]"
              >
                Customer Account / Track Orders
              </button>
              <button
                onClick={() => handleNavClick('about')}
                className="text-left py-2 font-semibold text-gray-800 hover:text-[#B5121B]"
              >
                About ZEZ Automation
              </button>
              <button
                onClick={() => handleNavClick('contact')}
                className="text-left py-2 font-semibold text-gray-800 hover:text-[#B5121B]"
              >
                Contact & Branch Directory
              </button>
              <button
                onClick={() => handleNavClick('admin')}
                className="text-left py-2 font-semibold text-amber-600"
              >
                Admin Dashboard
              </button>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500">Corporate Hotline:</div>
              <a
                href={`tel:${siteSettings.phonePrimary.replace(/[^0-9+]/g, '')}`}
                className="text-sm font-bold text-[#B5121B] flex items-center gap-2 mt-1"
              >
                <Phone className="w-4 h-4" />
                <span>{siteSettings.phonePrimary}</span>
              </a>
            </div>
          </div>
        )}

        {/* Optional Top Announcement Strip: Only in full state */}
        {!isCompact && siteSettings.isBannerActive && (
          <div className="bg-red-50 text-[#8F1018] text-xs py-1.5 px-4 text-center border-t border-red-100 hidden sm:block">
            <span className="font-semibold">Notice: </span>
            <span>{siteSettings.bannerAnnouncement}</span>
          </div>
        )}
      </header>
    </>
  );
};
