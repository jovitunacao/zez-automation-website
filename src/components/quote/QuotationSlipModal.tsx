import React from 'react';
import { 
  Printer, 
  Download, 
  X, 
  CheckCircle, 
  Building2, 
  Calendar, 
  Clock, 
  FileCheck,
  ShieldCheck,
  Phone,
  Mail
} from 'lucide-react';
import { QuotationRequest } from '../../types';
import { Logo } from '../brand/Logo';
import { useApp } from '../../context/AppContext';
import { getDisplayBrand } from '../../utils/productUtils';

interface QuotationSlipModalProps {
  rfq: QuotationRequest | null;
  onClose: () => void;
}

export const QuotationSlipModal: React.FC<QuotationSlipModalProps> = ({ rfq, onClose }) => {
  const { siteSettings } = useApp();

  if (!rfq) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(rfq.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedValidUntil = new Date(rfq.validUntil).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-4 sm:p-6">
      {/* Top action bar (hidden during print) */}
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Controls Bar */}
        <div className="p-4 bg-[#292F36] text-white flex items-center justify-between no-print border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-bold text-sm">Official Request for Quotation Document</span>
              <span className="text-xs text-gray-400 ml-2 font-mono">[{rfq.id}]</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Quotation Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-[#292F36] print:p-0">
          {/* Header & Letterhead */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b-2 border-gray-900">
            <div>
              <Logo size="lg" variant="light" />
              <div className="mt-3 text-xs text-gray-600 space-y-0.5">
                <p className="font-semibold text-gray-900">{siteSettings.companyName}</p>
                <p>{siteSettings.officeAddress}</p>
                <p>Phone: {siteSettings.phonePrimary} · Email: {siteSettings.emailSales}</p>
                <p>Web: https://zez.zigmatech.shop</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-block bg-[#B5121B] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded mb-2">
                Pro-Forma Quotation Slip
              </div>
              <div className="text-lg font-black font-mono text-[#B5121B]">
                {rfq.id}
              </div>
              <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                <p><strong>Date Issued:</strong> {formattedDate}</p>
                <p><strong>Valid Until:</strong> {formattedValidUntil} (30 Days)</p>
                <p><strong>Status:</strong> <span className="font-semibold text-emerald-700">{rfq.status}</span></p>
              </div>
            </div>
          </div>

          {/* Client & Shipping Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs">
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#B5121B]" />
                <span>Customer & Company Details</span>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-gray-900">{rfq.customer.companyName || 'Individual Enterprise Account'}</p>
                <p><strong>Attention:</strong> {rfq.customer.fullName}</p>
                <p><strong>Email:</strong> {rfq.customer.email}</p>
                <p><strong>Mobile:</strong> {rfq.customer.mobileNumber}</p>
                {rfq.customer.tinNumber && <p><strong>Customer TIN:</strong> {rfq.customer.tinNumber}</p>}
                <p><strong>Account Type:</strong> {rfq.customer.customerType}</p>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-[#B5121B]" />
                <span>Procurement Specifications</span>
              </div>
              <div className="space-y-1">
                <p><strong>Delivery Location:</strong> {rfq.customer.deliveryCityProvince}</p>
                {rfq.customer.deliveryAddress && (
                  <p><strong>Address:</strong> {rfq.customer.deliveryAddress}</p>
                )}
                <p><strong>Preferred Contact:</strong> {rfq.customer.preferredContactMethod}</p>
                {rfq.customer.targetDeliveryDate && (
                  <p><strong>Target Timeline:</strong> {rfq.customer.targetDeliveryDate}</p>
                )}
                {rfq.assignedSpecialist && (
                  <p><strong>Assigned Engineer:</strong> {rfq.assignedSpecialist}</p>
                )}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="my-6 overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200">
              <thead className="bg-[#292F36] text-white">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">#</th>
                  <th className="py-2.5 px-3 font-semibold">Brand / Model</th>
                  <th className="py-2.5 px-3 font-semibold">Product Description & SKU</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Qty</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Unit Price (PHP)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Subtotal (PHP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rfq.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50">
                    <td className="py-3 px-3 font-mono text-gray-500">{index + 1}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-[#B5121B] block">{getDisplayBrand(item.brand)}</span>
                      <span className="font-mono text-[11px] text-gray-600">{item.model}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">{item.productName}</div>
                      <div className="font-mono text-[10px] text-gray-500">SKU: {item.sku}</div>
                      {item.notes && (
                        <div className="text-[10px] text-gray-600 italic mt-0.5">Note: {item.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-900">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono text-gray-700">
                      {item.unitPricePhp ? `₱${item.unitPricePhp.toLocaleString()}` : 'For Project Pricing'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                      {item.subtotalPhp ? `₱${item.subtotalPhp.toLocaleString()}` : 'TBD'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Financial Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-600 space-y-1 max-w-sm">
              <p className="font-bold text-gray-900">Commercial Notes & Requirements:</p>
              <p className="italic text-gray-500">
                {rfq.customer.additionalRequirements || 'Standard corporate delivery terms requested.'}
              </p>
              {rfq.adminNotes && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 mt-2">
                  <strong>Specialist Remarks:</strong> {rfq.adminNotes}
                </div>
              )}
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (Net of VAT):</span>
                <span className="font-mono font-semibold">
                  {rfq.totalEstimatedPhp && rfq.totalEstimatedPhp > 0 
                    ? `₱${Math.round(rfq.totalEstimatedPhp / 1.12).toLocaleString()}` 
                    : 'To be determined (B2B)'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Value Added Tax (12% EVAT):</span>
                <span className="font-mono font-semibold">
                  {rfq.totalEstimatedPhp && rfq.totalEstimatedPhp > 0 
                    ? `₱${Math.round(rfq.totalEstimatedPhp - (rfq.totalEstimatedPhp / 1.12)).toLocaleString()}` 
                    : 'Included in formal quote'}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-300 flex justify-between text-sm font-extrabold text-[#B5121B]">
                <span>Total Estimated (PHP):</span>
                <span className="font-mono text-base">
                  {rfq.totalEstimatedPhp && rfq.totalEstimatedPhp > 0 
                    ? `₱${rfq.totalEstimatedPhp.toLocaleString()}` 
                    : 'Price on Request'}
                </span>
              </div>
            </div>
          </div>

          {/* Standard Terms & Signatures */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-[10.5px] text-gray-500 space-y-2">
            <h5 className="font-bold text-gray-800 uppercase text-[11px]">Terms and Conditions of Quotation</h5>
            <ol className="list-decimal pl-4 space-y-1">
              <li><strong>Price Validity:</strong> Prices and stock availability indicated are valid for 30 calendar days from issue date.</li>
              <li><strong>Payment Terms:</strong> 30 Days Net upon corporate credit line approval, or Bank Transfer prior to dispatch for new accounts.</li>
              <li><strong>Warranty:</strong> All products are covered by manufacturer warranty against defects. Serial numbers are tracked upon shipment.</li>
              <li><strong>Deliveries:</strong> Standard delivery is 1-3 business days from regional hubs (Davao City & Zamboanga City) or national distribution partners.</li>
            </ol>

            <div className="grid grid-cols-2 gap-8 pt-8 mt-6">
              <div className="border-t border-gray-400 pt-2 text-center">
                <p className="font-bold text-gray-800">ZEZ Automation Corporation</p>
                <p className="text-[10px]">Authorized Corporate Sales Specialist</p>
              </div>
              <div className="border-t border-gray-400 pt-2 text-center">
                <p className="font-bold text-gray-800">{rfq.customer.companyName || rfq.customer.fullName}</p>
                <p className="text-[10px]">Conforme / Authorized Client Signatory</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between no-print">
          <p className="text-xs text-gray-500">
            Need alterations to this quote? Contact your account executive at <strong>{siteSettings.phonePrimary}</strong>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print or Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-lg transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
