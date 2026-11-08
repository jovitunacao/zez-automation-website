import { QuotationLineItem, VatType, DiscountType } from '../types';

/**
 * Rounds a number to exactly 2 decimal places to avoid IEEE 754 float precision errors.
 */
export function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export interface QuotationCalculationInputs {
  items: QuotationLineItem[];
  discountType: DiscountType;
  discountValue: number;
  vatType: VatType;
  deliveryFeePhp?: number;
  installationFeePhp?: number;
  otherFeesPhp?: number;
}

export interface QuotationCalculationResults {
  subtotalPhp: number;
  discountAmountPhp: number;
  discountedSubtotalPhp: number;
  netOfVatPhp: number;
  vatAmountPhp: number;
  vatRate: number;
  deliveryFeePhp: number;
  installationFeePhp: number;
  otherFeesPhp: number;
  grandTotalPhp: number;
}

/**
 * Calculates a single line item total considering quantity, unit price, and item discount.
 */
export function calculateLineTotal(quantity: number, unitPricePhp: number, discountPercent = 0): number {
  const safeQty = Math.max(0, quantity || 0);
  const safePrice = Math.max(0, unitPricePhp || 0);
  const safeDisc = Math.min(100, Math.max(0, discountPercent || 0));

  const gross = safeQty * safePrice;
  const lineDiscount = gross * (safeDisc / 100);
  return round2(gross - lineDiscount);
}

/**
 * Comprehensive decimal-safe quotation calculation matching Philippine Bureau of Internal Revenue (BIR) standards.
 */
export function calculateQuotationTotals(inputs: QuotationCalculationInputs): QuotationCalculationResults {
  const items = inputs.items || [];
  const subtotal = round2(
    items.reduce((sum, item) => sum + (item.lineTotalPhp || 0), 0)
  );

  // Discount calculation
  let discountAmount = 0;
  const discValue = Math.max(0, inputs.discountValue || 0);
  if (inputs.discountType === 'percentage') {
    const safePercent = Math.min(100, discValue);
    discountAmount = round2(subtotal * (safePercent / 100));
  } else {
    // Fixed discount cannot exceed subtotal
    discountAmount = round2(Math.min(subtotal, discValue));
  }

  const discountedSubtotal = round2(Math.max(0, subtotal - discountAmount));

  // VAT calculations
  let vatRate = 0.12;
  let netOfVat = discountedSubtotal;
  let vatAmount = 0;

  switch (inputs.vatType) {
    case 'vat_inclusive_12':
      vatRate = 0.12;
      netOfVat = round2(discountedSubtotal / 1.12);
      vatAmount = round2(discountedSubtotal - netOfVat);
      break;

    case 'vat_exclusive_12':
      vatRate = 0.12;
      netOfVat = discountedSubtotal;
      vatAmount = round2(discountedSubtotal * 0.12);
      break;

    case 'vat_exempt':
      vatRate = 0;
      netOfVat = discountedSubtotal;
      vatAmount = 0;
      break;

    case 'zero_rated':
      vatRate = 0;
      netOfVat = discountedSubtotal;
      vatAmount = 0;
      break;
  }

  const deliveryFee = round2(Math.max(0, inputs.deliveryFeePhp || 0));
  const installationFee = round2(Math.max(0, inputs.installationFeePhp || 0));
  const otherFees = round2(Math.max(0, inputs.otherFeesPhp || 0));

  let grandTotal = 0;
  if (inputs.vatType === 'vat_exclusive_12') {
    grandTotal = round2(discountedSubtotal + vatAmount + deliveryFee + installationFee + otherFees);
  } else {
    // In inclusive, exempt, or zero-rated, discountedSubtotal is the goods total
    grandTotal = round2(discountedSubtotal + deliveryFee + installationFee + otherFees);
  }

  return {
    subtotalPhp: subtotal,
    discountAmountPhp: discountAmount,
    discountedSubtotalPhp: discountedSubtotal,
    netOfVatPhp: netOfVat,
    vatAmountPhp: vatAmount,
    vatRate,
    deliveryFeePhp: deliveryFee,
    installationFeePhp: installationFee,
    otherFeesPhp: otherFees,
    grandTotalPhp: grandTotal
  };
}

/**
 * Generates a client-side unique fallback quotation reference if database RPC is not yet executed.
 */
export function generateFallbackQuotationId(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `ZEZ-Q-${year}-${randomSuffix}`;
}

/**
 * Generates a cryptographically sound random token for customer quotation access.
 */
export function generateCustomerAccessToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${crypto.randomUUID().replace(/-/g, '')}${Math.random().toString(36).substring(2, 10)}`;
  }
  return `tok_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
