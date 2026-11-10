import React from 'react';
import { 
  Printer, 
  X, 
  CheckCircle, 
  Building2, 
  Calendar, 
  Clock, 
  FileCheck,
  ShieldCheck,
  Phone,
  Mail,
  Copy,
  ExternalLink,
  Download
} from 'lucide-react';
import { Quotation } from '../../types';
import { Logo } from '../brand/Logo';
import { useApp } from '../../context/AppContext';
import { downloadQuotationPdf } from '../../services/quotationPdfService';

interface QuotationPrintViewProps {
  quotation: Quotation | null;
  onClose: () => void;
}

export const QuotationPrintView: React.FC<QuotationPrintViewProps> = ({ quotation, onClose }) => {
  const { siteSettings } = useApp();
  const [copiedLink, setCopiedLink] = React.useState(false);

  React.useEffect(() => {
    if (quotation) {
      document.body.classList.add('print-quotation-modal-open');
    }
    return () => {
      document.body.classList.remove('print-quotation-modal-open');
    };
  }, [quotation]);

  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCustomerLink = () => {
    const origin = window.location.origin;
    const url = `${origin}?quote_token=${quotation.customerAccessToken}&quote_id=${quotation.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex items-center justify-center p-2 sm:p-6 quotation-print-modal">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden quotation-print-card">
        {/* Top Control Bar (Hidden when printed) */}
        <div className="p-4 bg-[#292F36] text-white flex items-center justify-between no-print border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-bold text-sm">Official Commercial Quotation</span>
              <span className="text-xs text-red-300 ml-2 font-mono font-bold">
                {quotation.id} (Rev {quotation.revisionNumber})
              </span>
              <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                quotation.status === 'Approved' ? 'bg-emerald-600 text-white' :
                quotation.status === 'Sent' ? 'bg-blue-600 text-white' :
                quotation.status === 'Accepted' ? 'bg-emerald-700 text-white' :
                'bg-gray-700 text-gray-200'
              }`}>
                {quotation.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCustomerLink}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              title="Copy public customer review link"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={() => downloadQuotationPdf(quotation)}
              className="px-3 py-1.5 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Download genuine corporate PDF document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Quotation Document */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-[#292F36] quotation-print-sheet print:p-0">
          {/* Header & Corporate Letterhead */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b-2 border-gray-900">
            <div>
              <Logo size="lg" variant="light" />
              <div className="mt-3 text-xs text-gray-600 space-y-0.5">
                <p className="font-bold text-gray-900">{siteSettings.companyName}</p>
                <p>Regional Operations: Davao City & Zamboanga City Hubs</p>
                <p>Head Office: {siteSettings.officeAddress}</p>
                <p>Phone: {siteSettings.phonePrimary} · Secondary: {siteSettings.phoneSecondary}</p>
                <p>Email: {siteSettings.emailSales} · Web: https://zez.zigmatech.shop</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-block bg-[#B5121B] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded mb-2">
                Official Commercial Quotation
              </div>
              <div className="text-xl font-black font-mono text-[#B5121B]">
                {quotation.id}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                Revision: <strong>Rev {quotation.revisionNumber}</strong>
                {quotation.rfqId && <span className="ml-2 font-normal">(Ref RFQ: {quotation.rfqId})</span>}
              </div>
              <div className="text-xs text-gray-600 mt-2 space-y-0.5">
                <p><strong>Date Issued:</strong> {formattedDate}</p>
                <p><strong>Valid Until:</strong> {formattedValidUntil} ({quotation.validityDays} Days)</p>
                <p><strong>Status:</strong> <span className="font-bold text-emerald-700">{quotation.status}</span></p>
                <p><strong>Prepared By:</strong> {quotation.assignedSpecialist || 'Enterprise Account Manager'}</p>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs">
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#B5121B]" />
                <span>Customer & Commercial Account</span>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-gray-900">{quotation.customerCompanyName || 'Enterprise Procurement Client'}</p>
                <p><strong>Attention:</strong> {quotation.customerFullName}</p>
                <p><strong>Email:</strong> {quotation.customerEmail}</p>
                {quotation.customerMobileNumber && <p><strong>Mobile / Phone:</strong> {quotation.customerMobileNumber}</p>}
                {quotation.tinNumber && <p><strong>Client TIN:</strong> {quotation.tinNumber}</p>}
                {quotation.clientPoNumber && <p><strong>Client PO Ref:</strong> {quotation.clientPoNumber}</p>}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-[#B5121B]" />
                <span>Commercial Delivery & Terms</span>
              </div>
              <div className="space-y-1">
                <p><strong>Delivery Location:</strong> {quotation.deliveryCityProvince || 'As agreed'}</p>
                {quotation.deliveryAddress && <p><strong>Site Address:</strong> {quotation.deliveryAddress}</p>}
                <p><strong>Payment Terms:</strong> {quotation.paymentTerms}</p>
                <p><strong>Delivery Lead Time:</strong> {quotation.leadTimeDescription}</p>
                <p><strong>Warranty Policy:</strong> {quotation.warrantyTerms}</p>
              </div>
            </div>
          </div>

          {/* Itemized Quotation Table */}
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
                      {item.notes && <div className="text-[10px] text-gray-500 italic mt-0.5">Note: {item.notes}</div>}
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

          {/* Pricing Breakdown & Commercial Notes & Signatures */}
          <div className="print-avoid-break">
            <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-600 space-y-1.5 max-w-sm">
                <p className="font-bold text-gray-900">Special Instructions & Project Scope:</p>
                <p className="italic text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-200">
                  {quotation.specialInstructions || 'Standard supply and delivery terms. Equipment factory warranty applies.'}
                </p>
                {quotation.adminNotes && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                    <strong>Internal Specialist Notes:</strong> {quotation.adminNotes}
                  </div>
                )}
              </div>

              <div className="w-full sm:w-80 space-y-2 text-xs bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal (Gross):</span>
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
                  <span>Net Amount:</span>
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
                    <span>Freight & Logistics:</span>
                    <span className="font-mono font-semibold">
                      ₱{quotation.deliveryFeePhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {quotation.installationFeePhp > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Installation / Engineering:</span>
                    <span className="font-mono font-semibold">
                      ₱{quotation.installationFeePhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t-2 border-gray-300 flex justify-between text-sm font-extrabold text-[#B5121B]">
                  <span>Grand Total (PHP):</span>
                  <span className="font-mono text-base">
                    ₱{quotation.grandTotalPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Standard Terms of Quotation & Signatures */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-[10.5px] text-gray-500 space-y-2">
              <h5 className="font-bold text-gray-800 uppercase text-[11px]">Commercial Terms and Conditions</h5>
              <ol className="list-decimal pl-4 space-y-1">
                <li><strong>Validity:</strong> This quotation is valid for 30 calendar days from issue date. Beyond this period, prices are subject to confirmation.</li>
                <li><strong>Payment:</strong> 30 Days Net upon credit approval, or Bank Transfer prior to dispatch for new accounts. Official Receipt / Sales Invoice issued upon payment.</li>
                <li><strong>Warranty:</strong> All hardware items are brand new, original, and covered by local manufacturer warranty against defects.</li>
                <li><strong>Logistics:</strong> Delivery through accredited logistics forwarding partners across Luzon, Visayas, and Mindanao.</li>
              </ol>

              <div className="grid grid-cols-2 gap-12 pt-8 mt-4">
                <div className="border-t border-gray-400 pt-2 text-center">
                  <p className="font-bold text-gray-900 text-xs">{quotation.assignedSpecialist || 'ZEZ Automation Corporation'}</p>
                  <p className="text-[10px] text-gray-500">Authorized Corporate Sales Specialist</p>
                  <p className="text-[10px] text-gray-400 font-mono">Date: {formattedDate}</p>
                </div>
                <div className="border-t border-gray-400 pt-2 text-center">
                  <p className="font-bold text-gray-900 text-xs">{quotation.customerCompanyName || quotation.customerFullName}</p>
                  <p className="text-[10px] text-gray-500">Conforme / Authorized Client Signatory</p>
                  <p className="text-[10px] text-gray-400 font-mono">Date: ________________________</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between no-print">
          <p className="text-xs text-gray-500">
            Official ZEZ Document Reference: <strong>{quotation.id}</strong>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print or Save PDF</span>
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
