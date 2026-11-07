import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  QuotationRequest, 
  Product, 
  AdministratorUser, 
  AdminRole, 
  RfqNotificationLog, 
  NotificationQuotaStats 
} from '../types';

export interface ContactInquiryPayload {
  name: string;
  company: string;
  email: string;
  phone: string;
  department: string;
  subject?: string;
  message: string;
}

export interface AdminAuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    fullName?: string;
    role?: AdminRole;
    receiveRfqNotifications?: boolean;
  };
  error?: string;
}

/**
 * Maps database snake_case row to frontend Product model
 */
function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.sku,
    model: row.model,
    name: row.name,
    brand: row.brand,
    categoryId: row.category_id || '',
    categoryName: row.category_name,
    shortDescription: row.short_description || '',
    fullDescription: row.full_description || '',
    pricePhp: row.price_php !== null ? Number(row.price_php) : undefined,
    isPriceNegotiable: Boolean(row.is_price_negotiable),
    stockStatus: row.stock_status,
    leadTimeDays: row.lead_time_days ? Number(row.lead_time_days) : 1,
    warranty: row.warranty || '1-Year Warranty',
    isFeatured: Boolean(row.is_featured),
    isNewArrival: Boolean(row.is_new_arrival),
    mainImage: row.main_image,
    galleryImages: Array.isArray(row.gallery_images) ? row.gallery_images : [row.main_image],
    keySpecs: Array.isArray(row.key_specs) ? row.key_specs : [],
    specifications: Array.isArray(row.specifications) ? row.specifications : [],
    includedAccessories: Array.isArray(row.included_accessories) ? row.included_accessories : [],
    datasheetUrl: row.datasheet_url || undefined,
    datasheetFileName: row.datasheet_file_name || undefined,
    isDemo: Boolean(row.is_demo),
    isPublished: row.is_published !== undefined && row.is_published !== null ? Boolean(row.is_published) : true,
    imageStatus: row.image_status || undefined
  };
}

/**
 * Maps frontend Product model to database snake_case row
 */
function mapProductToRow(prod: Product): any {
  return {
    id: prod.id,
    sku: prod.sku,
    model: prod.model,
    name: prod.name,
    brand: prod.brand,
    category_id: prod.categoryId,
    category_name: prod.categoryName,
    short_description: prod.shortDescription,
    full_description: prod.fullDescription,
    price_php: prod.pricePhp ?? null,
    is_price_negotiable: prod.isPriceNegotiable ?? true,
    stock_status: prod.stockStatus,
    lead_time_days: prod.leadTimeDays ?? 1,
    warranty: prod.warranty,
    is_featured: prod.isFeatured ?? false,
    is_new_arrival: prod.isNewArrival ?? false,
    is_published: prod.isPublished !== undefined ? Boolean(prod.isPublished) : true,
    main_image: prod.mainImage,
    gallery_images: prod.galleryImages && prod.galleryImages.length > 0 ? prod.galleryImages : [prod.mainImage],
    key_specs: prod.keySpecs || [],
    specifications: prod.specifications || [],
    included_accessories: prod.includedAccessories || [],
    datasheet_url: prod.datasheetUrl || null,
    datasheet_file_name: prod.datasheetFileName || null,
    is_demo: Boolean(prod.isDemo),
    image_status: prod.imageStatus || null,
    updated_at: new Date().toISOString()
  };
}

// -----------------------------------------------------------------------------
// PRODUCT MANAGEMENT (Supabase Cloud Database Persistence)
// -----------------------------------------------------------------------------

/**
 * Fetches products from Supabase PostgreSQL database.
 * If includeUnpublished is true (for authenticated admins), retrieves all records.
 * Returns null if Supabase is not configured or table has no records.
 */
export async function fetchProductsFromSupabase(includeUnpublished = false): Promise<{ data: Product[] | null; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null };
  }

  try {
    let query = supabase
      .from('products')
      .select('*');

    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[ZEZ Supabase] Error fetching products:', error.message);
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [] };
    }

    const mappedProducts = data.map(mapRowToProduct);
    return { data: mappedProducts };
  } catch (err: any) {
    console.warn('[ZEZ Supabase] Unexpected error fetching products:', err.message);
    return { data: null, error: err.message };
  }
}

