import React, { useEffect } from 'react';
import { 
  Printer, 
  X, 
  Building2, 
  Calendar, 
  FileCheck,
  ShieldAlert,
  Info
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

  // Manage body class for clean A4 printing without screen chrome
  useEffect(() => {
    if (rfq) {
      document.body.classList.add('print-rfq-modal-open');
    }
    return () => {
      document.body.classList.remove('print-rfq-modal-open');
    };
  }, [rfq]);

  if (!rfq) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(rfq.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const hasEstimatedTotal = typeof rfq.totalEstimatedPhp === 'number' && rfq.totalEstimatedPhp > 0;
  const refSubtotalNet = hasEstimatedTotal ? Math.round(rfq.totalEstimatedPhp! / 1.12) : 0;
  const refVatEstimate = hasEstimatedTotal ? Math.round(rfq.totalEstimatedPhp! - refSubtotalNet) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-3 sm:p-6 rfq-print-modal">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden rfq-print-card">
        {/* Top Control Bar (Screen only, hidden when printing) */}
        <div className="p-3.5 sm:p-4 bg-[#292F36] text-white flex items-center justify-between no-print border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-400" />
            <div>
              <span className="font-bold text-sm">RFQ Inquiry Acknowledgment</span>
              <span className="text-xs text-amber-300 ml-2 font-mono">[{rfq.id}]</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable RFQ Inquiry Document Sheet */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-white text-[#292F36] rfq-print-sheet print:p-0">
          {/* Header & Corporate Letterhead */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-3 sm:pb-4 border-b-2 border-gray-900">
            <div>
              <Logo size="md" variant="light" />
              <div className="mt-2 text-[11px] text-gray-600 leading-tight space-y-0.5">
                <p className="font-bold text-gray-900">{siteSettings.companyName}</p>
                <p>Regional Centers: Davao City & Zamboanga City Hubs</p>
                <p>Head Office: {siteSettings.officeAddress}</p>
                <p>Phone: {siteSettings.phonePrimary} · Email: {siteSettings.emailSales}</p>
                <p>Web: https://zez.zigmatech.shop</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-block bg-[#292F36] print:bg-black text-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded mb-1.5">
                Request for Quotation (RFQ) Acknowledgment
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-[#B5121B]">
                {rfq.id}
              </div>
              <div className="text-[11px] text-gray-600 mt-1 space-y-0.5">
                <p><strong>Submission Date:</strong> {formattedDate}</p>
                <p>
                  <strong>Review Status:</strong>{' '}
                  <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {rfq.status === 'New' || rfq.status === 'Under Review'
                      ? `${rfq.status} · Pending Engineering Review`
                      : rfq.status}
                  </span>
                </p>
                <p>
                  <strong>Assigned Desk:</strong>{' '}
                  <span>{rfq.assignedSpecialist || 'Corporate Sales Engineering Desk'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Important Distinction Notice (Req 6) */}
          <div className="my-2.5 print:my-2 p-2.5 print:p-2 bg-amber-50/80 print:bg-gray-50 border border-amber-300 print:border-gray-300 rounded text-[10.5px] print:text-[10px] text-gray-700 leading-relaxed">
            <div className="flex items-start gap-1.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 no-print" />
              <div>
                <span className="font-bold text-amber-900 print:text-gray-900 uppercase tracking-wide">
                  Procurement Inquiry Notice:
                </span>{' '}
                This document acknowledges receipt of an inbound customer Request for Quotation (RFQ) for technical evaluation and bill-of-materials assessment. It is <strong className="text-gray-900">not</strong> an official sales quotation, binding price offer, credit line agreement, or delivery guarantee. Certified project pricing, volume rebates, warranty terms, and delivery schedules will be formally provided in an official ZEZ Sales Quotation.
              </div>
            </div>
          </div>

          {/* Customer & Procurement Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-2.5 print:my-2 p-3 print:p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs">
            <div>
              <div className="text-[10.5px] font-bold text-gray-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#B5121B]" />
                <span>Customer & Company Profile</span>
              </div>
              <div className="space-y-0.5 text-[11px] text-gray-700">
                <p className="font-bold text-sm text-gray-900">{rfq.customer.companyName || 'Corporate Client Account'}</p>
                <p><strong>Contact Person:</strong> {rfq.customer.fullName}</p>
                <p><strong>Email Address:</strong> {rfq.customer.email}</p>
                <p><strong>Mobile / Phone:</strong> {rfq.customer.mobileNumber}</p>
                {rfq.customer.tinNumber && <p><strong>Customer TIN:</strong> {rfq.customer.tinNumber}</p>}
                <p><strong>Account Classification:</strong> {rfq.customer.customerType}</p>
              </div>
            </div>

            <div>
              <div className="text-[10.5px] font-bold text-gray-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-[#B5121B]" />
                <span>Procurement & Logistics Requirements</span>
              </div>
              <div className="space-y-0.5 text-[11px] text-gray-700">
                <p><strong>Delivery Location:</strong> {rfq.customer.deliveryCityProvince}</p>
                {rfq.customer.deliveryAddress && (
                  <p><strong>Site Address:</strong> {rfq.customer.deliveryAddress}</p>
                )}
                <p><strong>Preferred Contact:</strong> {rfq.customer.preferredContactMethod}</p>
                {rfq.customer.targetDeliveryDate && (
                  <p><strong>Target Timeline:</strong> {rfq.customer.targetDeliveryDate}</p>
                )}
                {rfq.assignedSpecialist && (
                  <p><strong>Specialist Assigned:</strong> {rfq.assignedSpecialist}</p>
                )}
              </div>
            </div>
          </div>

          {/* Itemized Specification Table */}
          <div className="my-2.5 print:my-2 overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200">
              <thead className="bg-[#292F36] text-white">
                <tr>
                  <th className="py-2 px-2.5 font-semibold text-center w-8">#</th>
                  <th className="py-2 px-2.5 font-semibold w-28">Brand / Model</th>
                  <th className="py-2 px-2.5 font-semibold">Requested Product & Specifications</th>
                  <th className="py-2 px-2.5 font-semibold text-center w-14">Qty</th>
                  <th className="py-2 px-2.5 font-semibold text-right w-28">Ref Price (PHP)</th>
                  <th className="py-2 px-2.5 font-semibold text-right w-28">Est Subtotal (PHP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rfq.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50">
                    <td className="py-2 px-2.5 font-mono text-gray-500 text-center">{index + 1}</td>
                    <td className="py-2 px-2.5">
                      <span className="font-bold text-[#B5121B] block">{getDisplayBrand(item.brand)}</span>
                      <span className="font-mono text-[11px] text-gray-600">{item.model}</span>
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="font-semibold text-gray-900">{item.productName}</div>
                      <div className="font-mono text-[10px] text-gray-500">SKU: {item.sku}</div>
                      {item.notes && (
                        <div className="text-[10px] text-gray-600 italic mt-0.5">Requester Notes: {item.notes}</div>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-center font-bold text-gray-900">{item.quantity}</td>
                    <td className="py-2 px-2.5 text-right font-mono text-gray-700">
                      {item.unitPricePhp ? `₱${item.unitPricePhp.toLocaleString()}` : 'Subject to Quote'}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono font-bold text-gray-900">
                      {item.subtotalPhp ? `₱${item.subtotalPhp.toLocaleString()}` : 'Subject to Quote'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Procurement Notes (Avoid breaking across pages) */}
          <div className="print-avoid-break">
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2.5 border-t border-gray-200">
              <div className="text-xs text-gray-600 space-y-1 max-w-sm">
                <p className="font-bold text-gray-900 text-[11px]">Commercial Notes & Requirements:</p>
                <p className="italic text-gray-500 text-[11px] bg-gray-50 p-2 rounded border border-gray-200">
                  {rfq.customer.additionalRequirements || 'Standard corporate delivery terms requested.'}
                </p>
                {rfq.adminNotes && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[10.5px]">
                    <strong>Specialist Remarks:</strong> {rfq.adminNotes}
                  </div>
                )}
              </div>

              <div className="w-full sm:w-72 space-y-1.5 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1">
                  Estimated Reference Summary
                </div>
                {hasEstimatedTotal ? (
                  <>
                    <div className="flex justify-between text-gray-600 text-[11px]">
                      <span>Ref Subtotal (Net of VAT):</span>
                      <span className="font-mono font-semibold">₱{refSubtotalNet.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 text-[11px]">
                      <span>Indicative EVAT (12%):</span>
                      <span className="font-mono font-semibold">₱{refVatEstimate.toLocaleString()}</span>
                    </div>
                    <div className="pt-1.5 border-t border-gray-300 flex justify-between text-xs font-extrabold text-[#B5121B]">
                      <span>Estimated Reference Total:</span>
                      <span className="font-mono text-sm">₱{rfq.totalEstimatedPhp!.toLocaleString()}</span>
                    </div>
                    <p className="text-[9.5px] text-gray-500 italic mt-1">
                      *Subject to engineering verification, volume discounting, and formal quotation.
                    </p>
                  </>
                ) : (
                  <div className="py-2 text-center text-gray-600">
                    <p className="font-bold text-[11px] text-gray-800">Custom Project Pricing</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Formal pricing will be provided upon engineering review.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Procurement Inquiry Notes & Conditions */}
            <div className="mt-3 print:mt-2 pt-2.5 print:pt-2 border-t border-gray-200 text-[10px] text-gray-600 space-y-1">
              <h5 className="font-bold text-gray-800 uppercase text-[10.5px]">
                Procurement Inquiry Notes & Assessment Guidelines
              </h5>
              <ol className="list-decimal pl-4 space-y-0.5 leading-relaxed">
                <li>
                  <strong>Technical Review:</strong> Submitted bill of materials and technical specifications are reviewed by ZEZ application engineers to verify compatibility, voltage standards, and regional availability.
                </li>
                <li>
                  <strong>Official Quotation Issuance:</strong> A formal, signed ZEZ Sales Quotation detailing binding project pricing, approved payment terms, and delivery schedules will be issued upon engineering clearance.
                </li>
                <li>
                  <strong>Pricing & VAT Determination:</strong> Any catalogue references or list figures are non-binding estimates and subject to project scale, volume discounting, and official VAT invoicing.
                </li>
                <li>
                  <strong>Engineering Consultations:</strong> For urgent bidding tenders, customized automation panels, or technical datasheets, please coordinate directly with the ZEZ Corporate Sales Engineering Hub.
                </li>
              </ol>

              {/* Signatures / Acknowledgments */}
              <div className="grid grid-cols-2 gap-8 pt-4 mt-3">
                <div className="border-t border-gray-400 pt-1.5 text-center">
                  <p className="font-bold text-gray-800 text-[11px]">
                    {rfq.customer.companyName || rfq.customer.fullName}
                  </p>
                  <p className="text-[10px] text-gray-500">Submitted By (Procurement Requester)</p>
                  <p className="text-[9.5px] text-gray-400 font-mono">Date: {formattedDate}</p>
                </div>
                <div className="border-t border-gray-400 pt-1.5 text-center">
                  <p className="font-bold text-gray-800 text-[11px]">ZEZ Automation Corporation</p>
                  <p className="text-[10px] text-gray-500">Received By (Sales Engineering Hub)</p>
                  <p className="text-[9.5px] text-gray-400 font-mono">Status: Acknowledged & In Review</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar (Screen only, hidden when printing) */}
        <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between no-print">
          <p className="text-xs text-gray-500">
            Inquiry Ref: <strong>{rfq.id}</strong> · Need modifications? Contact us at <strong>{siteSettings.phonePrimary}</strong>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Slip</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
