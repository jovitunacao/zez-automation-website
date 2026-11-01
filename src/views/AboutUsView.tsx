import React from 'react';
import { 
  Building2, 
  Target, 
  Compass, 
  ShieldCheck, 
  Truck, 
  Cpu, 
  Users, 
  Award,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AboutUsView: React.FC = () => {
  const { setActiveView, siteSettings } = useApp();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner */}
      <div className="bg-[#292F36] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-4 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#B5121B] bg-white/10 px-3 py-1 rounded">
            Corporate Profile
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            ZEZ Automation Corporation
          </h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            Powering Philippine businesses, educational campuses, government agencies, and general contractors through dependable, enterprise-grade ICT hardware distribution and technology solutions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
        {/* Company Story & Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-gray-700 text-xs sm:text-sm leading-relaxed">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
                Who We Are
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292F36]">
                Your Established Philippine Technology Sourcing Partner
              </h2>
            </div>

            <p>
              ZEZ Automation Corporation was established with a singular mission: to eliminate friction in business-to-business ICT equipment acquisition. Headquartered in Metro Manila's bustling Ortigas business district, we bridge top-tier international hardware manufacturers with Philippine organizations.
            </p>

            <p>
              Whether configuring high-density data center core switches, rolling out structured Cat6A copper trunks, safeguarding campus perimeters with AI-enabled CCTV surveillance, or supplying heavy-duty uninterruptible power systems (UPS), ZEZ provides reliable commercial sourcing, transparent billing, and dedicated pre-sales engineering.
            </p>

            <div className="pt-2 grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="text-2xl font-black text-[#B5121B]">100%</span>
                <p className="text-gray-900 font-bold">Factory-Sealed Hardware</p>
                <p className="text-gray-500 font-normal">Authentic products with valid warranty registrations.</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="text-2xl font-black text-[#B5121B]">24h</span>
                <p className="text-gray-900 font-bold">Pro-Forma SLA</p>
                <p className="text-gray-500 font-normal">Quick itemized turnaround on business RFQ inquiries.</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200">
            <img
              src="https://images.unsplash.com/photo-1544197150-199123fa6d8d?auto=format&fit=crop&w=1000&q=80"
              alt="ZEZ Automation Technology Distribution Infrastructure"
              className="w-full h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#292F36]/80 via-transparent to-transparent flex items-end p-6 text-white">
              <div>
                <span className="text-xs font-mono text-red-300">Ortigas Center Central Depot</span>
                <p className="text-sm font-bold">Fast Metro Manila and Nationwide Regional Logistics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-[#B5121B] flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#292F36]">Our Mission</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              To empower Philippine enterprises and institutions with authentic, reliable, and competitively-priced ICT supplies and hardware solutions, backed by transparent corporate service and technical excellence.
            </p>
          </div>

          <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-[#B5121B] flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#292F36]">Our Vision</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              To be recognized as the premier and most trustworthy B2B technology supplies distributor in the Philippines, fostering sustainable digital transformation across industries.
            </p>
          </div>
        </div>

        {/* Industries Served */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
              Market Sectors
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292F36]">
              Industries We Power Across the Philippines
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#B5121B] flex items-center justify-center mx-auto">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-gray-900">BPO & Contact Centers</h4>
              <p className="text-[11px] text-gray-500">24/7 Redundant switches & workstations</p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#B5121B] flex items-center justify-center mx-auto">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-gray-900">General Contractors</h4>
              <p className="text-[11px] text-gray-500">Structured cabling & server racks</p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#B5121B] flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-gray-900">Hospitality & Resorts</h4>
              <p className="text-[11px] text-gray-500">Wi-Fi 6 APs & perimeter CCTV</p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#B5121B] flex items-center justify-center mx-auto">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-gray-900">Government & LGUs</h4>
              <p className="text-[11px] text-gray-500">PHILGEPS compliant quotes & billing</p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#B5121B] flex items-center justify-center mx-auto">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-gray-900">Schools & Universities</h4>
              <p className="text-[11px] text-gray-500">Campus labs, networking & laser printers</p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#B5121B] flex items-center justify-center mx-auto">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-gray-900">Logistics & Warehouses</h4>
              <p className="text-[11px] text-gray-500">Rugged terminals & long-range wireless</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#292F36] text-white rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-bold">Partner with ZEZ Automation Today</h3>
            <p className="text-xs sm:text-sm text-gray-300">
              Submit your technology procurement list or meet with our account executives.
            </p>
          </div>
          <button
            onClick={() => setActiveView('rfq')}
            className="px-6 py-3 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <span>Request a Corporate Quotation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