/**
 * Inserts a new product into Supabase PostgreSQL (Authorized Admins only).
 * Uses .select() to verify at least one database row was inserted.
 */
export async function createProductInSupabase(product: Product): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: true };
  }

  try {
    const row = mapProductToRow(product);
    const { data, error } = await supabase
      .from('products')
      .insert(row)
      .select('id, sku');

    if (error) {
      console.error('[ZEZ Supabase] Error adding product to database:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      console.error('[ZEZ Supabase] Insert affected 0 rows. Insufficient administrator privileges or policy rejection.');
      return { 
        success: false, 
        error: 'Database operation affected 0 rows. Please verify active administrator authentication and permissions.' 
      };
    }

    console.info(`[ZEZ Supabase] Product ${product.sku} successfully persisted to Supabase.`);
    return { success: true };
  } catch (err: any) {
    console.error('[ZEZ Supabase] Exception adding product:', err);
    return { success: false, error: err.message || 'Unknown database error' };
  }
}

/**
 * Updates an existing product in Supabase PostgreSQL (Authorized Admins only).
 * Uses .select() to verify at least one database row was updated.
 */
export async function updateProductInSupabase(product: Product): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: true };
  }

  try {
    const row = mapProductToRow(product);
    const { data, error } = await supabase
      .from('products')
      .update(row)
      .eq('id', product.id)
      .select('id, sku');

    if (error) {
      console.error('[ZEZ Supabase] Error updating product in database:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      console.error(`[ZEZ Supabase] Update affected 0 rows for product ${product.id}.`);
      return { 
        success: false, 
        error: 'Database update affected 0 rows. The record was not found or administrator permissions were denied.' 
      };
    }

    console.info(`[ZEZ Supabase] Product ${product.id} successfully updated in Supabase.`);
    return { success: true };
  } catch (err: any) {
    console.error('[ZEZ Supabase] Exception updating product:', err);
    return { success: false, error: err.message || 'Unknown database error' };
  }
}

/**
 * Deletes a product from Supabase PostgreSQL (Authorized Admins only).
 * Uses .select() to verify at least one database row was deleted.
 */
export async function deleteProductInSupabase(productId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: true };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .select('id');

    if (error) {
      console.error('[ZEZ Supabase] Error deleting product from database:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      console.error(`[ZEZ Supabase] Delete affected 0 rows for product ${productId}.`);
      return { 
        success: false, 
        error: 'Database delete affected 0 rows. The record was not found or administrator permissions were denied.' 
      };
    }

    console.info(`[ZEZ Supabase] Product ${productId} successfully deleted from Supabase.`);
    return { success: true };
  } catch (err: any) {
    console.error('[ZEZ Supabase] Exception deleting product:', err);
    return { success: false, error: err.message || 'Unknown database error' };
  }
}

// -----------------------------------------------------------------------------
// QUOTATION SYSTEM (Atomic, Reliable Saving of RFQ & Line Items)
// -----------------------------------------------------------------------------

/**
 * Reliably saves an RFQ and all requested line items to Supabase PostgreSQL.
 * Ensures the complete quotation is confirmed in the database before returning success.
 * If line items fail, the parent quote is safely rolled back to prevent incomplete records.
 */
