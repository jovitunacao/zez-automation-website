import { jsPDF } from 'jspdf';
import { Quotation } from '../types';

/**
 * ZEZ AUTOMATION CORPORATION — OFFICIAL BRANDED PDF GENERATOR
 * Generates an enterprise-grade pro-forma quotation PDF matching corporate letterhead,
 * Philippine Bureau of Internal Revenue (BIR) line item formats, and Conforme sections.
 */
export function generateQuotationPdf(quote: Quotation): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let y = margin;

  // 1. CORPORATE HEADER (Charcoal Band)
  doc.setFillColor(41, 47, 54); // #292F36
  doc.rect(margin, y, contentWidth, 24, 'F');

  // Red accent bar on the left
  doc.setFillColor(181, 18, 27); // #B5121B
  doc.rect(margin, y, 3, 24, 'F');

  // Corporate Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ZEZ AUTOMATION CORPORATION', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(209, 213, 219);
  doc.text('ICT Equipment Distribution & Technology Infrastructure Engineering', margin + 6, y + 13);
  doc.text('SEC Reg. / BIR Registered Corporate Supplier · Davao & Zamboanga Hubs', margin + 6, y + 18);

  // Right-side document label
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PRO-FORMA QUOTATION', pageWidth - margin - 4, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(251, 191, 36); // Amber
  doc.text(`${quote.id} (Rev ${quote.revisionNumber})`, pageWidth - margin - 4, y + 15, { align: 'right' });

  y += 28;

  // 2. METADATA & CLIENT PARTICULARS GRID
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');

  const col1X = margin + 4;
  const col2X = margin + 95;

  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text('CUSTOMER / CLIENT PARTICULARS', col1X, y + 5);
  doc.text('COMMERCIAL & VALIDITY TERMS', col2X, y + 5);

  doc.setFontSize(8.5);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.text(quote.customerCompanyName || 'Direct Corporate Client', col1X, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Attention: ${quote.customerFullName || 'Purchasing Department'}`, col1X, y + 15);
  doc.text(`Email: ${quote.customerEmail}`, col1X, y + 20);
  if (quote.customerMobileNumber) {
    doc.text(`Mobile: ${quote.customerMobileNumber}`, col1X, y + 25);
  }
  if (quote.deliveryAddress || quote.deliveryCityProvince) {
    doc.text(`Destination: ${quote.deliveryAddress || quote.deliveryCityProvince}`, col1X, y + 29);
  }

  // Column 2 Details
  doc.text(`Quotation Date: ${new Date(quote.createdAt).toLocaleDateString()}`, col2X, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()} (${quote.validityDays} Days)`, col2X, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Terms: ${quote.paymentTerms}`, col2X, y + 20);
  doc.text(`VAT Treatment: ${quote.vatType.replace(/_/g, ' ').toUpperCase()}`, col2X, y + 25);
  if (quote.assignedSpecialist) {
    doc.text(`Specialist: ${quote.assignedSpecialist}`, col2X, y + 29);
  }

  y += 36;

  // 3. LINE ITEMS TABLE HEADER
  doc.setFillColor(41, 47, 54);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('#', margin + 3, y + 4.8);
  doc.text('ITEM DESCRIPTION', margin + 12, y + 4.8);
  doc.text('QTY', margin + 115, y + 4.8, { align: 'center' });
  doc.text('UNIT PRICE (PHP)', margin + 148, y + 4.8, { align: 'right' });
  doc.text('LINE TOTAL (PHP)', margin + contentWidth - 3, y + 4.8, { align: 'right' });

  y += 7;

  // 4. LINE ITEMS ROWS
  doc.setFont('helvetica', 'normal');
  const items = quote.items || [];

  items.forEach((item, idx) => {
    // Check if new page is needed
    if (y > 230) {
      doc.addPage();
      y = margin;
    }

    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, contentWidth, 9, 'F');
    }

    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`${idx + 1}`, margin + 3, y + 5.5);

    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    const nameStr = doc.splitTextToSize(item.productName, 98)[0];
    doc.text(nameStr, margin + 12, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    const subStr = [item.brand, item.model, item.sku ? `SKU: ${item.sku}` : ''].filter(Boolean).join(' · ');
    if (subStr) {
      doc.text(subStr, margin + 12, y + 8);
    }

    doc.setFontSize(7.5);
    doc.setTextColor(17, 24, 39);
    doc.text(`${item.quantity}`, margin + 115, y + 5.5, { align: 'center' });

    doc.text(
      `PHP ${Number(item.unitPricePhp).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      margin + 148,
      y + 5.5,
      { align: 'right' }
    );

    doc.setFont('helvetica', 'bold');
    doc.text(
      `PHP ${Number(item.lineTotalPhp).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      margin + contentWidth - 3,
      y + 5.5,
      { align: 'right' }
    );

    doc.setDrawColor(243, 244, 246);
    doc.line(margin, y + 9, margin + contentWidth, y + 9);
    y += 9.5;
  });

  // 5. COMMERCIAL SUMMARY & FINANCIAL BREAKDOWN
  y += 2;
  if (y > 220) {
    doc.addPage();
    y = margin;
  }

  const totalsBoxX = margin + contentWidth - 85;
  const totalsBoxWidth = 85;

  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(totalsBoxX, y, totalsBoxWidth, 38, 2, 2, 'FD');

  let ty = y + 5;
  const leftT = totalsBoxX + 4;
  const rightT = totalsBoxX + totalsBoxWidth - 4;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);

  doc.text('Gross Subtotal:', leftT, ty);
  doc.text(`PHP ${Number(quote.subtotalPhp).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, rightT, ty, { align: 'right' });
  ty += 4.5;

  if (quote.discountAmountPhp > 0) {
    doc.setTextColor(5, 150, 105);
    doc.text(`Discount (${quote.discountType}):`, leftT, ty);
    doc.text(`-PHP ${Number(quote.discountAmountPhp).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, rightT, ty, { align: 'right' });
    ty += 4.5;
    doc.setTextColor(75, 85, 99);
  }

  doc.text('Net of VAT (12% Base):', leftT, ty);
  doc.text(`PHP ${Number(quote.netOfVatPhp).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, rightT, ty, { align: 'right' });
  ty += 4.5;

  doc.text('Value Added Tax (12%):', leftT, ty);
  doc.text(`PHP ${Number(quote.vatAmountPhp).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, rightT, ty, { align: 'right' });
  ty += 4.5;

  if (quote.deliveryFeePhp > 0) {
    doc.text('Freight / Delivery:', leftT, ty);
    doc.text(`PHP ${Number(quote.deliveryFeePhp).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, rightT, ty, { align: 'right' });
    ty += 4.5;
  }

  doc.setDrawColor(209, 213, 219);
  doc.line(totalsBoxX + 2, ty + 1, totalsBoxX + totalsBoxWidth - 2, ty + 1);
  ty += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(181, 18, 27);
  doc.text('GRAND TOTAL (PHP):', leftT, ty);
  doc.text(`PHP ${Number(quote.grandTotalPhp).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, rightT, ty, { align: 'right' });

  // Notes on left side of totals box
  const notesWidth = contentWidth - totalsBoxWidth - 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text('TERMS & WARRANTY CONDITIONS:', margin, y + 5);
  doc.text(`• Warranty: ${quote.warrantyTerms}`, margin, y + 9);
  if (quote.leadTimeDescription) {
    doc.text(`• Lead Time: ${quote.leadTimeDescription}`, margin, y + 13);
  }
  doc.text(`• Payment: ${quote.paymentTerms}`, margin, y + 17);
  doc.text('• Prices valid for the duration indicated above, subject to standard ZEZ terms.', margin, y + 21);
  if (quote.specialInstructions) {
    doc.text(`• Notes: ${quote.specialInstructions}`, margin, y + 25);
  }

  y += 44;

  // 6. OFFICIAL CONFORME & SIGNATURE BLOCK
  if (y > 240) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'D');

  const halfW = contentWidth / 2;
  doc.line(margin + halfW, y, margin + halfW, y + 28);

  // Left Signatory (ZEZ Automation)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 47, 54);
  doc.text('PREPARED BY (ZEZ AUTOMATION):', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.text(quote.assignedSpecialist || 'Authorized Sales Specialist', margin + 4, y + 16);
  doc.setDrawColor(156, 163, 175);
  doc.line(margin + 4, y + 21, margin + halfW - 8, y + 21);
  doc.setFontSize(6.5);
  doc.setTextColor(107, 114, 128);
  doc.text('Authorized Commercial Representative / Date', margin + 4, y + 25);

  // Right Signatory (Client Conforme)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 47, 54);
  doc.text('CONFORME & PURCHASE ACCEPTANCE:', margin + halfW + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  if (quote.clientPoNumber) {
    doc.setTextColor(5, 150, 105);
    doc.text(`Conformed with PO #: ${quote.clientPoNumber}`, margin + halfW + 4, y + 16);
  }
  doc.line(margin + halfW + 4, y + 21, margin + contentWidth - 4, y + 21);
  doc.setFontSize(6.5);
  doc.setTextColor(107, 114, 128);
  doc.text('Signature Over Printed Name / Date / Purchase Order No.', margin + halfW + 4, y + 25);

  // 7. FOOTER
  doc.setFontSize(6.5);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `ZEZ Automation Corporation · Official Quotation ${quote.id} Rev ${quote.revisionNumber} · Generated ${new Date().toISOString()}`,
    margin,
    288
  );
  doc.text('Confidential - For Addressee Only', pageWidth - margin, 288, { align: 'right' });

  return doc;
}

/**
 * Generates and triggers browser download of the genuine corporate PDF.
 */
export function downloadQuotationPdf(quote: Quotation): void {
  const doc = generateQuotationPdf(quote);
  const safeFilename = `${quote.id}_Rev${quote.revisionNumber}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_');
  doc.save(safeFilename);
}

/**
 * Returns raw base64 string of the PDF for email attachments.
 */
export function generateQuotationPdfBase64(quote: Quotation): string {
  const doc = generateQuotationPdf(quote);
  const dataUri = doc.output('datauristring');
  // Strip off the data:application/pdf;filename=generated.pdf;base64, header
  const base64Index = dataUri.indexOf('base64,');
  if (base64Index !== -1) {
    return dataUri.substring(base64Index + 7);
  }
  return '';
}
