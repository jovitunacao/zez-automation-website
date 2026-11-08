import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  Printer, 
  FileCheck, 
  Copy, 
  AlertCircle, 
  CheckCircle2, 
  Calculator, 
  Building2, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Check, 
  Loader2,
  Download,
  Lock
} from 'lucide-react';
import { 
  Quotation, 
  QuotationLineItem, 
  VatType, 
  DiscountType, 
  Product 
} from '../../types';
import { 
  calculateLineTotal, 
  calculateQuotationTotals, 
  round2 
} from '../../utils/quotationCalculations';
import { 
  persistQuotation, 
  duplicateAsRevision, 
  dispatchQuotationEmail 
} from '../../services/quotationService';
import { downloadQuotationPdf } from '../../services/quotationPdfService';
import { useApp } from '../../context/AppContext';

interface QuotationMakerModalProps {
  initialQuotation: Quotation;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (quotation: Quotation) => void;
  onPreviewPrint: (quotation: Quotation) => void;
}

export const QuotationMakerModal: React.FC<QuotationMakerModalProps> = ({
  initialQuotation,
  isOpen,
  onClose,
  onSaved,
  onPreviewPrint
}) => {
  const { products, adminUser, isSuperAdmin } = useApp();

  const [quote, setQuote] = useState<Quotation>(initialQuotation);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected product search for adding catalog item
  const [selectedCatalogProductId, setSelectedCatalogProductId] = useState<string>('');

  useEffect(() => {
    setQuote(initialQuotation);
  }, [initialQuotation]);

  if (!isOpen) return null;

  // Recalculate totals whenever items, discount, vat, or fees change
  const recalculateAndSet = (updates: Partial<Quotation>) => {
    setQuote(prev => {
      const merged: Quotation = { ...prev, ...updates };
      const calculated = calculateQuotationTotals({
        items: merged.items,
        discountType: merged.discountType,
        discountValue: merged.discountValue,
        vatType: merged.vatType,
        deliveryFeePhp: merged.deliveryFeePhp,
        installationFeePhp: merged.installationFeePhp,
        otherFeesPhp: merged.otherFeesPhp
      });

      return {
        ...merged,
        subtotalPhp: calculated.subtotalPhp,
        discountAmountPhp: calculated.discountAmountPhp,
        netOfVatPhp: calculated.netOfVatPhp,
        vatAmountPhp: calculated.vatAmountPhp,
        vatRate: calculated.vatRate,
        grandTotalPhp: calculated.grandTotalPhp
      };
    });
  };

  // Line item manipulation
  const handleUpdateItem = (index: number, field: keyof QuotationLineItem, value: any) => {
    const updatedItems = [...quote.items];
    const item = { ...updatedItems[index], [field]: value };

    // Recalculate line total if qty, price, or discount changed
    if (field === 'quantity' || field === 'unitPricePhp' || field === 'discountPercent') {
      const qty = field === 'quantity' ? Number(value) : item.quantity;
      const price = field === 'unitPricePhp' ? Number(value) : item.unitPricePhp;
      const disc = field === 'discountPercent' ? Number(value) : (item.discountPercent || 0);
      item.lineTotalPhp = calculateLineTotal(qty, price, disc);
    }

    updatedItems[index] = item;
    recalculateAndSet({ items: updatedItems });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = quote.items.filter((_, idx) => idx !== index);
    recalculateAndSet({ items: updatedItems });
  };

  const handleAddManualItem = () => {
    const newItem: QuotationLineItem = {
      id: `item-${Date.now()}-${quote.items.length}`,
      productName: '',
      brand: '',
      model: '',
      sku: '',
      quantity: 1,
      unitPricePhp: 0,
      discountPercent: 0,
      lineTotalPhp: 0,
      leadTime: '1-3 business days',
      warranty: 'Standard 1-Year Local Warranty',
      sortOrder: quote.items.length
    };
    recalculateAndSet({ items: [...quote.items, newItem] });
  };

  const handleAddCatalogProduct = () => {
    if (!selectedCatalogProductId) return;
    const prod = products.find(p => p.id === selectedCatalogProductId);
    if (!prod) return;

    const unitPrice = prod.pricePhp && prod.pricePhp > 0 ? prod.pricePhp : 0;
    const newItem: QuotationLineItem = {
      id: `item-${Date.now()}-${quote.items.length}`,
      productId: prod.id,
      sku: prod.sku,
      productName: prod.name,
      model: prod.model,
      brand: prod.brand,
      quantity: 1,
      unitPricePhp: unitPrice,
      discountPercent: 0,
      lineTotalPhp: calculateLineTotal(1, unitPrice, 0),
      leadTime: prod.leadTimeDays ? `${prod.leadTimeDays} business days` : '1-3 business days',
      warranty: prod.warranty || 'Standard 1-Year Local Warranty',
      sortOrder: quote.items.length
    };

    recalculateAndSet({ items: [...quote.items, newItem] });
    setSelectedCatalogProductId('');
  };

  // Save handler
  const handleSave = async (statusOverride?: Quotation['status']) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    const now = new Date();
    const updatedStatus = statusOverride || quote.status;
    const payload: Quotation = {
      ...quote,
      status: updatedStatus,
      updatedAt: now.toISOString()
    };

    if (updatedStatus === 'Approved' && !payload.approvedAt) {
      payload.approvedAt = now.toISOString();
      payload.approvedBy = adminUser?.id;
    }

    const res = await persistQuotation(payload, adminUser);
    setIsSaving(false);

    if (res.success && res.quotation) {
      setQuote(res.quotation);
      setSaveSuccessMessage(`Quotation ${res.quotation.id} saved successfully (${res.quotation.status}).`);
      onSaved(res.quotation);
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    } else {
      setErrorMessage(res.error || 'Failed to persist quotation.');
    }
  };

  // Dispatch Email handler
  const handleSendEmail = async () => {
    if (!confirm(`Are you sure you want to dispatch this quotation to ${quote.customerEmail}?`)) {
      return;
    }

    setIsSendingEmail(true);
    setErrorMessage(null);

    // First ensure quotation is approved and saved
    const approvedQuote: Quotation = {
      ...quote,
      status: 'Approved',
      approvedAt: quote.approvedAt || new Date().toISOString(),
      approvedBy: quote.approvedBy || adminUser?.id
    };

    const saveRes = await persistQuotation(approvedQuote, adminUser);
    if (!saveRes.success) {
      setIsSendingEmail(false);
      setErrorMessage(saveRes.error || 'Failed to approve and save quotation prior to email dispatch.');
      return;
    }

    const targetQuote = saveRes.quotation || approvedQuote;
    const res = await dispatchQuotationEmail(targetQuote);
    setIsSendingEmail(false);

    if (res.success) {
      const updatedQuote: Quotation = {
        ...targetQuote,
        status: 'Sent',
        sentAt: new Date().toISOString(),
        sentToEmail: quote.customerEmail
      };
      setQuote(updatedQuote);
      onSaved(updatedQuote);
      setSaveSuccessMessage(`Quotation ${quote.id} Rev ${quote.revisionNumber} sent successfully to ${quote.customerEmail}!`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } else {
      setErrorMessage(res.error || 'Failed to dispatch quotation email.');
    }
  };

  // Create new revision handler
  const handleCreateRevision = () => {
    if (!confirm(`Create Revision ${(quote.revisionNumber || 1) + 1} from ${quote.id}?`)) {
      return;
    }
    const revision = duplicateAsRevision(quote, adminUser);
    setQuote(revision);
    onSaved(revision);
    setSaveSuccessMessage(`Created Revision ${revision.revisionNumber}. You can now edit and re-issue.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex items-center justify-center p-2 sm:p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[96vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#292F36] text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B5121B] flex items-center justify-center text-white">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">B2B Quotation Maker</h3>
                <span className="font-mono text-xs text-red-300 font-bold bg-white/10 px-2 py-0.5 rounded">
                  {quote.id} · Rev {quote.revisionNumber}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  quote.status === 'Approved' ? 'bg-emerald-600 text-white' :
                  quote.status === 'Sent' ? 'bg-blue-600 text-white' :
                  quote.status === 'Accepted' ? 'bg-emerald-700 text-white' :
                  'bg-gray-700 text-gray-200'
                }`}>
                  {quote.status}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Official pro-forma quotation with itemized pricing, BIR VAT compliance, and electronic conforme.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadQuotationPdf(quote)}
              className="px-3 py-1.5 bg-[#B5121B] hover:bg-[#8F1018] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Download genuine corporate PDF quotation document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={() => onPreviewPrint(quote)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
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

        {/* Alerts Strip */}
        {saveSuccessMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-50 border-b border-red-200 p-3 text-xs text-red-800 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {['Sent', 'Accepted', 'Declined'].includes(quote.status) && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 text-xs text-amber-900 flex items-center justify-between font-medium">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Issued Quotation (Immutable Version):</strong> This quotation was officially dispatched to the customer. To alter items, quantities, or pricing, click <strong>Create Revision</strong> to issue Rev {(quote.revisionNumber || 1) + 1}.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCreateRevision}
              className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded text-[11px] transition-colors cursor-pointer shrink-0"
            >
              + New Rev {(quote.revisionNumber || 1) + 1}
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-[#292F36]">
          {/* Section 1: Customer & Quotation Reference */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
                <Building2 className="w-4 h-4 text-[#B5121B]" />
                <span>1. Customer & Account Information</span>
              </span>
              {quote.rfqId && (
                <span className="font-mono text-gray-500 text-[11px]">
                  Origin RFQ: <strong>{quote.rfqId}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Company / Institution</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Data Logistics Inc."
                  value={quote.customerCompanyName || ''}
                  onChange={(e) => recalculateAndSet({ customerCompanyName: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-[#B5121B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Attention (Contact Person) *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Engr. Jayson Morales"
                  value={quote.customerFullName}
                  onChange={(e) => recalculateAndSet({ customerFullName: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-[#B5121B] focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Corporate Email *</label>
                <input
                  required
                  type="email"
                  placeholder="client@company.ph"
                  value={quote.customerEmail}
                  onChange={(e) => recalculateAndSet({ customerEmail: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-[#B5121B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Mobile / Phone</label>
                <input
                  type="tel"
                  placeholder="+63 9XX XXX XXXX"
                  value={quote.customerMobileNumber || ''}
                  onChange={(e) => recalculateAndSet({ customerMobileNumber: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-[#B5121B] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Delivery City / Province</label>
                <input
                  type="text"
                  placeholder="e.g. Davao City / Taguig"
                  value={quote.deliveryCityProvince || ''}
                  onChange={(e) => recalculateAndSet({ deliveryCityProvince: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-[#B5121B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Customer TIN</label>
                <input
                  type="text"
                  placeholder="000-000-000-000"
                  value={quote.tinNumber || ''}
                  onChange={(e) => recalculateAndSet({ tinNumber: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-[#B5121B] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Assigned Sales Specialist</label>
                <input
                  type="text"
                  value={quote.assignedSpecialist || ''}
                  onChange={(e) => recalculateAndSet({ assignedSpecialist: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:border-[#B5121B] focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Line Items */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-[#B5121B]" />
                <span>2. Quotation Line Items ({quote.items.length})</span>
              </span>

              {/* Add item tools */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCatalogProductId}
                  onChange={(e) => setSelectedCatalogProductId(e.target.value)}
                  className="p-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs max-w-xs truncate"
                >
                  <option value="">— Add From Equipment Catalog —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.brand} · {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddCatalogProduct}
                  disabled={!selectedCatalogProductId}
                  className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg disabled:opacity-50 transition-colors"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={handleAddManualItem}
                  className="px-2.5 py-1.5 bg-[#B5121B] hover:bg-[#8F1018] text-white font-bold rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Item</span>
                </button>
              </div>
            </div>

            {quote.items.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 space-y-2">
                <p className="font-bold text-gray-700">No Line Items Added</p>
                <p className="text-gray-500 text-xs">
                  Select a product from the catalog dropdown above or click "Custom Item" to add bill of materials.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#292F36] text-white">
                    <tr>
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Product / Description</th>
                      <th className="py-2.5 px-3 w-28">Brand / Model</th>
                      <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                      <th className="py-2.5 px-3 w-32 text-right">Unit Price (PHP)</th>
                      <th className="py-2.5 px-3 w-20 text-center">Disc (%)</th>
                      <th className="py-2.5 px-3 w-32 text-right">Line Total (PHP)</th>
                      <th className="py-2.5 px-3 w-10 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {quote.items.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 text-gray-400 font-mono text-center">{index + 1}</td>
                        <td className="py-2 px-3 space-y-1">
                          <input
                            type="text"
                            placeholder="Product Name / Scope Description *"
                            value={item.productName}
                            onChange={(e) => handleUpdateItem(index, 'productName', e.target.value)}
                            className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:border-[#B5121B] font-semibold"
                          />
                          <input
                            type="text"
                            placeholder="Optional line notes (e.g. Sizing, Delivery lead-time)"
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                            className="w-full p-1 bg-white border border-gray-100 rounded text-[11px] text-gray-500"
                          />
                        </td>
                        <td className="py-2 px-3 space-y-1">
                          <input
                            type="text"
                            placeholder="Brand"
                            value={item.brand || ''}
                            onChange={(e) => handleUpdateItem(index, 'brand', e.target.value)}
                            className="w-full p-1 bg-gray-50 border border-gray-200 rounded text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Model / SKU"
                            value={item.model || item.sku || ''}
                            onChange={(e) => handleUpdateItem(index, 'model', e.target.value)}
                            className="w-full p-1 bg-gray-50 border border-gray-200 rounded text-[11px] font-mono text-gray-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                            className="w-16 p-1.5 text-center bg-gray-50 border border-gray-200 rounded font-bold"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPricePhp}
                            onChange={(e) => handleUpdateItem(index, 'unitPricePhp', e.target.value)}
                            className="w-28 p-1.5 text-right font-mono bg-gray-50 border border-gray-200 rounded font-bold"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            value={item.discountPercent || 0}
                            onChange={(e) => handleUpdateItem(index, 'discountPercent', e.target.value)}
                            className="w-14 p-1.5 text-center font-mono bg-gray-50 border border-gray-200 rounded"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-gray-900 text-sm">
                          ₱{Number(item.lineTotalPhp).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Remove line item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Pricing Summary & Commercial Terms */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Commercial terms & notes (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-200 pb-2">
                <Clock className="w-4 h-4 text-[#B5121B]" />
                <span>3. Commercial Terms & Conditions</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={quote.validityDays}
                    onChange={(e) => {
                      const days = Number(e.target.value);
                      const validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                      recalculateAndSet({ validityDays: days, validUntil: validUntil.toISOString() });
                    }}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Payment Terms</label>
                  <select
                    value={quote.paymentTerms}
                    onChange={(e) => recalculateAndSet({ paymentTerms: e.target.value })}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  >
                    <option value="Cash On Delivery (COD) / Full Payment upon turnover">Cash On Delivery (COD) / Full Payment upon turnover</option>
                    <option value="50% Downpayment, 50% upon completed installation/delivery">50% Downpayment, 50% upon completed installation/delivery</option>
                    <option value="15 Days Net from Invoice receipt (Subject to credit verification)">15 Days Net from Invoice receipt (Subject to credit verification)</option>
                    <option value="30 Days Net upon approval (Subject to credit verification)">30 Days Net upon approval (Subject to credit verification)</option>
                    <option value="Custom / Specified in Contract Schedule">Custom / Specified in Contract Schedule</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Warranty Details</label>
                <select
                  value={quote.warrantyTerms}
                  onChange={(e) => recalculateAndSet({ warrantyTerms: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="Standard 1-Year Local Manufacturer Warranty on Hardware">Standard 1-Year Local Manufacturer Warranty on Hardware</option>
                  <option value="3-Year Limited Manufacturer Warranty (Enterprise Active Gear)">3-Year Limited Manufacturer Warranty (Enterprise Active Gear)</option>
                  <option value="Pass-through Manufacturer Warranty per component">Pass-through Manufacturer Warranty per component</option>
                  <option value="Custom Warranty as stipulated in SLA Schedule">Custom Warranty as stipulated in SLA Schedule</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Lead Time & Freight Logistics</label>
                <select
                  value={quote.leadTimeDescription || 'Standard Freight Delivery (3-5 business days upon PO acceptance)'}
                  onChange={(e) => recalculateAndSet({ leadTimeDescription: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="Standard Freight Delivery (3-5 business days upon PO acceptance)">Standard Freight Delivery (3-5 business days upon PO acceptance)</option>
                  <option value="1-3 business days within regional hubs (Davao / Zamboanga)">1-3 business days within regional hubs (Davao / Zamboanga)</option>
                  <option value="Customer Pickup / Ex-Warehouse (Davao / Zamboanga Hub)">Customer Pickup / Ex-Warehouse (Davao / Zamboanga Hub)</option>
                  <option value="Expedited Delivery (Subject to carrier availability)">Expedited Delivery (Subject to carrier availability)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Assigned Commercial Specialist</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quote.assignedSpecialist || ''}
                    onChange={(e) => recalculateAndSet({ assignedSpecialist: e.target.value })}
                    className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs"
                    placeholder="e.g. Sales Specialist / Commercial Engineering"
                  />
                  {adminUser?.fullName && (
                    <button
                      type="button"
                      onClick={() => recalculateAndSet({ assignedSpecialist: `${adminUser.fullName} (${adminUser.role === 'super_admin' ? 'Super Admin' : 'Sales Specialist'})` })}
                      className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs transition-colors shrink-0"
                    >
                      Assign to Me
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Client PO Reference Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-APEX-889"
                  value={quote.clientPoNumber || ''}
                  onChange={(e) => recalculateAndSet({ clientPoNumber: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Special Scope Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Include rack rails, patch cords, delivery to 7th floor server room..."
                  value={quote.specialInstructions || ''}
                  onChange={(e) => recalculateAndSet({ specialInstructions: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>
            </div>

            {/* Financial Calculator Breakdown (5 cols) */}
            <div className="lg:col-span-5 bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <span className="font-bold text-gray-900 text-sm flex items-center justify-between border-b border-gray-200 pb-2">
                <span>Financial Totals (PHP)</span>
                <span className="font-mono text-xs text-gray-500">BIR EVAT Compliant</span>
              </span>

              {/* Subtotal */}
              <div className="flex justify-between items-center text-gray-700">
                <span className="font-semibold">Gross Subtotal:</span>
                <span className="font-mono font-bold">
                  ₱{quote.subtotalPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Special Discount */}
              <div className="p-2.5 bg-white rounded-lg border border-gray-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Project Discount:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => recalculateAndSet({ discountType: 'percentage' })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        quote.discountType === 'percentage' ? 'bg-[#B5121B] text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => recalculateAndSet({ discountType: 'fixed' })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        quote.discountType === 'fixed' ? 'bg-[#B5121B] text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      PHP
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={quote.discountValue || 0}
                    onChange={(e) => recalculateAndSet({ discountValue: Number(e.target.value) })}
                    className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded font-mono font-bold text-right"
                  />
                  <span className="font-mono text-emerald-700 font-bold shrink-0">
                    -₱{quote.discountAmountPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Configurable VAT Setting */}
              <div className="p-2.5 bg-white rounded-lg border border-gray-200 space-y-1.5">
                <label className="block text-gray-700 font-semibold">VAT Application (BIR Standard):</label>
                <select
                  value={quote.vatType}
                  onChange={(e) => recalculateAndSet({ vatType: e.target.value as VatType })}
                  className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded font-medium"
                >
                  <option value="vat_inclusive_12">12% EVAT Inclusive (Standard Philippine Retail/B2B)</option>
                  <option value="vat_exclusive_12">12% EVAT Exclusive (Net + 12% Added)</option>
                  <option value="vat_exempt">VAT Exempt (0% EVAT)</option>
                  <option value="zero_rated">Zero-Rated (PEZA / Special Zone)</option>
                </select>

                <div className="flex justify-between items-center text-[11px] text-gray-600 pt-1">
                  <span>Computed 12% VAT:</span>
                  <span className="font-mono font-bold">
                    ₱{quote.vatAmountPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Ancillary Fees */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="block text-gray-600 font-semibold mb-0.5">Delivery Fee (PHP)</label>
                  <input
                    type="number"
                    min="0"
                    value={quote.deliveryFeePhp}
                    onChange={(e) => recalculateAndSet({ deliveryFeePhp: Number(e.target.value) })}
                    className="w-full p-1.5 bg-white border border-gray-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-0.5">Installation Fee (PHP)</label>
                  <input
                    type="number"
                    min="0"
                    value={quote.installationFeePhp}
                    onChange={(e) => recalculateAndSet({ installationFeePhp: Number(e.target.value) })}
                    className="w-full p-1.5 bg-white border border-gray-200 rounded font-mono"
                  />
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t-2 border-gray-300 flex items-center justify-between text-base font-black text-[#B5121B]">
                <span>Grand Total:</span>
                <span className="font-mono text-lg">
                  ₱{quote.grandTotalPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateRevision}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Create Revision</span>
            </button>
            <button
              type="button"
              onClick={() => onPreviewPrint(quote)}
              className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave('Draft')}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            {/* Approval Button for Admins */}
            {quote.status !== 'Approved' && quote.status !== 'Sent' && quote.status !== 'Accepted' && (
              <button
                type="button"
                onClick={() => handleSave('Approved')}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve Quotation</span>
              </button>
            )}

            {/* Email Dispatch Button */}
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSendingEmail || quote.items.length === 0}
              className="px-4 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSendingEmail ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isSendingEmail ? 'Sending via Resend...' : 'Email to Customer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
