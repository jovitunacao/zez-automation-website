import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  FileText, 
  Printer, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RfqStatus, QuotationRequest } from '../types';

export const CustomerAccountView: React.FC = () => {
  const { 
    currentCustomer, 
    setCurrentCustomer, 
    customerRfqs, 
    rfqRequests, 
    setActiveRfqForPrint, 
    addToQuoteCart, 
    products, 
    setActiveView 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rfqs' | 'profile'>('rfqs');
  const [loginEmail, setLoginEmail] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Status badge styling helper
  const getStatusBadge = (status: RfqStatus) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Quotation Prepared':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Quotation Sent':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Declined':
      case 'Closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleReorder = (rfq: QuotationRequest) => {
    rfq.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        addToQuoteCart(product, item.quantity);
      }
    });
    setActiveView('rfq');
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  // If no customer logged in
  if (!currentCustomer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-[#B5121B] flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#292F36]">Customer Procurement Portal</h2>
          <p className="text-xs text-gray-500">
            Enter your corporate email address to access your previous RFQ quotations and company details.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!loginEmail) return;
              setCurrentCustomer({
                fullName: 'Corporate Procurement Officer',
                companyName: 'Client Enterprise Corp.',
                email: loginEmail,
                mobileNumber: '+63 917 000 0000',
                deliveryCityProvince: 'Metro Manila',
                customerType: 'Company',
                preferredContactMethod: 'Email'
              });
            }}
            className="space-y-3 pt-2 text-xs"
          >
            <input
              type="email"
              required
              placeholder="name@company.ph"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#B5121B]"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#B5121B] text-white font-bold rounded-lg hover:bg-[#8F1018] transition-colors"
            >
              Sign In to Procurement Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#292F36] text-white flex items-center justify-center font-bold text-base">
            {currentCustomer.fullName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-semibold text-[#B5121B]">
              Corporate Account
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#292F36]">
              {currentCustomer.companyName || currentCustomer.fullName}
            </h1>
            <p className="text-xs text-gray-500">
              Procurement Contact: {currentCustomer.fullName} · {currentCustomer.email}
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg text-xs font-bold">
          <button
            onClick={() => setActiveTab('rfqs')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'rfqs' ? 'bg-white text-[#B5121B] shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            RFQ Inquiries ({customerRfqs.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'profile' ? 'bg-white text-[#B5121B] shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Company Profile
          </button>
        </div>
      </div>

      {activeTab === 'rfqs' ? (
        /* RFQ History List */
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-xs text-gray-500 font-medium">Total RFQs Submitted</span>
              <div className="text-2xl font-black text-gray-900 mt-1">{customerRfqs.length}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-xs text-gray-500 font-medium">Under Review / Prepared</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {customerRfqs.filter(r => r.status === 'Under Review' || r.status === 'Quotation Prepared').length}
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-xs text-gray-500 font-medium">Accepted / PO Released</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {customerRfqs.filter(r => r.status === 'Accepted').length}
              </div>
            </div>
          </div>

          {customerRfqs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="font-bold text-gray-800">No quotation requests on file</h3>
              <p className="text-xs text-gray-500">
                You haven't submitted any RFQs yet under this email account ({currentCustomer.email}).
              </p>
              <button
                onClick={() => setActiveView('shop')}
                className="px-4 py-2 bg-[#B5121B] text-white text-xs font-bold rounded-lg"
              >
                Browse Catalog & Create RFQ
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {customerRfqs.map((rfq) => (
                <div
                  key={rfq.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4 hover:border-gray-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-[#B5121B]">{rfq.id}</span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(rfq.status)}`}>
                        {rfq.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 flex items-center gap-3">
                      <span>Submitted: <strong>{new Date(rfq.createdAt).toLocaleDateString()}</strong></span>
                      <span>·</span>
                      <span>Valid until: <strong>{rfq.validUntil}</strong></span>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-bold text-gray-700 block mb-1">
                        Equipment Requested ({rfq.items.length} items):
                      </span>
                      <ul className="space-y-1.5 text-gray-600">
                        {rfq.items.map((it, idx) => (
                          <li key={idx} className="flex items-center justify-between">
                            <span className="truncate pr-2 font-medium">
                              {it.quantity}x {it.productName} ({it.model})
                            </span>
                            <span className="font-mono font-bold text-gray-800 shrink-0">
                              {it.subtotalPhp ? `₱${it.subtotalPhp.toLocaleString()}` : 'TBD'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1 text-xs">
                      <span className="font-bold text-gray-800 block">Assigned Account Details:</span>
                      <p className="text-gray-600">
                        Specialist: <strong>{rfq.assignedSpecialist || 'Marco Rivera (Enterprise Sales Desk)'}</strong>
                      </p>
                      <p className="text-gray-600">
                        Delivery Site: <strong>{rfq.customer.deliveryCityProvince}</strong>
                      </p>
                      {rfq.adminNotes && (
                        <p className="text-amber-800 pt-1 text-[11px]">
                          <strong>Status Update:</strong> {rfq.adminNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                    <div className="text-xs">
                      <span className="text-gray-500">Estimated Total: </span>
                      <span className="font-mono font-black text-sm text-gray-900">
                        ₱{rfq.totalEstimatedPhp?.toLocaleString() || 'For Project Pricing'} PHP
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveRfqForPrint(rfq)}
                        className="px-3.5 py-1.5 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Official Pro-Forma Slip</span>
                      </button>

                      <button
                        onClick={() => handleReorder(rfq)}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                        title="Add these items to quotation cart for a new inquiry"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Re-Quote Items</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Company Profile Form */
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-2xs max-w-2xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#292F36]">Business Account & Delivery Information</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Keep your company details updated so future quotation requests autofill with pre-verified billing info.
            </p>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Company / Organization</label>
              <input
                type="text"
                value={currentCustomer.companyName}
                onChange={(e) => setCurrentCustomer({ ...currentCustomer, companyName: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Authorized Contact Officer</label>
                <input
                  type="text"
                  value={currentCustomer.fullName}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, fullName: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Company Tax ID (TIN)</label>
                <input
                  type="text"
                  value={currentCustomer.tinNumber || ''}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, tinNumber: e.target.value })}
                  placeholder="000-000-000-000"
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={currentCustomer.email}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Mobile / Viber</label>
                <input
                  type="tel"
                  value={currentCustomer.mobileNumber}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, mobileNumber: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Default Delivery Address / Depot</label>
              <textarea
                rows={2}
                value={currentCustomer.deliveryAddress || ''}
                onChange={(e) => setCurrentCustomer({ ...currentCustomer, deliveryAddress: e.target.value })}
                placeholder="Unit, Building, Street, City, Province"
                className="w-full p-2.5 border border-gray-300 rounded-lg"
              />
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
                Company profile updated successfully!
              </div>
            )}

            <button
              type="submit"
              className="py-2.5 px-5 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg transition-colors"
            >
              Save Company Information
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
