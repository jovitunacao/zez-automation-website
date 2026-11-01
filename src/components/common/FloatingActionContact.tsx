import React, { useState } from 'react';
import { 
  PhoneCall, 
  Mail, 
  MessageSquare, 
  FileText, 
  X, 
  ChevronUp,
  Headphones
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FloatingActionContact: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { siteSettings, setIsQuoteDrawerOpen, quoteCart } = useApp();

  const totalCartCount = quoteCart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-2 no-print">
      {/* Quick menu options */}
      {isOpen && (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-3 w-64 space-y-2 mb-2 animate-fadeIn text-xs">
          <div className="p-2 bg-[#292F36] text-white rounded-lg">
            <p className="font-bold">ZEZ Corporate Sales Desk</p>
            <p className="text-[10px] text-gray-300">Fast B2B Response & Project Pricing</p>
          </div>

          <a
            href={`tel:${siteSettings.phonePrimary.replace(/[^0-9+]/g, '')}`}
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 text-gray-800 transition-colors font-semibold"
          >
            <div className="w-7 h-7 rounded bg-red-50 text-[#B5121B] flex items-center justify-center shrink-0">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-normal">Call Sales Hotline</p>
              <p className="text-xs font-bold text-[#292F36]">{siteSettings.phonePrimary}</p>
            </div>
          </a>

          <a
            href={`mailto:${siteSettings.emailSales}?subject=B2B%20Equipment%20Procurement%20Inquiry`}
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 text-gray-800 transition-colors font-semibold"
          >
            <div className="w-7 h-7 rounded bg-red-50 text-[#B5121B] flex items-center justify-center shrink-0">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-normal">Direct Corporate Email</p>
              <p className="text-xs font-bold text-[#292F36]">{siteSettings.emailSales}</p>
            </div>
          </a>

          <a
            href={`https://wa.me/${siteSettings.mobileViber.replace(/[^0-9]/g, '')}?text=Hello%20ZEZ%20Automation,%20we%20have%20an%20ICT%20equipment%20requirement`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 text-gray-800 transition-colors font-semibold"
          >
            <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-normal">Viber / WhatsApp Inquiries</p>
              <p className="text-xs font-bold text-gray-800">{siteSettings.mobileViber}</p>
            </div>
          </a>

          <button
            onClick={() => {
              setIsOpen(false);
              setIsQuoteDrawerOpen(true);
            }}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-red-50 hover:bg-red-100 text-[#B5121B] font-bold transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Review Quotation Cart</span>
            </div>
            <span className="text-xs bg-[#B5121B] text-white px-2 py-0.5 rounded-full font-bold">
              {totalCartCount}
            </span>
          </button>
        </div>
      )}

      {/* Main trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-3 bg-[#B5121B] hover:bg-[#8F1018] text-white font-bold text-xs rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
        aria-label="Contact ZEZ Corporate Desk"
      >
        <Headphones className="w-4 h-4" />
        <span className="hidden sm:inline">B2B Corporate Desk</span>
        {isOpen ? <X className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>
    </div>
  );
};
