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
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../brand/Logo';

export const Footer: React.FC = () => {
  const { 
    setActiveView, 
    navigateToCategory, 
    categories, 
    siteSettings 
  } = useApp();

  return (
    <footer className="bg-[#292F36] text-gray-300 pt-14 pb-8 border-t border-gray-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Value Proposition Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-gray-700">
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
              <FileCheck className="w-5 h-5 text-[#B5121B]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Official BIR Billing</h4>
              <p className="text-xs text-gray-400 mt-0.5">Compliant sales invoices and corporate purchase orders.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#B5121B]/15 text-[#B5121B] shrink-0">
              <Truck className="w-5 h-5 text-[#B5121B]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Nationwide Logistics</h4>
              <p className="text-xs text-gray-400 mt-0.5">Metro Manila dispatch and provincial freight forwarding.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#B5121B]/15 text-[#B5121B] shrink-0">
              <Award className="w-5 h-5 text-[#B5121B]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Technical Presales</h4>
              <p className="text-xs text-gray-400 mt-0.5">Certified engineers for bill-of-materials sizing.</p>
            </div>
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12">
          {/* Company Column */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="dark" size="lg" />
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm mt-3">
              ZEZ Automation Corporation is a premier Philippine-based ICT equipment and technology supplies distributor. We deliver end-to-end enterprise hardware, structured cabling, data center solutions, and commercial surveillance systems for corporations, educational institutions, contractors, and government entities.
            </p>

            <div className="space-y-2 text-xs text-gray-300 pt-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B5121B] shrink-0 mt-0.5" />
                <span>{siteSettings.officeAddress}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#B5121B] shrink-0" />
                <span>Hotline: <strong className="text-white">{siteSettings.phonePrimary}</strong> | Mobile: <strong className="text-white">{siteSettings.mobileViber}</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#B5121B] shrink-0" />
                <span>Corporate Sales: <a href={`mailto:${siteSettings.emailSales}`} className="text-white hover:underline">{siteSettings.emailSales}</a></span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#B5121B] shrink-0" />
                <span>Business Hours: {siteSettings.operatingHours}</span>
              </div>
            </div>
          </div>

          {/* Equipment Categories */}
          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-white mb-3">
              Equipment Categories
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => navigateToCategory(cat.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-white mb-3">
              Infrastructure
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.slice(6, 12).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => navigateToCategory(cat.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links & Procurement */}
          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-white mb-3">
              B2B Procurement
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveView('rfq')}
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Request for Quotation</span>
                  <span className="text-[10px] text-[#B5121B] font-bold">RFQ</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('account')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Track Quotation Status
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('shop')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Product Catalog & Specs
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('brands')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Supported Brands
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('about')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Company Profile & Logistics
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('contact')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact & Branch Locations
                </button>
              </li>
              <li className="pt-2">
                <button
                  onClick={() => setActiveView('admin')}
                  className="text-amber-400 hover:text-amber-300 font-semibold"
                >
                  Administration Dashboard →
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-8 mt-6 border-t border-gray-800 text-[11px] text-gray-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} ZEZ Automation Corporation. All rights reserved. Registered ICT distributor in the Philippines.
          </p>
          <p className="text-gray-400 text-center md:text-right">
            Catalog prices shown are sample reference amounts. Formal quotations, project discounts, and lead times are confirmed upon RFQ submission.
          </p>
        </div>
      </div>
    </footer>
  );
};
