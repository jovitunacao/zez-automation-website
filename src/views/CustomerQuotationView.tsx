import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Printer, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Building2, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  AlertCircle, 
  ShieldCheck, 
  Loader2,
  Check,
  Send
} from 'lucide-react';
import { Quotation } from '../types';
import { fetchPublicQuotation, submitCustomerQuotationResponse } from '../services/quotationService';
import { Logo } from '../components/brand/Logo';
import { useApp } from '../context/AppContext';

interface CustomerQuotationViewProps {
  token: string;
  quotationId?: string;
}

export const CustomerQuotationView: React.FC<CustomerQuotationViewProps> = ({ token, quotationId }) => {
  const { siteSettings, setActiveView } = useApp();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Response Form State
  const [responseModal, setResponseModal] = useState<'accept' | 'decline' | 'revision' | null>(null);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [clientPoNumber, setClientPoNumber] = useState('');
  const [responseNotes, setResponseNotes] = useState('');
  const [responseSuccessMessage, setResponseSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadQuote = async () => {
      setLoading(true);
      setError(null);
      const res = await fetchPublicQuotation(token);
      setLoading(false);
      if (res.success && res.quotation) {
        setQuotation(res.quotation);
      } else {
        setError(res.error || 'The requested quotation link is invalid or has expired.');
      }
    };

    if (token) {
      loadQuote();
    } else {
      setLoading(false);
      setError('Missing quotation access token.');
    }
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const handleSubmitResponse = async (type: 'Accepted' | 'Declined' | 'Revision Requested') => {
    if (!quotation) return;

    setSubmittingResponse(true);
    const res = await submitCustomerQuotationResponse(
      token,
      type,
      responseNotes,
      clientPoNumber
    );
    setSubmittingResponse(false);

    if (res.success) {
      setQuotation({
        ...quotation,
        status: type === 'Accepted' ? 'Accepted' : type === 'Declined' ? 'Declined' : 'Under Review' as any,
        customerResponse: type,
        customerResponseAt: new Date().toISOString(),
        customerResponseNotes: responseNotes,
        clientPoNumber: clientPoNumber || quotation.clientPoNumber
      });
      setResponseModal(null);
      setResponseSuccessMessage(
        type === 'Accepted'
          ? 'Quotation successfully accepted! Our sales engineering team has been notified and will proceed with order fulfillment.'
          : type === 'Revision Requested'
          ? 'Revision request submitted! Our corporate account specialist will review your notes and issue an updated revision.'
          : 'Thank you for your feedback. The quotation has been marked as declined.'
      );
    } else {
      alert(`Error submitting response: ${res.error || 'Please try again.'}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#B5121B] animate-spin mx-auto" />
        <h2 className="text-lg font-bold text-gray-800">Loading Official Commercial Quotation</h2>
        <p className="text-xs text-gray-500">Authenticating secure client token with ZEZ Automation servers...</p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-[#B5121B] flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Quotation Link Expired or Not Found</h2>
        <p className="text-xs text-gray-600 leading-relaxed">
          {error || 'This quotation link is either invalid, expired, or has been revoked. Please contact your ZEZ sales engineer for an updated copy.'}
        </p>
        <div className="pt-2">
          <button
            onClick={() => setActiveView('home')}
            className="px-4 py-2 bg-[#B5121B] text-white text-xs font-bold rounded-lg hover:bg-[#8F1018] transition-colors"
          >
            Return to ZEZ Homepage
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(quotation.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedValidUntil = new Date(quotation.validUntil).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-[#292F36] text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 no-print shadow-md">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-bold text-sm">Official Commercial Quotation</span>
            <span className="font-mono text-xs font-bold text-red-300">[{quotation.id} Rev {quotation.revisionNumber}]</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
              quotation.status === 'Accepted' ? 'bg-emerald-600' :
              quotation.status === 'Declined' ? 'bg-red-600' :
              quotation.status === 'Sent' || quotation.status === 'Approved' ? 'bg-blue-600' : 'bg-gray-700'
            }`}>
              {quotation.status}
            </span>
          </div>
          <p className="text-xs text-gray-300">
            Issued to <strong>{quotation.customerCompanyName || quotation.customerFullName}</strong> · Valid until {formattedValidUntil}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save PDF</span>
          </button>

          {quotation.status !== 'Accepted' && quotation.status !== 'Declined' && (
            <button
              onClick={() => setResponseModal('accept')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Conforme / Accept</span>
            </button>
          )}
        </div>
      </div>

      {responseSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-start gap-3 shadow-2xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-emerald-900">Response Recorded</h4>
            <p>{responseSuccessMessage}</p>
          </div>
        </div>
      )}

      {/* Main Quotation Sheet */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10 text-xs text-[#292F36]">
        {/* Letterhead */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b-2 border-gray-900">
          <div>
            <Logo size="lg" variant="light" />
            <div className="mt-3 text-xs text-gray-600 space-y-0.5">
              <p className="font-bold text-gray-900">{siteSettings.companyName}</p>
              <p>Regional Operations: Davao City & Zamboanga City Hubs</p>
              <p>Corporate Office: {siteSettings.officeAddress}</p>
              <p>Phone: {siteSettings.phonePrimary} · Secondary: {siteSettings.phoneSecondary}</p>
              <p>Email: {siteSettings.emailSales} · Web: https://zez.zigmatech.shop</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="inline-block bg-[#B5121B] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded mb-2">
              Official Quotation
            </div>
            <div className="text-xl font-black font-mono text-[#B5121B]">
              {quotation.id}
            </div>
            <div className="text-xs text-gray-500 font-mono">
              Revision: <strong>Rev {quotation.revisionNumber}</strong>
            </div>
            <div className="text-xs text-gray-600 mt-2 space-y-0.5">
              <p><strong>Date Issued:</strong> {formattedDate}</p>
              <p><strong>Valid Until:</strong> {formattedValidUntil} ({quotation.validityDays} Days)</p>
              <p><strong>Specialist:</strong> {quotation.assignedSpecialist || 'Corporate Account Specialist'}</p>
            </div>
          </div>
        </div>

        {/* Customer & Commercial Terms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs">
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#B5121B]" />
              <span>Customer Information</span>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-sm text-gray-900">{quotation.customerCompanyName || quotation.customerFullName}</p>
              <p><strong>Attention:</strong> {quotation.customerFullName}</p>
              <p><strong>Email:</strong> {quotation.customerEmail}</p>
              {quotation.customerMobileNumber && <p><strong>Mobile:</strong> {quotation.customerMobileNumber}</p>}
              {quotation.tinNumber && <p><strong>Customer TIN:</strong> {quotation.tinNumber}</p>}
              {quotation.clientPoNumber && <p><strong>Purchase Order Ref:</strong> {quotation.clientPoNumber}</p>}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-[#B5121B]" />
              <span>Commercial Terms</span>
            </div>
            <div className="space-y-1">
              <p><strong>Delivery Location:</strong> {quotation.deliveryCityProvince || 'As designated'}</p>
              {quotation.deliveryAddress && <p><strong>Site Address:</strong> {quotation.deliveryAddress}</p>}
              <p><strong>Payment Terms:</strong> {quotation.paymentTerms}</p>
              <p><strong>Delivery Lead Time:</strong> {quotation.leadTimeDescription}</p>
              <p><strong>Warranty Coverage:</strong> {quotation.warrantyTerms}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="my-6 overflow-x-auto">
          <table className="w-full text-left text-xs border border-gray-200">
            <thead className="bg-[#292F36] text-white">
              <tr>
                <th className="py-2.5 px-3 font-semibold text-center w-8">#</th>
                <th className="py-2.5 px-3 font-semibold">Equipment / Item Description</th>
                <th className="py-2.5 px-3 font-semibold text-center w-14">Qty</th>
                <th className="py-2.5 px-3 font-semibold text-right w-28">Unit Price (PHP)</th>
                <th className="py-2.5 px-3 font-semibold text-center w-20">Disc (%)</th>
                <th className="py-2.5 px-3 font-semibold text-right w-32">Total (PHP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotation.items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50/50">
                  <td className="py-2.5 px-3 font-mono text-gray-500 text-center">{index + 1}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-gray-900">{item.productName}</div>
                    <div className="text-[11px] text-gray-600">
                      {item.brand && <span className="text-[#B5121B] font-semibold mr-1">{item.brand}</span>}
                      {item.model && <span>Model: {item.model}</span>}
                      {item.sku && <span className="font-mono text-gray-400 ml-1.5">[{item.sku}]</span>}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-gray-900">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                    ₱{Number(item.unitPricePhp).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-gray-600">
                    {item.discountPercent ? `${item.discountPercent}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                    ₱{Number(item.lineTotalPhp).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-600 space-y-1.5 max-w-sm">
            <p className="font-bold text-gray-900">Scope Remarks & Delivery Notes:</p>
            <p className="italic text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-200">
              {quotation.specialInstructions || 'Standard supply and delivery terms. Equipment factory warranty applies.'}
            </p>
          </div>

          <div className="w-full sm:w-80 space-y-2 text-xs bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">
                ₱{quotation.subtotalPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {quotation.discountAmountPhp > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Special Project Discount:</span>
                <span className="font-mono font-semibold">
                  -₱{quotation.discountAmountPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="flex justify-between text-gray-600">
              <span>Net of VAT:</span>
              <span className="font-mono font-semibold">
                ₱{quotation.netOfVatPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Value Added Tax (12% EVAT):</span>
              <span className="font-mono font-semibold">
                {quotation.vatAmountPhp > 0
                  ? `₱${quotation.vatAmountPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'Zero-Rated / Exempt'}
              </span>
            </div>

            {quotation.deliveryFeePhp > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Freight & Delivery:</span>
                <span className="font-mono font-semibold">
                  ₱{quotation.deliveryFeePhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="pt-2 border-t-2 border-gray-300 flex justify-between text-sm font-extrabold text-[#B5121B]">
              <span>Grand Total (PHP):</span>
              <span className="font-mono text-base">
                ₱{quotation.grandTotalPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP
              </span>
            </div>
          </div>
        </div>

        {/* Customer Conforme Action Area */}
        <div className="mt-8 pt-6 border-t border-gray-200 no-print">
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-bold text-gray-900 text-sm">Quotation Electronic Conforme</h4>
              <p className="text-gray-500 text-xs">
                To approve this proposal and initiate dispatch, please confirm acceptance or request alterations.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setResponseModal('revision')}
                className="px-3.5 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold rounded-lg text-xs transition-colors"
              >
                Request Revision
              </button>
              <button
                type="button"
                onClick={() => setResponseModal('decline')}
                className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-lg text-xs transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => setResponseModal('accept')}
                className="px-4 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Accept Quotation</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Response Modal */}
      {responseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900">
                {responseModal === 'accept' ? 'Accept Quotation & Conforme' :
                 responseModal === 'revision' ? 'Request Quotation Revision' :
                 'Decline Quotation'}
              </h3>
              <button onClick={() => setResponseModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {responseModal === 'accept' && (
              <div className="space-y-3">
                <p className="text-gray-600 leading-relaxed">
                  By clicking accept, you authorize ZEZ Automation Corporation to prepare equipment delivery and issue the formal Sales Invoice for <strong>₱{quotation.grandTotalPhp.toLocaleString()} PHP</strong> under agreed payment terms.
                </p>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Client PO Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-9912"
                    value={clientPoNumber}
                    onChange={(e) => setClientPoNumber(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Additional Conforme Notes (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Delivery contact person on site is Mr. Santos..."
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            )}

            {responseModal === 'revision' && (
              <div className="space-y-3">
                <p className="text-gray-600 leading-relaxed">
                  Please let us know what modifications, quantity changes, or technical specifications you need updated. Our account engineers will prepare a revised version.
                </p>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Revision Notes *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Specify which items or quantities need adjustment..."
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            )}

            {responseModal === 'decline' && (
              <div className="space-y-3">
                <p className="text-gray-600 leading-relaxed">
                  We appreciate your consideration. Please indicate the reason for declining so we can better serve your technology needs in the future.
                </p>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Reason for Declining</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Project deferred, alternative sourcing selected, budget constraints..."
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setResponseModal(null)}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingResponse || (responseModal === 'revision' && !responseNotes.trim())}
                onClick={() => {
                  if (responseModal === 'accept') handleSubmitResponse('Accepted');
                  else if (responseModal === 'revision') handleSubmitResponse('Revision Requested');
                  else if (responseModal === 'decline') handleSubmitResponse('Declined');
                }}
                className={`px-4 py-2 font-bold rounded-lg text-white flex items-center gap-1.5 ${
                  responseModal === 'accept' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  responseModal === 'decline' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-[#B5121B] hover:bg-[#8F1018]'
                }`}
              >
                {submittingResponse && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {responseModal === 'accept' ? 'Confirm Acceptance' :
                   responseModal === 'revision' ? 'Send Revision Request' :
                   'Confirm Decline'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
