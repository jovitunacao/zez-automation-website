import React from 'react';
import { 
  ShieldCheck, 
  Wrench, 
  ArrowRight, 
  FileText, 
  Phone, 
  ExternalLink,
  Flame,
  CheckCircle2,
  HardHat,
  Cpu,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ENGINEERING_SERVICES } from '../data/services';

export const ServicesView: React.FC = () => {
  const { setActiveView, siteSettings } = useApp();

  return (
    <div className="space-y-16 pb-20">
      {/* Services Header Banner */}
      <section className="relative bg-[#292F36] text-white py-16 px-4 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#B5121B_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#B5121B]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B5121B] flex items-center gap-1.5">
              <HardHat className="w-4 h-4" />
              <span>Engineering & Installation Services</span>
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Enterprise Technology Infrastructure & Mechanical Works
            </h1>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              In addition to B2B equipment supply and distribution, ZEZ Automation Corporation provides complete engineering contracting, installation, testing, and commissioning across the Philippines.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveView('rfq')}
                className="px-5 py-2.5 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs sm:text-sm font-bold rounded-lg flex items-center gap-2 shadow-md transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Request Project Quotation</span>
              </button>
              <button
                onClick={() => setActiveView('contact')}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold rounded-lg border border-white/20 transition-colors"
              >
                <span>Consult Our Engineering Team</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid (7 Exact Services) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292F36]">
            Our Core Engineering & Systems Disciplines
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            Turnkey execution backed by verified equipment brands, structured installation methodologies, and rigorous compliance with safety standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ENGINEERING_SERVICES.map((service, idx) => (
            <div
              key={service.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#B5121B] transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Service Photograph */}
                <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.endsWith('/categories/category-fallback.svg')) {
                        target.src = '/categories/category-fallback.svg';
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    0{idx + 1}
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 block">
                      {service.shortName}
                    </span>
                    <h3 className="font-bold text-base sm:text-lg leading-snug">{service.name}</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-2">
                      Key Deliverables:
                    </h4>
                    <ul className="space-y-1.5">
                      {service.deliverables.map((item, dIdx) => (
                        <li key={dIdx} className="text-xs text-gray-600 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#B5121B] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveView('rfq')}
                  className="flex-1 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Request Scope Quote</span>
                </button>
                <a
                  href={service.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="View services reference on zigmatech.shop"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integration Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-[#292F36] text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
              Integrated Supply & Installation
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold">
              Need Both Equipment Supply and Professional Installation?
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Consolidate procurement by bundling certified hardware with our deployment services. Our account executives provide comprehensive Bill of Quantities (BOQ) with official BIR documentation.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
            <button
              onClick={() => setActiveView('rfq')}
              className="w-full sm:w-auto px-6 py-3 bg-[#B5121B] hover:bg-[#8F1018] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Submit Project RFQ</span>
            </button>
            <button
              onClick={() => setActiveView('contact')}
              className="w-full sm:w-auto px-6 py-3 bg-white text-gray-900 hover:bg-gray-100 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>Contact Engineering</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
