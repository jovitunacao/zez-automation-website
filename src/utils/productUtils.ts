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

export type ProductImageCategory = 'supplier-provided' | 'manufacturer-matched' | 'illustrative';

export interface ProductImageMeta {
  status: ProductImageCategory;
  label: string;
  shortLabel: string;
  badgeColor: string;
  isIllustrative: boolean;
  disclaimer?: string;
}

export function getProductImageMetadata(product: Product): ProductImageMeta {
  if (product.imageStatus === 'supplier-provided' || product.mainImage?.startsWith('/catalog/')) {
    return {
      status: 'supplier-provided',
      label: 'Verified Supplier Photo',
      shortLabel: 'Supplier Photo',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      isIllustrative: false
    };
  }
  if (
    product.imageStatus === 'manufacturer-matched' ||
    product.mainImage?.includes('linkbasic.us') ||
    product.sku === 'PNA24-UC6'
  ) {
    return {
      status: 'manufacturer-matched',
      label: 'Manufacturer Reference Photo',
      shortLabel: 'Mfg Match',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
      isIllustrative: false
    };
  }
  return {
    status: 'illustrative',
    label: 'Illustrative Image (Model Photo Pending)',
    shortLabel: 'Illustrative',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    isIllustrative: true,
    disclaimer: 'Illustrative category imagery pending exact-model supplier verification.'
  };
}
