import { jsPDF } from 'jspdf';
import { QuotationRequest, SiteSettings } from '../types';

/**
 * ZEZ AUTOMATION CORPORATION — OFFICIAL RFQ ACKNOWLEDGMENT PDF GENERATOR
 * Generates an enterprise-grade A4 portrait PDF for customer RFQ acknowledgments.
 * Features:
 * - Precise A4 portrait layout with strict 1-page budget for 1-5 item RFQs
 * - 2-column customer and logistics particulars (guaranteed on mobile and desktop)
 * - Clear non-binding inquiry notice distinguishing from approved quotations
 * - Table header retention with automatic, clean multi-page pagination for longer RFQs
 * - Direct download support for iPhone Safari, iPadOS, Android, and Desktop
 */
export function generateRfqPdf(rfq: QuotationRequest, siteSettings?: Partial<SiteSettings>): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 12; // 12mm margins
  const contentWidth = pageWidth - margin * 2; // 186mm
  let y = margin;

  const companyName = siteSettings?.companyName || 'ZEZ AUTOMATION CORPORATION';
  const officeAddress = siteSettings?.officeAddress || '2nd Floor, ZEZ Building, Metro Manila, Philippines';
  const phonePrimary = siteSettings?.phonePrimary || '+63 (02) 8888-9390';
  const emailSales = siteSettings?.emailSales || 'sales@zezautomation.ph';

  const formattedDate = new Date(rfq.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // --------------------------------------------------------------------------
  // 1. CORPORATE LETTERHEAD (Charcoal Band with Crimson Accent)
  // --------------------------------------------------------------------------
  doc.setFillColor(41, 47, 54); // #292F36
  doc.rect(margin, y, contentWidth, 23, 'F');

  // Red accent bar on the left
  doc.setFillColor(181, 18, 27); // #B5121B
  doc.rect(margin, y, 3.5, 23, 'F');

  // Corporate Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(companyName.toUpperCase(), margin + 6, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(209, 213, 219);
  doc.text('ICT Equipment Distribution & Technology Infrastructure Engineering', margin + 6, y + 12.5);
  doc.text(`Regional Centers: Davao City & Zamboanga City Hubs · Phone: ${phonePrimary} · Email: ${emailSales}`, margin + 6, y + 17.5);

  // Right-side document badge
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('REQUEST FOR QUOTATION', pageWidth - margin - 4, y + 7.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(251, 191, 36); // Amber
  doc.text('INQUIRY ACKNOWLEDGMENT', pageWidth - margin - 4, y + 13, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(rfq.id, pageWidth - margin - 4, y + 19, { align: 'right' });

  y += 26;

  // --------------------------------------------------------------------------
  // 2. IMPORTANT PROCUREMENT NOTICE (Distinguishing RFQ from Sales Quotation)
  // --------------------------------------------------------------------------
  doc.setFillColor(254, 243, 199); // #FEF3C7 (amber-100)
  doc.setDrawColor(245, 158, 11); // #F59E0B (amber-500)
  doc.roundedRect(margin, y, contentWidth, 13.5, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14); // #92400E (amber-800)
  doc.text('PROCUREMENT INQUIRY ACKNOWLEDGMENT (NON-BINDING DOCUMENT)', margin + 3.5, y + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(55, 65, 81); // #374151
  const disclaimerText = 
    'This document acknowledges receipt of an inbound customer Request for Quotation (RFQ) for engineering review and specification verification. ' +
    'It is NOT an official sales quotation, binding price commitment, credit guarantee, or delivery schedule. Official equipment pricing, certified warranty terms, ' +
    'and delivery commitments are issued exclusively via an authorized ZEZ Sales Quotation upon technical clearance.';
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth - 7);
  doc.text(splitDisclaimer, margin + 3.5, y + 8);

  y += 16;

  // --------------------------------------------------------------------------
  // 3. CUSTOMER & LOGISTICS 2-COLUMN PARTICULARS (Rigid 2-Column Grid)
  // --------------------------------------------------------------------------
  doc.setFillColor(249, 250, 251); // #F9FAFB
  doc.setDrawColor(229, 231, 235); // #E5E7EB
  const gridHeight = 31;
  doc.roundedRect(margin, y, contentWidth, gridHeight, 1.5, 1.5, 'FD');

  const col1X = margin + 4;
  const colHalf = contentWidth / 2;
  const col2X = margin + colHalf + 4;

  // Divider line between columns
  doc.setDrawColor(229, 231, 235);
  doc.line(margin + colHalf, y, margin + colHalf, y + gridHeight);

  // Column 1: Customer Profile
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128); // #6B7280
  doc.text('CUSTOMER / REQUISITIONER PARTICULARS', col1X, y + 4.5);

  doc.setFontSize(8);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  const companyStr = rfq.customer.companyName || 'Corporate Procurement Client';
  doc.text(doc.splitTextToSize(companyStr, colHalf - 8)[0], col1X, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81);
  doc.text(`Contact Person: ${rfq.customer.fullName}`, col1X, y + 14);
  doc.text(`Email Address: ${rfq.customer.email}`, col1X, y + 18.5);
  doc.text(`Mobile / Phone: ${rfq.customer.mobileNumber || 'Not specified'}`, col1X, y + 23);
  const custType = rfq.customer.customerType || 'Corporate';
  const tinStr = rfq.customer.tinNumber ? ` · TIN: ${rfq.customer.tinNumber}` : '';
  doc.text(`Account Type: ${custType}${tinStr}`, col1X, y + 27.5);

  // Column 2: Inquiry & Logistics
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('INQUIRY STATUS & LOGISTICS DETAILS', col2X, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81);
  doc.text(`Submission Date: ${formattedDate}`, col2X, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9); // Amber-700
  const statusDisplay = rfq.status === 'New' || rfq.status === 'Under Review' 
    ? `${rfq.status} · Pending Engineering Review` 
    : rfq.status;
  doc.text(`Review Status: ${statusDisplay}`, col2X, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  const locationStr = rfq.customer.deliveryCityProvince || 'To be confirmed';
  doc.text(`Destination: ${locationStr}`, col2X, y + 18.5);
  if (rfq.customer.deliveryAddress) {
    const addressStr = doc.splitTextToSize(`Address: ${rfq.customer.deliveryAddress}`, colHalf - 8)[0];
    doc.text(addressStr, col2X, y + 23);
  } else {
    doc.text(`Contact Channel: ${rfq.customer.preferredContactMethod || 'Email'}`, col2X, y + 23);
  }
  const specialistStr = rfq.assignedSpecialist || 'Corporate Sales Engineering Hub';
  doc.text(`Review Desk: ${specialistStr}`, col2X, y + 27.5);

  y += gridHeight + 4;

  // --------------------------------------------------------------------------
  // 4. ITEM TABLE HEADER FUNCTION (Used for page 1 and overflow pages)
  // --------------------------------------------------------------------------
  const renderTableHeader = (currentY: number): number => {
    doc.setFillColor(41, 47, 54); // #292F36
    doc.rect(margin, currentY, contentWidth, 6.5, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('#', margin + 3, currentY + 4.5);
    doc.text('REQUESTED EQUIPMENT & SPECIFICATIONS', margin + 11, currentY + 4.5);
    doc.text('QTY', margin + 116, currentY + 4.5, { align: 'center' });
    doc.text('INDICATIVE REF PRICE', margin + 150, currentY + 4.5, { align: 'right' });
    doc.text('EST REF SUBTOTAL', margin + contentWidth - 3, currentY + 4.5, { align: 'right' });

    return currentY + 6.5;
  };

  y = renderTableHeader(y);

  // --------------------------------------------------------------------------
  // 5. ITEMIZED PRODUCT ROWS
  // --------------------------------------------------------------------------
  doc.setFont('helvetica', 'normal');
  const items = rfq.items || [];

  items.forEach((item, idx) => {
    // Check if new page is needed (keep 60mm buffer for summary + terms + signatures)
    if (y > 225) {
      doc.addPage();
      y = margin;
      y = renderTableHeader(y);
    }

    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, contentWidth, 9, 'F');
    }

    // Item index
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`${idx + 1}`, margin + 3, y + 5.2);

    // Product Title (Truncated/Fit to column)
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    const nameStr = doc.splitTextToSize(item.productName, 100)[0];
    doc.text(nameStr, margin + 11, y + 4.2);

    // Brand, Model, SKU
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    const subParts = [item.brand, item.model ? `Model: ${item.model}` : '', item.sku ? `SKU: ${item.sku}` : ''].filter(Boolean);
    const subStr = subParts.join(' · ');
    if (subStr) {
      doc.text(subStr, margin + 11, y + 7.8);
    }

    // Quantity
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`${item.quantity}`, margin + 116, y + 5.2, { align: 'center' });

    // Indicative Unit Price
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    const unitPriceDisplay = item.unitPricePhp && item.unitPricePhp > 0
      ? `PHP ${Number(item.unitPricePhp).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'Subject to Quote';
    doc.text(unitPriceDisplay, margin + 150, y + 5.2, { align: 'right' });

    // Indicative Subtotal
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    const lineTotalDisplay = item.subtotalPhp && item.subtotalPhp > 0
      ? `PHP ${Number(item.subtotalPhp).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'Subject to Quote';
    doc.text(lineTotalDisplay, margin + contentWidth - 3, y + 5.2, { align: 'right' });

    // Row divider
    doc.setDrawColor(243, 244, 246);
    doc.line(margin, y + 9, margin + contentWidth, y + 9);
    y += 9.2;
  });

  // --------------------------------------------------------------------------
  // 6. FINANCIAL BREAKDOWN & COMMERCIAL NOTES (Avoid Page Split)
  // --------------------------------------------------------------------------
  y += 2;
  // If remaining space cannot fit summary (34mm) + notes (20mm) + signatures (24mm) = 78mm
  if (y > 212) {
    doc.addPage();
    y = margin;
  }

  const totalsBoxWidth = 84;
  const totalsBoxX = margin + contentWidth - totalsBoxWidth;
  const totalsBoxHeight = 31;

  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(totalsBoxX, y, totalsBoxWidth, totalsBoxHeight, 1.5, 1.5, 'FD');

  let ty = y + 4.5;
  const leftT = totalsBoxX + 4;
  const rightT = totalsBoxX + totalsBoxWidth - 4;

  const hasEstimatedTotal = typeof rfq.totalEstimatedPhp === 'number' && rfq.totalEstimatedPhp > 0;
  const refSubtotalNet = hasEstimatedTotal ? Math.round(rfq.totalEstimatedPhp! / 1.12) : 0;
  const refVatEstimate = hasEstimatedTotal ? Math.round(rfq.totalEstimatedPhp! - refSubtotalNet) : 0;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('ESTIMATED REFERENCE SUMMARY', leftT, ty);
  ty += 4.5;

  if (hasEstimatedTotal) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text('Ref Subtotal (Net of VAT):', leftT, ty);
    doc.text(`PHP ${refSubtotalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, rightT, ty, { align: 'right' });
    ty += 4.2;

    doc.text('Indicative EVAT (12%):', leftT, ty);
    doc.text(`PHP ${refVatEstimate.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, rightT, ty, { align: 'right' });
    ty += 4.2;

    doc.setDrawColor(209, 213, 219);
    doc.line(totalsBoxX + 2, ty, totalsBoxX + totalsBoxWidth - 2, ty);
    ty += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(181, 18, 27); // #B5121B
    doc.text('ESTIMATED REF TOTAL:', leftT, ty);
    doc.text(`PHP ${rfq.totalEstimatedPhp!.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, rightT, ty, { align: 'right' });
    ty += 4;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(107, 114, 128);
    doc.text('*Indicative catalogue estimate. Subject to official quotation.', leftT, ty);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    doc.text('Custom Project Pricing', leftT, ty + 2);
    ty += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(107, 114, 128);
    doc.text('Official unit pricing, project discounts, and VAT classification', leftT, ty);
    ty += 3.8;
    doc.text('will be issued upon technical review by ZEZ engineers.', leftT, ty);
  }

  // Requisitioner Notes on left side of totals box
  const notesWidth = contentWidth - totalsBoxWidth - 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(55, 65, 81);
  doc.text('REQUISITIONER REQUIREMENTS & NOTES:', margin, y + 4.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(75, 85, 99);
  const reqNotes = rfq.customer.additionalRequirements || 'Standard enterprise delivery terms requested.';
  const splitReq = doc.splitTextToSize(reqNotes, notesWidth);
  doc.text(splitReq, margin, y + 8.5);

  if (rfq.adminNotes) {
    const adminY = y + 8.5 + splitReq.length * 3.5 + 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(146, 64, 14);
    doc.text(`Reviewer Remarks: ${rfq.adminNotes}`, margin, adminY);
  }

  y += totalsBoxHeight + 3;

  // --------------------------------------------------------------------------
  // 7. INQUIRY CONDITIONS & ASSESSMENT GUIDELINES
  // --------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(55, 65, 81);
  doc.text('PROCUREMENT INQUIRY & ASSESSMENT GUIDELINES:', margin, y + 3.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(107, 114, 128);
  let gy = y + 7.5;
  const guidelines = [
    '1. Technical Review: Submitted bill of materials and technical specifications are evaluated by ZEZ application engineers to verify compatibility and regional stock.',
    '2. Formal Quotation: An authorized ZEZ Sales Quotation detailing binding project pricing, approved payment terms, and delivery schedules will follow.',
    '3. Pricing & VAT Determination: Reference figures shown are indicative catalogue estimates. Final billing amounts and VAT treatment are confirmed in the official quote.',
    '4. Engineering Consultations: For urgent bidding tenders, customized automation panels, or technical datasheets, please coordinate with ZEZ Engineering.',
  ];

  guidelines.forEach((g) => {
    doc.text(g, margin, gy);
    gy += 3.5;
  });

  y = gy + 2;

  // --------------------------------------------------------------------------
  // 8. SIGNATORIES & ACKNOWLEDGMENT BLOCK
  // --------------------------------------------------------------------------
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(209, 213, 219);
  const sigHeight = 23;
  doc.roundedRect(margin, y, contentWidth, sigHeight, 1.5, 1.5, 'D');

  const halfWidth = contentWidth / 2;
  doc.line(margin + halfWidth, y, margin + halfWidth, y + sigHeight);

  // Left Signatory (Customer / Requester)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('SUBMITTED BY (PROCUREMENT REQUESTER):', margin + 3.5, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(17, 24, 39);
  const requesterDisplay = rfq.customer.companyName || rfq.customer.fullName;
  doc.text(doc.splitTextToSize(requesterDisplay, halfWidth - 8)[0], margin + 3.5, y + 10);

  doc.setDrawColor(156, 163, 175);
  doc.line(margin + 3.5, y + 15.5, margin + halfWidth - 6, y + 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(107, 114, 128);
  doc.text(`Authorized Requisitioner / Date Submitted: ${formattedDate}`, margin + 3.5, y + 19.5);

  // Right Signatory (ZEZ Sales Engineering Hub)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('RECEIVED FOR ENGINEERING REVIEW:', margin + halfWidth + 3.5, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(17, 24, 39);
  doc.text('ZEZ Automation Corporation', margin + halfWidth + 3.5, y + 10);

  doc.setDrawColor(156, 163, 175);
  doc.line(margin + halfWidth + 3.5, y + 15.5, margin + contentWidth - 4, y + 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(107, 114, 128);
  doc.text('Corporate Sales Engineering Hub · Status: Inbound Review', margin + halfWidth + 3.5, y + 19.5);

  // --------------------------------------------------------------------------
  // 9. FOOTER
  // --------------------------------------------------------------------------
  doc.setFontSize(6.5);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `ZEZ Automation Corporation · RFQ Ref: ${rfq.id} · Acknowledgment Generated ${new Date().toISOString().split('T')[0]}`,
    margin,
    288
  );
  doc.text('Inbound Procurement Acknowledgment · Non-binding Document', pageWidth - margin, 288, { align: 'right' });

  return doc;
}

/**
 * Downloads the dedicated RFQ A4 PDF across iPhone Safari, iPadOS, Android, and Desktop.
 */
export function downloadRfqPdf(rfq: QuotationRequest, siteSettings?: Partial<SiteSettings>): void {
  const doc = generateRfqPdf(rfq, siteSettings);
  const safeFilename = `${rfq.id}_RFQ_Acknowledgment.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_');

  try {
    doc.save(safeFilename);
  } catch {
    // Robust Blob URL fallback for mobile Safari if doc.save is restricted
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

/**
 * Generates raw base64 string for potential email attachments or client cache.
 */
export function generateRfqPdfBase64(rfq: QuotationRequest, siteSettings?: Partial<SiteSettings>): string {
  const doc = generateRfqPdf(rfq, siteSettings);
  const dataUri = doc.output('datauristring');
  const base64Index = dataUri.indexOf('base64,');
  if (base64Index !== -1) {
    return dataUri.substring(base64Index + 7);
  }
  return '';
}
