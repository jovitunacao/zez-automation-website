/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { QuotationDrawer } from './components/quote/QuotationDrawer';
import { QuotationSlipModal } from './components/quote/QuotationSlipModal';
import { ProductCompareModal } from './components/compare/ProductCompareModal';
import { FloatingActionContact } from './components/common/FloatingActionContact';

// Views
import { HomeView } from './views/HomeView';
import { ShopView } from './views/ShopView';
import { CategoriesView } from './views/CategoriesView';
import { BrandsView } from './views/BrandsView';
import { ProductDetailView } from './views/ProductDetailView';
import { RfqCheckoutView } from './views/RfqCheckoutView';
import { CustomerAccountView } from './views/CustomerAccountView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AboutUsView } from './views/AboutUsView';
import { ContactUsView } from './views/ContactUsView';

const MainContent: React.FC = () => {
  const { activeView, activeRfqForPrint, setActiveRfqForPrint } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#292F36]">
      {/* Shared Navigation Header */}
      <Header />

      {/* Main Dynamic View Content */}
      <main className="flex-1">
        {activeView === 'home' && <HomeView />}
        {activeView === 'shop' && <ShopView />}
        {activeView === 'categories' && <CategoriesView />}
        {activeView === 'brands' && <BrandsView />}
        {activeView === 'product-detail' && <ProductDetailView />}
        {activeView === 'rfq' && <RfqCheckoutView />}
        {activeView === 'account' && <CustomerAccountView />}
        {activeView === 'admin' && <AdminDashboardView />}
        {activeView === 'about' && <AboutUsView />}
        {activeView === 'contact' && <ContactUsView />}
      </main>

      {/* Shared Corporate Footer */}
      <Footer />

      {/* Global Interactive Modals and Flyouts */}
      <QuotationDrawer />
      <ProductCompareModal />
      <QuotationSlipModal
        rfq={activeRfqForPrint}
        onClose={() => setActiveRfqForPrint(null)}
      />
      <FloatingActionContact />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
