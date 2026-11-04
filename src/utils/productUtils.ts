import { Product } from '../types';

export function getDisplayBrand(brand?: string): string {
  if (!brand || brand.toLowerCase() === 'manufacturer to verify' || brand.toLowerCase() === 'unspecified') {
    return 'Unspecified';
  }
  return brand;
}

export function getProductSalesUnit(product: Product): string {
  if (product.salesUnit) return product.salesUnit;
  const specUnit = product.specifications?.find(
    (s) => s.label.toLowerCase() === 'sales unit'
  )?.value;
  if (specUnit) return specUnit;
  const keyUnit = product.keySpecs
    ?.find((s) => s.toLowerCase().startsWith('unit:'))
    ?.split(':')[1]
    ?.trim();
  if (keyUnit) return keyUnit;
  return 'pc';
}

export type ProductImageCategory = 'supplier-provided' | 'manufacturer-matched' | 'illustrative' | 'pending';

export interface ProductImageMeta {
  status: ProductImageCategory;
  label: string;
  shortLabel: string;
  badgeColor: string;
  isIllustrative: boolean;
  disclaimer?: string;
}

export function getProductImageMetadata(product: Product): ProductImageMeta {
  const mainImage = product.mainImage || '';

  // 1. Pending Placeholder Detection
  if (
    product.imageStatus === 'pending' ||
    mainImage.includes('-pending.svg') ||
    mainImage.includes('image-pending.svg')
  ) {
    return {
      status: 'pending',
      label: 'Official Photo Pending',
      shortLabel: 'Photo Pending',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      isIllustrative: true,
      disclaimer: 'Official manufacturer equipment photograph pending verification. Technical specifications and SKU confirmed.'
    };
  }

  // 2. Strict Supplier-Provided Verification
  // Only true supplier-provided images (explicitly marked or verified supplier assets tsdi- / ffc-)
  const isSupplierAsset =
    mainImage.includes('/catalog/tsdi-') ||
    mainImage.includes('/catalog/ffc-');

  if (product.imageStatus === 'supplier-provided' || isSupplierAsset) {
    return {
      status: 'supplier-provided',
      label: 'Verified Supplier Photo',
      shortLabel: 'Supplier Photo',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      isIllustrative: false
    };
  }

  // 3. Official Manufacturer Matches
  const isManufacturerAsset =
    product.imageStatus === 'manufacturer-matched' ||
    mainImage.includes('/catalog/linkbasic-') ||
    mainImage.includes('linkbasic.us') ||
    product.sku === 'PNA24-UC6';

  if (isManufacturerAsset) {
    return {
      status: 'manufacturer-matched',
      label: 'Official Manufacturer Photo',
      shortLabel: 'Mfg Verified',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      isIllustrative: false
    };
  }

  // 4. Fallback / Illustrative
  return {
    status: 'illustrative',
    label: 'Illustrative Image (Model Photo Pending)',
    shortLabel: 'Illustrative',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    isIllustrative: true,
    disclaimer: 'Illustrative category imagery pending exact-model supplier verification.'
  };
}