export async function syncRfqToSupabase(rfq: QuotationRequest): Promise<{ 
  success: boolean; 
  isDemoMode?: boolean; 
  serverRfqId?: string;
  error?: string 
}> {
  if (!isSupabaseConfigured() || !supabase) {
    // Return explicit demonstration mode simulation
    return { 
      success: true, 
      isDemoMode: true 
    };
  }

  if (!rfq.items || rfq.items.length === 0) {
    return { success: false, error: 'Quotation cart is empty. Cannot submit empty RFQ.' };
  }

  try {
    // Map items to exact JSON payload schema expected by submit_quotation_request(payload JSONB)
    const itemsPayload = rfq.items.map(item => ({
      product_id: item.productId || null,
      product_name: item.productName,
      model: item.model || 'Standard Model',
      brand: item.brand || 'Generic',
      sku: item.sku || 'ZEZ-ITEM',
      main_image: item.mainImage || null,
      quantity: Math.max(1, Math.floor(item.quantity)),
      unit_price_php: item.unitPricePhp !== undefined ? Number(item.unitPricePhp) : null,
      subtotal_php: item.subtotalPhp !== undefined ? Number(item.subtotalPhp) : null,
      notes: item.notes || null
    }));

    const rpcPayload = {
      customer_full_name: rfq.customer.fullName,
      customer_company_name: rfq.customer.companyName || null,
      customer_email: rfq.customer.email,
      customer_mobile_number: rfq.customer.mobileNumber,
      delivery_city_province: rfq.customer.deliveryCityProvince || 'Metro Manila',
      delivery_address: rfq.customer.deliveryAddress || null,
      tin_number: rfq.customer.tinNumber || null,
      customer_type: rfq.customer.customerType || 'Company',
      preferred_contact_method: rfq.customer.preferredContactMethod || 'Email',
      target_delivery_date: rfq.customer.targetDeliveryDate || null,
      additional_requirements: rfq.customer.additionalRequirements || null,
      items: itemsPayload
    };

    // Call atomic SECURITY DEFINER stored procedure on PostgreSQL
    const { data: rpcData, error: rpcError } = await supabase.rpc('submit_quotation_request', {
      payload: rpcPayload
    });

    if (rpcError) {
      console.error('[ZEZ Supabase] Atomic submit_quotation_request RPC failed:', rpcError);
      return { 
        success: false, 
        error: `Database quotation submission failed: ${rpcError.message}` 
      };
    }

    const serverRfqId = rpcData?.rfq_id || rfq.id;
    console.info(`[ZEZ Supabase] Atomic quotation successfully persisted with reference ID: ${serverRfqId}`);

    // Single Dispatch Principle: Automatic dispatch is strictly handled server-side
    // via Supabase Database Webhook on public.quotation_requests (INSERT) -> notify-rfq.
    // Client-side execution here is omitted to eliminate race conditions and dual-dispatch.

    return { 
      success: true, 
      serverRfqId,
      isDemoMode: false
    };
  } catch (err: any) {
    console.error('[ZEZ Supabase] Network exception during atomic RFQ submission:', err);
    return { 
      success: false, 
      error: err.message || 'Unexpected network or database failure during RFQ transmission' 
    };
  }
}

/**
 * Fetches all quotation requests and line items for the Admin Dashboard.
 */
export async function fetchAdminRfqsFromSupabase(): Promise<QuotationRequest[] | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data: rfqsData, error: rfqsError } = await supabase
      .from('quotation_requests')
      .select('*, quotation_items(*)')
      .order('created_at', { ascending: false });

    if (rfqsError) {
      console.warn('[ZEZ Supabase] Error fetching admin RFQs:', rfqsError.message);
      return null;
    }

    if (!rfqsData) return null;

    const mapped: QuotationRequest[] = rfqsData.map(row => ({
      id: row.id,
      createdAt: row.created_at,
      status: row.status,
      customer: {
        fullName: row.customer_full_name,
        companyName: row.customer_company_name || '',
        email: row.customer_email,
        mobileNumber: row.customer_mobile_number,
        deliveryCityProvince: row.delivery_city_province,
        deliveryAddress: row.delivery_address || '',
        tinNumber: row.tin_number || '',
        customerType: row.customer_type,
        preferredContactMethod: row.preferred_contact_method,
        targetDeliveryDate: row.target_delivery_date || undefined,
        additionalRequirements: row.additional_requirements || ''
      },
      items: (row.quotation_items || []).map((it: any) => ({
        productId: it.product_id || '',
        productName: it.product_name,
        model: it.model,
        brand: it.brand,
        sku: it.sku,
        mainImage: it.main_image || '',
        quantity: it.quantity,
        unitPricePhp: it.unit_price_php !== null ? Number(it.unit_price_php) : undefined,
        subtotalPhp: it.subtotal_php !== null ? Number(it.subtotal_php) : undefined,
        notes: it.notes || ''
      })),
      totalEstimatedPhp: row.total_estimated_php !== null ? Number(row.total_estimated_php) : undefined,
      adminNotes: row.admin_notes || '',
      assignedSpecialist: row.assigned_specialist || 'Marco Rivera (Enterprise Account Manager)',
      validUntil: row.valid_until || '',
      isDemo: Boolean(row.is_demo)
    }));

    return mapped;
  } catch (err: any) {
    console.warn('[ZEZ Supabase] Unexpected error fetching RFQs:', err);
    return null;
  }
}

