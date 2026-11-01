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

/**
 * Saves a submitted RFQ and its line items to Supabase PostgreSQL database.
 * If Supabase is not configured, logs a helpful notice and resolves safely.
 */
export async function syncRfqToSupabase(rfq: QuotationRequest): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: true };
  }

  try {
    // 1. Insert Quotation Request Record
    const { error: rfqError } = await supabase
      .from('quotation_requests')
      .insert({
        id: rfq.id,
        status: rfq.status,
        customer_full_name: rfq.customer.fullName,
        customer_company_name: rfq.customer.companyName,
        customer_email: rfq.customer.email,
        customer_mobile_number: rfq.customer.mobileNumber,
        delivery_city_province: rfq.customer.deliveryCityProvince,
        delivery_address: rfq.customer.deliveryAddress,
        tin_number: rfq.customer.tinNumber,
        customer_type: rfq.customer.customerType,
        preferred_contact_method: rfq.customer.preferredContactMethod,
        target_delivery_date: rfq.customer.targetDeliveryDate || null,
        additional_requirements: rfq.customer.additionalRequirements,
        total_estimated_php: rfq.totalEstimatedPhp || 0,
        admin_notes: rfq.adminNotes,
        assigned_specialist: rfq.assignedSpecialist,
        valid_until: rfq.validUntil
      });

    if (rfqError) {
      console.warn('[ZEZ Supabase] Error inserting quotation_request:', rfqError);
      return { success: false, error: rfqError };
    }

    // 2. Insert Quotation Items
    const itemsPayload = rfq.items.map(item => ({
      quotation_request_id: rfq.id,
      product_id: item.productId,
      product_name: item.productName,
      model: item.model,
      brand: item.brand,
      sku: item.sku,
      main_image: item.mainImage,
      quantity: item.quantity,
      unit_price_php: item.unitPricePhp || 0,
      subtotal_php: item.subtotalPhp || 0,
      notes: item.notes || null
    }));

    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(itemsPayload);

    if (itemsError) {
      console.warn('[ZEZ Supabase] Error inserting quotation_items:', itemsError);
      return { success: false, error: itemsError };
    }

    console.info(`[ZEZ Supabase] Successfully persisted RFQ ${rfq.id} to Supabase PostgreSQL.`);
    return { success: true };
  } catch (err) {
    console.warn('[ZEZ Supabase] Unexpected error syncing RFQ:', err);
    return { success: false, error: err };
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
        company: payload.company,
        email: payload.email,
        phone: payload.phone,
        department: payload.department,
        subject: payload.subject,
        message: payload.message,
        status: 'New'
      });

    if (error) {
      console.warn('[ZEZ Supabase] Error saving customer inquiry:', error);
      return { success: false, error };
    }

    console.info('[ZEZ Supabase] Contact inquiry saved to Supabase.');
    return { success: true };
  } catch (err) {
    console.warn('[ZEZ Supabase] Unexpected error saving inquiry:', err);
    return { success: false, error: err };
  }
}

/**
 * Updates quotation status in Supabase.
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
      console.warn('[ZEZ Supabase] Error updating RFQ status:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[ZEZ Supabase] Unexpected error updating status:', err);
    return false;
  }
}
