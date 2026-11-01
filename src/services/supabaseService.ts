import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { QuotationRequest, Product } from '../types';

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
    role?: string;
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
    isDemo: Boolean(row.is_demo)
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
    is_published: true,
    main_image: prod.mainImage,
    gallery_images: prod.galleryImages && prod.galleryImages.length > 0 ? prod.galleryImages : [prod.mainImage],
    key_specs: prod.keySpecs || [],
    specifications: prod.specifications || [],
    included_accessories: prod.includedAccessories || [],
    datasheet_url: prod.datasheetUrl || null,
    datasheet_file_name: prod.datasheetFileName || null,
    is_demo: Boolean(prod.isDemo),
    updated_at: new Date().toISOString()
  };
}

// -----------------------------------------------------------------------------
// PRODUCT MANAGEMENT (Supabase Cloud Database Persistence)
// -----------------------------------------------------------------------------

/**
 * Fetches all published products from Supabase PostgreSQL database.
 * Returns null if Supabase is not configured or table has no records.
 */
export async function fetchProductsFromSupabase(): Promise<{ data: Product[] | null; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[ZEZ Supabase] Error fetching products:', error.message);
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: null };
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
 */
export async function createProductInSupabase(product: Product): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: true };
  }

  try {
    const row = mapProductToRow(product);
    const { error } = await supabase
      .from('products')
      .insert(row);

    if (error) {
      console.error('[ZEZ Supabase] Error adding product to database:', error);
      return { success: false, error: error.message };
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
 */
export async function updateProductInSupabase(product: Product): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: true };
  }

  try {
    const row = mapProductToRow(product);
    const { error } = await supabase
      .from('products')
      .update(row)
      .eq('id', product.id);

    if (error) {
      console.error('[ZEZ Supabase] Error updating product in database:', error);
      return { success: false, error: error.message };
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
 */
export async function deleteProductInSupabase(productId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('[ZEZ Supabase] Error deleting product from database:', error);
      return { success: false, error: error.message };
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
export async function syncRfqToSupabase(rfq: QuotationRequest): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    // Local development/demo fallback
    return { success: true };
  }

  if (!rfq.items || rfq.items.length === 0) {
    return { success: false, error: 'Quotation cart is empty. Cannot submit empty RFQ.' };
  }

  try {
    // Attempt 1: Call atomic database RPC function if installed
    const itemsPayload = rfq.items.map(item => ({
      product_id: item.productId,
      product_name: item.productName,
      model: item.model,
      brand: item.brand,
      sku: item.sku,
      main_image: item.mainImage,
      quantity: item.quantity,
      unit_price_php: item.unitPricePhp || null,
      subtotal_php: item.subtotalPhp || null,
      notes: item.notes || null
    }));

    const { data: rpcData, error: rpcError } = await supabase.rpc('submit_quotation_request', {
      p_rfq_id: rfq.id,
      p_customer_full_name: rfq.customer.fullName,
      p_customer_company_name: rfq.customer.companyName || null,
      p_customer_email: rfq.customer.email,
      p_customer_mobile_number: rfq.customer.mobileNumber,
      p_delivery_city_province: rfq.customer.deliveryCityProvince,
      p_delivery_address: rfq.customer.deliveryAddress || null,
      p_tin_number: rfq.customer.tinNumber || null,
      p_customer_type: rfq.customer.customerType || 'Company',
      p_preferred_contact_method: rfq.customer.preferredContactMethod || 'Email',
      p_target_delivery_date: rfq.customer.targetDeliveryDate || null,
      p_additional_requirements: rfq.customer.additionalRequirements || null,
      p_total_estimated_php: rfq.totalEstimatedPhp || 0,
      p_valid_until: rfq.validUntil || null,
      p_items: itemsPayload
    });

    if (!rpcError) {
      console.info(`[ZEZ Supabase] Atomic RPC successfully saved RFQ ${rfq.id} with ${rfq.items.length} line items.`);
      return { success: true };
    }

    // Attempt 2: Fallback to direct two-step insert if RPC function is not yet migrated
    console.info('[ZEZ Supabase] Falling back to standard direct inserts for RFQ:', rpcError.message);

    // Step A: Insert Quotation Request Record with clean client-side defaults
    const { error: rfqError } = await supabase
      .from('quotation_requests')
      .insert({
        id: rfq.id,
        status: 'New', // Enforce 'New' status on creation
        customer_full_name: rfq.customer.fullName,
        customer_company_name: rfq.customer.companyName || null,
        customer_email: rfq.customer.email,
        customer_mobile_number: rfq.customer.mobileNumber,
        delivery_city_province: rfq.customer.deliveryCityProvince,
        delivery_address: rfq.customer.deliveryAddress || null,
        tin_number: rfq.customer.tinNumber || null,
        customer_type: rfq.customer.customerType || 'Company',
        preferred_contact_method: rfq.customer.preferredContactMethod || 'Email',
        target_delivery_date: rfq.customer.targetDeliveryDate || null,
        additional_requirements: rfq.customer.additionalRequirements || null,
        total_estimated_php: rfq.totalEstimatedPhp || 0,
        valid_until: rfq.validUntil || null,
        admin_notes: null, // Public submissions cannot set admin notes
        assigned_specialist: 'Marco Rivera (Enterprise Account Manager)',
        is_demo: Boolean(rfq.isDemo)
      });

    if (rfqError) {
      console.error('[ZEZ Supabase] Error inserting quotation_request:', rfqError);
      return { success: false, error: `Failed to record quotation: ${rfqError.message}` };
    }

    // Step B: Insert all Quotation Items linked to the newly created RFQ
    const lineItemsToInsert = rfq.items.map(item => ({
      quotation_request_id: rfq.id,
      product_id: item.productId,
      product_name: item.productName,
      model: item.model,
      brand: item.brand,
      sku: item.sku,
      main_image: item.mainImage,
      quantity: item.quantity,
      unit_price_php: item.unitPricePhp || null,
      subtotal_php: item.subtotalPhp || null,
      notes: item.notes || null
    }));

    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(lineItemsToInsert);

    if (itemsError) {
      console.error('[ZEZ Supabase] Error inserting quotation_items, rolling back request:', itemsError);
      // Clean up orphaned parent record to guarantee all-or-nothing consistency
      await supabase.from('quotation_requests').delete().eq('id', rfq.id);
      return { success: false, error: `Failed to record quotation items: ${itemsError.message}` };
    }

    console.info(`[ZEZ Supabase] Successfully persisted complete RFQ ${rfq.id} to Supabase PostgreSQL.`);
    return { success: true };
  } catch (err: any) {
    console.error('[ZEZ Supabase] Exception saving RFQ:', err);
    return { success: false, error: err.message || 'Unexpected network or database failure' };
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
      .select('id, email, full_name, role, is_active')
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
        role: adminData.role
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
      .select('id, email, full_name, role, is_active')
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
        role: adminData.role
      }
    };
  } catch (e) {
    return { success: false };
  }
}