/**
 * Updates an RFQ status in Supabase (Authorized Administrators only).
 */
export async function syncRfqStatusToSupabase(rfqId: string, status: string, notes?: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return true;
  }

  try {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (notes !== undefined) {
      updateData.admin_notes = notes;
    }

    const { error } = await supabase
      .from('quotation_requests')
      .update(updateData)
      .eq('id', rfqId);

    if (error) {
      console.warn('[ZEZ Supabase] Error updating RFQ status:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[ZEZ Supabase] Unexpected error updating status:', err);
    return false;
  }
}

/**
 * Saves a customer inquiry from the Contact Us form into Supabase.
 */
export async function syncContactInquiryToSupabase(payload: ContactInquiryPayload): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('customer_inquiries')
      .insert({
        name: payload.name,
        company: payload.company || null,
        email: payload.email,
        phone: payload.phone,
        department: payload.department,
        subject: payload.subject || null,
        message: payload.message,
        status: 'New'
      });

    if (error) {
      console.warn('[ZEZ Supabase] Error saving customer inquiry:', error.message);
      return { success: false, error: error.message };
    }

    console.info('[ZEZ Supabase] Contact inquiry saved to Supabase.');
    return { success: true };
  } catch (err: any) {
    console.warn('[ZEZ Supabase] Unexpected error saving inquiry:', err);
    return { success: false, error: err.message };
  }
}

// -----------------------------------------------------------------------------
// ADMINISTRATOR AUTHENTICATION & RBAC
// -----------------------------------------------------------------------------

/**
 * Signs in an administrator using Supabase Auth.
 * Performs server-side RBAC validation against the public.administrator_users table.
 * Non-admin users are automatically signed out.
 */
export async function signInAdministrator(email: string, password: string): Promise<AdminAuthResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Supabase is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
    };
  }

  try {
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || 'Invalid administrator email or password.'
      };
    }

    const userId = authData.user.id;

    // 2. Server-side verification in administrator_users table
    const { data: adminData, error: adminError } = await supabase
      .from('administrator_users')
      .select('id, email, full_name, role, is_active, receive_rfq_notifications')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (adminError || !adminData) {
      // Immediate security ejection: account has auth credentials but is NOT in administrator_users
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Access Denied: This account is authenticated but does not possess authorized administrator permissions for ZEZ Automation.'
      };
    }

    return {
      success: true,
      user: {
        id: adminData.id,
        email: adminData.email,
        fullName: adminData.full_name,
        role: adminData.role,
        receiveRfqNotifications: adminData.receive_rfq_notifications !== false
      }
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'An unexpected error occurred during administrator authentication.'
    };
  }
}

/**
 * Signs out the active administrator session.
 */
export async function signOutAdministrator(): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    await supabase.auth.signOut();
  }
}

/**
 * Checks if current active Supabase Auth session belongs to a valid administrator.
 */
export async function checkActiveAdminSession(): Promise<AdminAuthResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session || !sessionData.session.user) {
      return { success: false };
    }

    const userId = sessionData.session.user.id;

    const { data: adminData, error } = await supabase
      .from('administrator_users')
      .select('id, email, full_name, role, is_active, receive_rfq_notifications')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !adminData) {
      return { success: false };
    }

    return {
      success: true,
      user: {
        id: adminData.id,
        email: adminData.email,
        fullName: adminData.full_name,
        role: adminData.role,
        receiveRfqNotifications: adminData.receive_rfq_notifications !== false
      }
    };
  } catch (e) {
    return { success: false };
  }
}

