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

export const DEFAULT_PRODUCT_FALLBACK_IMAGE = '/catalog/image-pending.svg';

/**
 * Reusable image error handler to replace broken or failing images with a neutral SVG placeholder
 */
export function handleProductImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  customFallback: string = DEFAULT_PRODUCT_FALLBACK_IMAGE
) {
  const target = event.currentTarget;
  if (!target.src.includes('image-pending.svg')) {
    target.src = customFallback;
  }
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
    product.imageStatus === 'supplier-provided' ||
    (Boolean(mainImage) && (mainImage.includes('/catalog/tsdi-') || mainImage.includes('/catalog/ffc-')));

  if (isSupplierAsset && product.imageStatus !== 'illustrative') {
    return {
      status: 'supplier-provided',
      label: 'Supplier Consignment Photo',
      shortLabel: 'Supplier Photo',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      isIllustrative: false,
      disclaimer: 'Intake photograph from verified supplier consignment package.'
    };
  }

  // 3. Official Manufacturer Matches
  // Only exact-model matches verified against official manufacturer documentation
  const isManufacturerAsset =
    product.imageStatus === 'manufacturer-matched' ||
    (Boolean(mainImage) && (mainImage.includes('/catalog/linkbasic-') || mainImage.includes('linkbasic.us') || product.sku === 'PNA24-UC6'));

  if (isManufacturerAsset && product.imageStatus !== 'illustrative') {
    return {
      status: 'manufacturer-matched',
      label: 'Manufacturer Reference Photo',
      shortLabel: 'Mfg Reference',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      isIllustrative: false,
      disclaimer: 'Equipment photograph matched against manufacturer datasheet and specifications.'
    };
  }

  // 4. Fallback / Illustrative / Staff Uploads
  // Transparently labeled so users/admins know it is a storefront reference photo
  return {
    status: 'illustrative',
    label: 'Storefront Reference Photo',
    shortLabel: 'Reference Photo',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    isIllustrative: true,
    disclaimer: 'Product photograph for visual reference. Technical specifications, part numbers, and SRP are authoritative.'
  };
}
