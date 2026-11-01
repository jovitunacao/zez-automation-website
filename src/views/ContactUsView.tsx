import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  Building2, 
  ShieldCheck, 
  MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ContactUsView: React.FC = () => {
  const { siteSettings, setActiveView } = useApp();

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [inquiry, setInquiry] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    department: 'Corporate Sales & Bulk Sourcing',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-12">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#B5121B]">
          Corporate Directory
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F36] mt-0.5">
          Contact ZEZ Automation Corporation
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
          Get in touch with our enterprise technology sales team, request on-site meetings, or submit your IT procurement questions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Contact Info & Depots */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6">
            <h2 className="font-bold text-base text-[#292F36] pb-3 border-b border-gray-100">
              Corporate Headquarters
            </h2>

            <div className="space-y-4 text-xs text-gray-700">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-50 text-[#B5121B] shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Pasig City Main Office & Depot</h4>
                  <p className="text-gray-600 mt-0.5 leading-relaxed">{siteSettings.officeAddress}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-50 text-[#B5121B] shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Direct Telephone Hotlines</h4>
                  <p className="text-gray-600 mt-0.5">
                    Landline: <strong className="text-gray-900">{siteSettings.phonePrimary}</strong>
                  </p>
                  <p className="text-gray-600">
                    Mobile / Viber: <strong className="text-gray-900">{siteSettings.mobileViber}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-50 text-[#B5121B] shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Email Routing</h4>
                  <p className="text-gray-600 mt-0.5">
                    Sales & RFQs: <a href={`mailto:${siteSettings.emailSales}`} className="text-[#B5121B] font-semibold hover:underline">{siteSettings.emailSales}</a>
                  </p>
                  <p className="text-gray-600">
                    RMA & Warranty: <a href={`mailto:${siteSettings.emailSupport}`} className="text-gray-900 hover:underline">{siteSettings.emailSupport}</a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-50 text-[#B5121B] shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Operational Hours</h4>
                  <p className="text-gray-600 mt-0.5">{siteSettings.operatingHours}</p>
                  <p className="text-gray-400 text-[11px]">Warehouse dispatch: 9:00 AM - 4:30 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Depots Card */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#292F36]">Nationwide Logistics Forwarding</h3>
            <p className="text-gray-600 leading-relaxed">
              In addition to Metro Manila direct couriers, we provide freight delivery via accredited shipping partners to provincial hubs:
            </p>
            <div className="space-y-2">
              <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                <span className="font-bold text-gray-900 block">Visayas Regional Sourcing:</span>
                <span className="text-gray-600">Cebu City, Iloilo, Bacolod freight forwarding available.</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                <span className="font-bold text-gray-900 block">Mindanao Logistics:</span>
                <span className="text-gray-600">Davao City, Cagayan de Oro port forwarding and door-to-door.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="pb-3 border-b border-gray-100">
            <h2 className="font-bold text-base text-[#292F36]">Send a Business Inquiry</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Fill out the form below. An enterprise sales representative will respond within 24 business hours.
            </p>
          </div>

          {formSubmitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Message Successfully Sent</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Thank you for contacting ZEZ Automation Corporation. We have routed your inquiry to our {inquiry.department} team.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setFormSubmitted(false);
                    setInquiry({
                      name: '',
                      company: '',
                      email: '',
                      phone: '',
                      department: 'Corporate Sales & Bulk Sourcing',
                      subject: '',
                      message: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Send Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Your Full Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Maria Santos"
                    value={inquiry.name}
                    onChange={(e) => setInquiry({ ...inquiry, name: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Company / Institution *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Pacific BPO Logistics Inc."
                    value={inquiry.company}
                    onChange={(e) => setInquiry({ ...inquiry, company: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Corporate Email *</label>
                  <input
                    required
                    type="email"
                    placeholder="name@company.ph"
                    value={inquiry.email}
                    onChange={(e) => setInquiry({ ...inquiry, email: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Contact Phone / Mobile *</label>
                  <input
                    required
                    type="tel"
                    placeholder="+63 9XX XXX XXXX"
                    value={inquiry.phone}
                    onChange={(e) => setInquiry({ ...inquiry, phone: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Target Department *</label>
                <select
                  value={inquiry.department}
                  onChange={(e) => setInquiry({ ...inquiry, department: e.target.value })}
                  className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white font-medium"
                >
                  <option value="Corporate Sales & Bulk Sourcing">Corporate Sales & Bulk Sourcing</option>
                  <option value="Government & PHILGEPS Procurement">Government & PHILGEPS Procurement</option>
                  <option value="Technical Presales Sizing">Technical Presales & Bill of Materials Sizing</option>
                  <option value="Warranty & RMA Service Depot">Warranty & RMA Service Depot</option>
                  <option value="Partnership & Vendor Relations">Partnership & Vendor Relations</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Requirement for 48-port Cisco PoE Switches for New Branch"
                  value={inquiry.subject}
                  onChange={(e) => setInquiry({ ...inquiry, subject: e.target.value })}
                  className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Message / Procurement Requirements</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Detail your equipment requirements, quantities, site location, or any specific brand models..."
                  value={inquiry.message}
                  onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })}
                  className="w-full p-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg focus:outline-none focus:border-[#B5121B] focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Business Inquiry</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