// -----------------------------------------------------------------------------
// SUPABASE STORAGE MANAGEMENT (Dedicated 'product-images' bucket)
// -----------------------------------------------------------------------------

export interface UploadImageResult {
  success: boolean;
  publicUrl?: string;
  filePath?: string;
  error?: string;
}

// Strictly allowed formats per production requirements: JPG, PNG, WebP only
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Uploads a product photograph to the dedicated 'product-images' Supabase Storage bucket.
 * Strictly validates file format (JPG, PNG, WebP) and maximum file size (10 MB).
 * Enforces active administrator permissions on the database storage policies.
 */
export async function uploadProductImageToSupabase(
  file: File,
  sku?: string
): Promise<UploadImageResult> {
  // 1. File size validation (Strict 10MB limit)
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      success: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 10 MB. Please select an image under 10 MB.`
    };
  }

  // 2. Strict format validation: JPG, PNG, WebP only
  const fileNameLower = (file.name || '').toLowerCase();
  const fileTypeLower = (file.type || '').toLowerCase();
  const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.some(ext => fileNameLower.endsWith(ext));
  const hasValidMime = ALLOWED_IMAGE_MIME_TYPES.includes(fileTypeLower);

  // If MIME is provided and invalid, or if extension is invalid
  if (!hasValidExt || (!hasValidMime && fileTypeLower && fileTypeLower !== 'application/octet-stream')) {
    return {
      success: false,
      error: 'Unsupported image format. Only JPG, PNG, and WebP photographs up to 10 MB are permitted.'
    };
  }

  // Determine explicit sanitized content-type for Supabase Storage
  let contentType = 'image/jpeg';
  if (fileNameLower.endsWith('.png') || fileTypeLower === 'image/png') {
    contentType = 'image/png';
  } else if (fileNameLower.endsWith('.webp') || fileTypeLower === 'image/webp') {
    contentType = 'image/webp';
  }

  // 3. Generate sanitized, unique storage path
  const cleanSku = (sku || 'custom-equipment').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  const uniqueId = Math.random().toString(36).substring(2, 8);
  const filePath = `products/${cleanSku}/${Date.now()}-${uniqueId}-${cleanFileName}`;

  // 4. Supabase Storage upload
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: contentType
        });

      if (error) {
        console.error('[ZEZ Storage] Image upload error:', error.message);
        let humanMessage = error.message;
        if (
          error.message?.toLowerCase().includes('row-level security') ||
          error.message?.toLowerCase().includes('violates') ||
          error.message?.toLowerCase().includes('unauthorized') ||
          error.message?.toLowerCase().includes('permission')
        ) {
          humanMessage = 'Storage upload denied by security policy. Please ensure you are logged in as an active administrator.';
        }
        return { success: false, error: humanMessage };
      }

      // Retrieve public URL from bucket
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        return { success: false, error: 'Could not obtain public URL for uploaded photograph.' };
      }

      return {
        success: true,
        publicUrl: urlData.publicUrl,
        filePath
      };
    } catch (err: any) {
      console.error('[ZEZ Storage] Unexpected error uploading image:', err.message);
      return { success: false, error: err.message || 'Network error uploading photograph.' };
    }
  }

  // 5. Fallback for local demo mode without configured Supabase
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        success: true,
        publicUrl: reader.result as string,
        filePath
      });
    };
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read selected image file.'
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Safely removes an uploaded photograph from the 'product-images' Supabase Storage bucket.
 * Strict safeguards:
 *   - Never deletes local /catalog/ files, data URLs, or external assets
 *   - Only removes files stored within the 'product-images' bucket
 */
export async function deleteProductImageFromSupabase(filePathOrUrl: string): Promise<{ success: boolean; error?: string }> {
  if (!filePathOrUrl) {
    return { success: true };
  }

  // Never delete local bundled assets, data URLs, or blob URLs
  if (
    filePathOrUrl.startsWith('/catalog/') || 
    filePathOrUrl.startsWith('data:') || 
    filePathOrUrl.startsWith('blob:')
  ) {
    return { success: true };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return { success: true };
  }

  try {
    let path = filePathOrUrl;
    // Extract the relative path within the 'product-images' bucket
    if (path.includes('/product-images/')) {
      path = path.split('/product-images/')[1].split('?')[0];
    }

    // Only proceed if it is an actual storage object within product-images (not external URLs)
    if (path && !path.startsWith('http://') && !path.startsWith('https://')) {
      const decodedPath = decodeURIComponent(path);
      const { error } = await supabase.storage.from('product-images').remove([decodedPath]);
      if (error) {
        console.warn('[ZEZ Storage] Error deleting image from storage:', error.message);
        return { success: false, error: error.message };
      }
      console.info(`[ZEZ Storage] Cleaned up unused file from product-images: ${decodedPath}`);
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[ZEZ Storage] Exception deleting image:', err.message);
    return { success: false, error: err.message };
  }
}

// -----------------------------------------------------------------------------
// PHASE 4: RFQ EMAIL NOTIFICATIONS & ADMINISTRATOR MANAGEMENT (SERVER-SIDE)
// -----------------------------------------------------------------------------

/**
 * Triggers the server-side notify-rfq Supabase Edge Function asynchronously.
 * Fire-and-forget: RFQ saving is never blocked even if the notification server is cold-starting.
 */
export function triggerRfqNotificationBackground(rfqId: string): void {
  const client = supabase;
  if (!isSupabaseConfigured() || !client || !rfqId) return;

  // Note: The PostgreSQL trigger trg_queue_rfq_notifications automatically queues and dispatches
  // RFQs on the server side upon insertion. If an active administrator session is present in the browser
  // (e.g. testing RFQ submission from the portal), we also fire an immediate Edge Function pass.
  client.auth.getSession().then(({ data: sessionData }) => {
    if (sessionData?.session?.access_token) {
      client.functions
        .invoke('notify-rfq', {
          body: { rfq_id: rfqId }
        })
        .then(({ data, error }) => {
          if (error) {
            console.warn('[ZEZ Notifications] Background notify-rfq note:', error.message);
          } else {
            console.info('[ZEZ Notifications] notify-rfq Edge Function response:', data);
          }
        })
        .catch(err => {
          console.warn('[ZEZ Notifications] Network exception invoking notify-rfq:', err);
        });
    }
  }).catch(() => {
    // Handled server-side by PostgreSQL trigger
  });
}

/**
 * Fetches all administrator accounts for the Super Admin management directory.
 */
export async function fetchAdministratorUsersFromSupabase(): Promise<AdministratorUser[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('administrator_users')
      .select('id, email, full_name, role, is_active, receive_rfq_notifications, created_at, updated_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[ZEZ Admins] Error fetching administrator directory:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map(row => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role as AdminRole,
      isActive: Boolean(row.is_active),
      receiveRfqNotifications: row.receive_rfq_notifications !== false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (err: any) {
    console.warn('[ZEZ Admins] Unexpected error fetching administrators:', err);
    return [];
  }
}

/**
 * Invites a new administrator via the server-side manage-admin Edge Function.
 * Uses the Supabase Auth Admin API server-side without exposing service role keys.
 */
export async function inviteAdministratorUser(payload: {
  email: string;
  fullName: string;
  role: AdminRole;
  receiveRfqNotifications?: boolean;
}): Promise<{ success: boolean; administrator?: AdministratorUser; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('manage-admin', {
      body: {
        action: 'invite',
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role,
        receiveRfqNotifications: payload.receiveRfqNotifications !== false
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Failed to invite administrator.' };
    }

    return {
      success: true,
      administrator: data.administrator
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error inviting administrator.' };
  }
}

/**
 * Updates an administrator's role, active status, or notification preference via Edge Function.
 */
export async function updateAdministratorUser(
  targetAdminId: string,
  updates: {
    role?: AdminRole;
    isActive?: boolean;
    receiveRfqNotifications?: boolean;
    fullName?: string;
  }
): Promise<{ success: boolean; administrator?: AdministratorUser; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('manage-admin', {
      body: {
        action: 'update',
        targetAdminId,
        ...updates
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Failed to update administrator.' };
    }

    return {
      success: true,
      administrator: data.administrator
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error updating administrator.' };
  }
}

/**
 * Deletes an administrator account via the manage-admin Edge Function.
 */
export async function deleteAdministratorUser(targetAdminId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('manage-admin', {
      body: {
        action: 'delete',
        targetAdminId
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Failed to delete administrator.' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error deleting administrator.' };
  }
}

/**
 * Updates the logged-in administrator's own RFQ email notification preference.
 */
export async function updateOwnNotificationPreference(
  receiveNotifications: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: true };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      return { success: false, error: 'Not authenticated.' };
    }

    const { error } = await supabase
      .from('administrator_users')
      .update({
        receive_rfq_notifications: receiveNotifications,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetches delivery logs from public.rfq_notification_logs for audit and history tracking.
 */
export async function fetchRfqNotificationLogsFromSupabase(limit = 50): Promise<RfqNotificationLog[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('rfq_notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[ZEZ Notification Logs] Query note:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map(row => ({
      id: row.id,
      rfqId: row.rfq_id,
      recipientEmail: row.recipient_email,
      recipientName: row.recipient_name,
      recipientRole: row.recipient_role,
      adminId: row.admin_id,
      status: row.status,
      resendId: row.resend_id,
      attemptCount: row.attempt_count || 0,
      maxAttempts: row.max_attempts || 3,
      lastAttemptAt: row.last_attempt_at,
      sentAt: row.sent_at,
      errorMessage: row.error_message,
      customerSummary: row.customer_summary,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (err: any) {
    console.warn('[ZEZ Notification Logs] Exception fetching logs:', err);
    return [];
  }
}

/**
 * Retries a failed notification log entry.
 */
export async function retryFailedRfqNotification(logId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('retry_failed_rfq_notification', {
      p_log_id: logId
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    if (!rpcData?.success) {
      return { success: false, error: rpcData?.error || 'Failed to re-queue notification.' };
    }

    // Trigger dispatcher in background
    supabase.functions.invoke('notify-rfq', {
      body: { process_pending: true }
    }).catch(() => {});

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Dispatches all pending RFQ notifications in the queue.
 */
export async function dispatchPendingRfqNotifications(): Promise<{
  success: boolean;
  dispatched?: number;
  failed?: number;
  error?: string;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('notify-rfq', {
      body: { process_pending: true }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      dispatched: data?.dispatched || 0,
      failed: data?.failed || 0
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetches notification statistics and Resend Free tier quota usage.
 */
export async function fetchNotificationQuotaStatsFromSupabase(): Promise<NotificationQuotaStats> {
  const defaultStats: NotificationQuotaStats = {
    todaySentCount: 0,
    monthSentCount: 0,
    pendingCount: 0,
    failedCount: 0,
    dailyLimit: 100,
    monthlyLimit: 3000,
    lastRefreshedAt: new Date().toISOString()
  };

  if (!isSupabaseConfigured() || !supabase) {
    return defaultStats;
  }

  try {
    const { data: rpcData, error } = await supabase.rpc('get_notification_stats');
    if (!error && rpcData) {
      return {
        todaySentCount: Number(rpcData.today_sent_count) || 0,
        monthSentCount: Number(rpcData.month_sent_count) || 0,
        pendingCount: Number(rpcData.pending_count) || 0,
        failedCount: Number(rpcData.failed_count) || 0,
        dailyLimit: Number(rpcData.daily_limit) || 100,
        monthlyLimit: Number(rpcData.monthly_limit) || 3000,
        lastRefreshedAt: rpcData.refreshed_at || new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn('[ZEZ Notification Stats] RPC error, computing fallback:', err);
  }

  return defaultStats;
}


