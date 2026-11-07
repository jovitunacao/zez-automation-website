import React from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Truck, 
  FileCheck, 
  Award,
  ExternalLink,
  Wrench,
  Layers,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../brand/Logo';

export const Footer: React.FC = () => {
  const { 
    setActiveView, 
    navigateToCategory, 
    categories 
  } = useApp();

  const exactServices = [
    { name: 'FIRE DETECTION ALARM SYSTEM', url: 'https://zigmatech.shop/services/' },
    { name: 'FIRE PROTECTION SYSTEM', url: 'https://zigmatech.shop/services/' },
    { name: 'STRUCTURED CABLING', url: 'https://zigmatech.shop/services/' },
    { name: 'PUBLIC ADDRESS BACKGROUND SYSTEM', url: 'https://zigmatech.shop/services/' },
    { name: 'MECHANICAL WORKS', url: 'https://zigmatech.shop/services/' },
    { name: 'TELEPHONE SYSTEM', url: 'https://zigmatech.shop/' },
    { name: 'GENERATORS', url: 'https://zigmatech.shop/' }
  ];

  return (
    <footer className="bg-[#292F36] text-gray-300 pt-14 pb-8 border-t border-gray-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Core Value Capabilities Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-gray-700/80">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#B5121B]/15 text-[#B5121B] shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#B5121B]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Genuine ICT Equipment</h4>
              <p className="text-xs text-gray-400 mt-0.5">Direct sourcing with manufacturer warranty coverage.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#B5121B]/15 text-[#B5121B] shrink-0">
              <Wrench className="w-5 h-5 text-[#B5121B]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Engineering Services</h4>
              <p className="text-xs text-gray-400 mt-0.5">Turnkey cabling, MEP, fire protection & telecommunications.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#B5121B]/15 text-[#B5121B] shrink-0">
              <Truck className="w-5 h-5 text-[#B5121B]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Nationwide Logistics</h4>
              <p className="text-xs text-gray-400 mt-0.5">Davao and Zamboanga regional hubs with provincial freight.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#B5121B]/15 text-[#B5121B] shrink-0">
              <FileCheck className="w-5 h-5 text-[#B5121B]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Official BIR Billing</h4>
              <p className="text-xs text-gray-400 mt-0.5">Compliant sales invoices and formal quotation pro-formas.</p>
            </div>
          </div>
        </div>

        {/* Multi-Column Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 py-12">
          {/* Column 1: Company Information (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Logo variant="dark" size="lg" />
            <p className="text-xs text-gray-300 leading-relaxed mt-3">
              ZEZ Automation Corporation is an enterprise ICT equipment supplier/distributor and technology infrastructure engineering solutions provider in the Philippines.
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Operating under the Zigmatech-related branding structure, we deliver end-to-end IT hardware, structured cabling, data center components, commercial surveillance, and comprehensive MEP engineering works.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => setActiveView('rfq')}
                className="px-3.5 py-1.5 bg-[#B5121B] hover:bg-[#8F1018] text-white rounded font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Request Quotation</span>
              </button>
              <button
                onClick={() => setActiveView('services')}
                className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded font-semibold text-xs transition-colors border border-gray-700"
              >
                <span>View Engineering Services</span>
              </button>
            </div>
          </div>

          {/* Column 2: Equipment Categories (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold tracking-wider uppercase text-white">
                Equipment Categories
              </h4>
              <button
                onClick={() => setActiveView('categories')}
                className="text-[11px] text-[#B5121B] hover:underline font-semibold"
              >
                View All 12 →
              </button>
            </div>
            <ul className="grid grid-cols-1 gap-2 text-xs">
              {categories.slice(0, 8).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => navigateToCategory(cat.id)}
                    className="text-gray-400 hover:text-white transition-colors text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Our Services (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold tracking-wider uppercase text-white">
                Our Services
              </h4>
            </div>
            <ul className="space-y-2 text-[11px]">
              {exactServices.map((srv, idx) => (
                <li key={idx}>
                  <a
                    href={srv.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 group"
                    title={`View ${srv.name} on source website`}
                  >
                    <span className="group-hover:text-red-300 transition-colors leading-tight">{srv.name}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Information & Locations (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold tracking-wider uppercase text-white">
              Contact & Locations
            </h4>

            {/* Clickable Phone & Email */}
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#B5121B] shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-400 block text-[11px]">Inquiries & Quotations:</span>
                  <a 
                    href="mailto:zigmatechdvo2003@gmail.com" 
                    className="text-white hover:text-red-300 hover:underline font-semibold"
                  >
                    zigmatechdvo2003@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <Phone className="w-4 h-4 text-[#B5121B] shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-400 block text-[11px]">Direct Telephone Lines:</span>
                  <div className="space-y-0.5">
                    <a 
                      href="tel:+639177198503" 
                      className="text-white hover:text-red-300 hover:underline font-semibold block"
                    >
                      +63-917-719-8503
                    </a>
                    <a 
                      href="tel:+639954448050" 
                      className="text-white hover:text-red-300 hover:underline font-semibold block"
                    >
                      +63-995-444-8050
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Dual Location Offices */}
            <div className="space-y-3 pt-2 border-t border-gray-700/60 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B5121B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Davao City Office</strong>
                  <p className="text-gray-400 text-[11px] leading-relaxed mt-0.5">
                    Blk 32, Lot 20, Phase 2, Deca Homes Esperanza, Tigatto, Davao City 8000, Philippines
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B5121B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Zamboanga City Office</strong>
                  <p className="text-gray-400 text-[11px] leading-relaxed mt-0.5">
                    1 Mayor Jaldon St., Canelar, Zamboanga City 7000, Philippines
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div>
            © {new Date().getFullYear()} ZEZ Automation Corporation. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setActiveView('about')}
              className="hover:text-white transition-colors"
            >
              About Company
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveView('services')}
              className="hover:text-white transition-colors"
            >
              Engineering Services
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveView('contact')}
              className="hover:text-white transition-colors"
            >
              Contact Us
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveView('admin')}
              className="text-gray-500 hover:text-amber-400 transition-colors"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
