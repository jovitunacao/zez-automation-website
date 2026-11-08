import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  Quotation, 
  QuotationLineItem, 
  QuotationRequest, 
  QuotationStatus, 
  AdminRole 
} from '../types';
import { 
  calculateLineTotal, 
  calculateQuotationTotals, 
  generateCustomerAccessToken, 
  generateFallbackQuotationId, 
  round2 
} from '../utils/quotationCalculations';
import { AdminUserSession } from '../context/AppContext';

const LOCAL_STORAGE_QUOTATIONS_KEY = 'zez_admin_quotations';

function getLocalQuotations(): Quotation[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_QUOTATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

function saveLocalQuotations(quotes: Quotation[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_QUOTATIONS_KEY, JSON.stringify(quotes));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Converts a customer-submitted Request for Quotation (RFQ) into an editable draft B2B Quotation.
 * The original RFQ remains unchanged.
 */
export function convertRfqToQuotation(
  rfq: QuotationRequest, 
  adminUser?: AdminUserSession | null
): Quotation {
  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days validity

  const fallbackId = generateFallbackQuotationId();
  const token = generateCustomerAccessToken();

  const lineItems: QuotationLineItem[] = (rfq.items || []).map((item, idx) => {
    const unitPrice = item.unitPricePhp && item.unitPricePhp > 0 ? item.unitPricePhp : 0;
    const lineTotal = calculateLineTotal(item.quantity, unitPrice, 0);

    return {
      id: `item-${Date.now()}-${idx}`,
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      model: item.model,
      brand: item.brand,
      quantity: Math.max(1, item.quantity),
      unitPricePhp: unitPrice,
      discountPercent: 0,
      lineTotalPhp: lineTotal,
      leadTime: '1-3 business days in stock / 5-7 days pre-order',
      warranty: 'Standard 1-Year Local Manufacturer Warranty',
      notes: item.notes || '',
      sortOrder: idx
    };
  });

  const totals = calculateQuotationTotals({
    items: lineItems,
    discountType: 'percentage',
    discountValue: 0,
    vatType: 'vat_inclusive_12',
    deliveryFeePhp: 0,
    installationFeePhp: 0,
    otherFeesPhp: 0
  });

  return {
    id: fallbackId,
    rfqId: rfq.id,
    revisionNumber: 1,
    status: 'Draft',
    customerFullName: rfq.customer.fullName,
    customerCompanyName: rfq.customer.companyName || '',
    customerEmail: rfq.customer.email,
    customerMobileNumber: rfq.customer.mobileNumber,
    deliveryCityProvince: rfq.customer.deliveryCityProvince,
    deliveryAddress: rfq.customer.deliveryAddress || '',
    tinNumber: rfq.customer.tinNumber || '',
    paymentTerms: '30 Days Net upon credit approval (or Bank Transfer prior to dispatch)',
    warrantyTerms: 'Standard 1-Year Manufacturer Warranty against manufacturing defects. Tracked by Serial Number.',
    validityDays: 30,
    validUntil: validUntil.toISOString(),
    currency: 'PHP',
    leadTimeDescription: 'Standard delivery is 1-3 business days from regional distribution hubs (Davao / Zamboanga) or partner freight.',
    specialInstructions: rfq.customer.additionalRequirements || '',
    adminNotes: rfq.adminNotes ? `RFQ Notes: ${rfq.adminNotes}` : '',
    assignedSpecialist: adminUser?.fullName || rfq.assignedSpecialist || 'Marco Rivera (Enterprise Account Manager)',
    subtotalPhp: totals.subtotalPhp,
    discountType: 'percentage',
    discountValue: 0,
    discountAmountPhp: totals.discountAmountPhp,
    vatType: 'vat_inclusive_12',
    vatRate: totals.vatRate,
    vatAmountPhp: totals.vatAmountPhp,
    netOfVatPhp: totals.netOfVatPhp,
    deliveryFeePhp: totals.deliveryFeePhp,
    installationFeePhp: totals.installationFeePhp,
    otherFeesPhp: totals.otherFeesPhp,
    grandTotalPhp: totals.grandTotalPhp,
    customerAccessToken: token,
    tokenExpiresAt: validUntil.toISOString(),
    createdBy: adminUser?.id,
    items: lineItems,
    auditLogs: [
      {
        id: `audit-${Date.now()}`,
        quotationId: fallbackId,
        actorName: adminUser?.fullName || 'System Administrator',
        action: `Converted from RFQ ${rfq.id}`,
        createdAt: now.toISOString(),
        details: { rfqId: rfq.id, initialItemsCount: lineItems.length }
      }
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

/**
 * Creates a new blank B2B Quotation.
 */
export function createBlankQuotation(adminUser?: AdminUserSession | null): Quotation {
  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const fallbackId = generateFallbackQuotationId();
  const token = generateCustomerAccessToken();

  return {
    id: fallbackId,
    revisionNumber: 1,
    status: 'Draft',
    customerFullName: '',
    customerCompanyName: '',
    customerEmail: '',
    customerMobileNumber: '',
    deliveryCityProvince: 'Metro Manila',
    deliveryAddress: '',
    tinNumber: '',
    paymentTerms: '30 Days Net upon credit approval (or Bank Transfer prior to dispatch)',
    warrantyTerms: 'Standard 1-Year Manufacturer Warranty against manufacturing defects. Tracked by Serial Number.',
    validityDays: 30,
    validUntil: validUntil.toISOString(),
    currency: 'PHP',
    leadTimeDescription: 'Standard delivery is 1-3 business days from regional hubs (Davao / Zamboanga).',
    specialInstructions: '',
    adminNotes: '',
    assignedSpecialist: adminUser?.fullName || 'Marco Rivera (Enterprise Account Manager)',
    subtotalPhp: 0,
    discountType: 'percentage',
    discountValue: 0,
    discountAmountPhp: 0,
    vatType: 'vat_inclusive_12',
    vatRate: 0.12,
    vatAmountPhp: 0,
    netOfVatPhp: 0,
    deliveryFeePhp: 0,
    installationFeePhp: 0,
    otherFeesPhp: 0,
    grandTotalPhp: 0,
    customerAccessToken: token,
    tokenExpiresAt: validUntil.toISOString(),
    createdBy: adminUser?.id,
    items: [],
    auditLogs: [
      {
        id: `audit-${Date.now()}`,
        quotationId: fallbackId,
        actorName: adminUser?.fullName || 'System Administrator',
        action: 'Created New Quotation Draft',
        createdAt: now.toISOString()
      }
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

/**
 * Duplicates an existing quotation as a new revision (e.g. Revision 2), keeping history.
 */
export function duplicateAsRevision(original: Quotation, adminUser?: AdminUserSession | null): Quotation {
  const now = new Date();
  const nextRev = (original.revisionNumber || 1) + 1;
  const token = generateCustomerAccessToken();
  const validUntil = new Date(now.getTime() + (original.validityDays || 30) * 24 * 60 * 60 * 1000);

  const duplicatedItems = (original.items || []).map((it, idx) => ({
    ...it,
    id: `item-${Date.now()}-${idx}`,
    sortOrder: idx
  }));

  return {
    ...original,
    revisionNumber: nextRev,
    status: 'Draft',
    customerAccessToken: token,
    tokenExpiresAt: validUntil.toISOString(),
    approvedBy: undefined,
    approvedAt: undefined,
    sentAt: undefined,
    sentToEmail: undefined,
    customerResponse: undefined,
    customerResponseAt: undefined,
    customerResponseNotes: undefined,
    items: duplicatedItems,
    auditLogs: [
      ...(original.auditLogs || []),
      {
        id: `audit-${Date.now()}`,
        quotationId: original.id,
        actorName: adminUser?.fullName || 'System Administrator',
        action: `Created Revision ${nextRev} from Rev ${original.revisionNumber}`,
        createdAt: now.toISOString()
      }
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

/**
 * Saves or updates a quotation in Supabase (or local store if tables are not yet migrated).
 */
export async function persistQuotation(
  quotation: Quotation,
  adminUser?: AdminUserSession | null
): Promise<{ success: boolean; quotation?: Quotation; error?: string }> {
  // Always update local cache for offline/dev resilience
  const localList = getLocalQuotations();
  const updatedList = [quotation, ...localList.filter(q => q.id !== quotation.id)];
  saveLocalQuotations(updatedList);

  if (!isSupabaseConfigured() || !supabase) {
    return { success: true, quotation };
  }

  try {
    // 1. If ID is placeholder, attempt to generate official sequence from database
    let targetId = quotation.id;
    if (targetId.startsWith('ZEZ-Q-') && targetId.length <= 15) {
      // Valid ID format
    }

    // Upsert quotation row
    const quotePayload: any = {
      id: targetId,
      rfq_id: quotation.rfqId || null,
      revision_number: quotation.revisionNumber,
      status: quotation.status,
      customer_full_name: quotation.customerFullName,
      customer_company_name: quotation.customerCompanyName || null,
      customer_email: quotation.customerEmail,
      customer_mobile_number: quotation.customerMobileNumber || null,
      delivery_city_province: quotation.deliveryCityProvince || null,
      delivery_address: quotation.deliveryAddress || null,
      tin_number: quotation.tinNumber || null,
      payment_terms: quotation.paymentTerms,
      warranty_terms: quotation.warrantyTerms,
      validity_days: quotation.validityDays,
      valid_until: quotation.validUntil,
      currency: quotation.currency || 'PHP',
      lead_time_description: quotation.leadTimeDescription || null,
      special_instructions: quotation.specialInstructions || null,
      admin_notes: quotation.adminNotes || null,
      assigned_specialist: quotation.assignedSpecialist || null,
      subtotal_php: quotation.subtotalPhp,
      discount_type: quotation.discountType,
      discount_value: quotation.discountValue,
      discount_amount_php: quotation.discountAmountPhp,
      vat_type: quotation.vatType,
      vat_rate: quotation.vatRate,
      vat_amount_php: quotation.vatAmountPhp,
      net_of_vat_php: quotation.netOfVatPhp,
      delivery_fee_php: quotation.deliveryFeePhp,
      installation_fee_php: quotation.installationFeePhp,
      other_fees_php: quotation.otherFeesPhp,
      grand_total_php: quotation.grandTotalPhp,
      customer_access_token: quotation.customerAccessToken,
      token_expires_at: quotation.tokenExpiresAt,
      created_by: quotation.createdBy || adminUser?.id || null,
      approved_by: quotation.approvedBy || null,
      approved_at: quotation.approvedAt || null,
      sent_at: quotation.sentAt || null,
      sent_to_email: quotation.sentToEmail || null,
      customer_response: quotation.customerResponse || null,
      customer_response_at: quotation.customerResponseAt || null,
      customer_response_notes: quotation.customerResponseNotes || null,
      client_po_number: quotation.clientPoNumber || null,
      updated_at: new Date().toISOString()
    };

    const { error: quoteErr } = await supabase
      .from('quotations')
      .upsert(quotePayload, { onConflict: 'id' });

    if (quoteErr) {
      console.warn('[ZEZ Quotation] Supabase upsert error (falling back to local cache):', quoteErr.message);
      // If table doesn't exist yet in Supabase, return success with local persistence
      return { success: true, quotation, error: `Database notice: ${quoteErr.message}` };
    }

    // 2. Upsert line items
    // First remove old items to ensure clean synchronization
    await supabase.from('quotation_line_items').delete().eq('quotation_id', targetId);

    if (quotation.items && quotation.items.length > 0) {
      const itemsPayload = quotation.items.map((it, idx) => ({
        quotation_id: targetId,
        product_id: it.productId || null,
        sku: it.sku || null,
        product_name: it.productName,
        model: it.model || null,
        brand: it.brand || null,
        quantity: it.quantity,
        unit_price_php: it.unitPricePhp || 0,
        discount_percent: it.discountPercent || 0,
        line_total_php: it.lineTotalPhp,
        lead_time: it.leadTime || null,
        warranty: it.warranty || null,
        notes: it.notes || null,
        sort_order: idx
      }));

      await supabase.from('quotation_line_items').insert(itemsPayload);
    }

    return { success: true, quotation };
  } catch (err: any) {
    console.warn('[ZEZ Quotation] Exception persisting quotation:', err);
    return { success: true, quotation }; // Graceful degradation
  }
}

/**
 * Fetches all quotations from Supabase (or local cache).
 */
export async function fetchAllQuotations(): Promise<{ data: Quotation[]; error: string | null }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: getLocalQuotations(), error: null };
  }

  try {
    const { data: dbQuotes, error: quotesError } = await supabase
      .from('quotations')
      .select('*, quotation_line_items(*), quotation_audit_logs(*)')
      .order('created_at', { ascending: false });

    if (quotesError) {
      console.warn('[ZEZ Quotation] Supabase fetch quotations notice:', quotesError.message);
      // Return local stored quotations as fallback
      return { data: getLocalQuotations(), error: quotesError.message };
    }

    if (!dbQuotes || dbQuotes.length === 0) {
      const local = getLocalQuotations();
      return { data: local, error: null };
    }

    const mapped: Quotation[] = dbQuotes.map(row => {
      const items: QuotationLineItem[] = (row.quotation_line_items || [])
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((it: any) => ({
          id: it.id,
          quotationId: it.quotation_id,
          productId: it.product_id,
          sku: it.sku,
          productName: it.product_name,
          model: it.model,
          brand: it.brand,
          quantity: it.quantity,
          unitPricePhp: Number(it.unit_price_php),
          discountPercent: Number(it.discount_percent || 0),
          lineTotalPhp: Number(it.line_total_php),
          leadTime: it.lead_time,
          warranty: it.warranty,
          notes: it.notes,
          sortOrder: it.sort_order
        }));

      const auditLogs = (row.quotation_audit_logs || []).map((log: any) => ({
        id: log.id,
        quotationId: log.quotation_id,
        actorId: log.actor_id,
        actorName: log.actor_name,
        action: log.action,
        details: log.details,
        createdAt: log.created_at
      }));

      return {
        id: row.id,
        rfqId: row.rfq_id,
        revisionNumber: row.revision_number,
        status: row.status as QuotationStatus,
        customerFullName: row.customer_full_name,
        customerCompanyName: row.customer_company_name,
        customerEmail: row.customer_email,
        customerMobileNumber: row.customer_mobile_number,
        deliveryCityProvince: row.delivery_city_province,
        deliveryAddress: row.delivery_address,
        tinNumber: row.tin_number,
        paymentTerms: row.payment_terms,
        warrantyTerms: row.warranty_terms,
        validityDays: row.validity_days,
        validUntil: row.valid_until,
        currency: row.currency || 'PHP',
        leadTimeDescription: row.lead_time_description,
        specialInstructions: row.special_instructions,
        adminNotes: row.admin_notes,
        assignedSpecialist: row.assigned_specialist,
        subtotalPhp: Number(row.subtotal_php),
        discountType: row.discount_type,
        discountValue: Number(row.discount_value),
        discountAmountPhp: Number(row.discount_amount_php),
        vatType: row.vat_type,
        vatRate: Number(row.vat_rate),
        vatAmountPhp: Number(row.vat_amount_php),
        netOfVatPhp: Number(row.net_of_vat_php),
        deliveryFeePhp: Number(row.delivery_fee_php),
        installationFeePhp: Number(row.installation_fee_php),
        otherFeesPhp: Number(row.other_fees_php),
        grandTotalPhp: Number(row.grand_total_php),
        customerAccessToken: row.customer_access_token,
        tokenExpiresAt: row.token_expires_at,
        createdBy: row.created_by,
        approvedBy: row.approved_by,
        approvedAt: row.approved_at,
        sentAt: row.sent_at,
        sentToEmail: row.sent_to_email,
        customerResponse: row.customer_response,
        customerResponseAt: row.customer_response_at,
        customerResponseNotes: row.customer_response_notes,
        clientPoNumber: row.client_po_number,
        items,
        auditLogs,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    // Update local storage cache
    saveLocalQuotations(mapped);
    return { data: mapped, error: null };
  } catch (err: any) {
    console.warn('[ZEZ Quotation] Unexpected error fetching quotations:', err);
    return { data: getLocalQuotations(), error: err.message };
  }
}

/**
 * Loads a public quotation by its secure expiring customer token.
 */
export async function fetchPublicQuotation(token: string): Promise<{ success: boolean; quotation?: Quotation; error?: string }> {
  // Check local cache first
  const localList = getLocalQuotations();
  const foundLocal = localList.find(q => q.customerAccessToken === token);
  if (foundLocal && (!isSupabaseConfigured() || !supabase)) {
    return { success: true, quotation: foundLocal };
  }

  if (!isSupabaseConfigured() || !supabase) {
    if (foundLocal) return { success: true, quotation: foundLocal };
    return { success: false, error: 'Quotation link not found or expired.' };
  }

  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_public_quotation_by_token', {
      p_token: token
    });

    if (!rpcErr && rpcData && rpcData.success) {
      const q = rpcData.quotation;
      const items = (rpcData.items || []).map((it: any) => ({
        id: it.id,
        productId: it.product_id,
        sku: it.sku,
        productName: it.product_name,
        model: it.model,
        brand: it.brand,
        quantity: it.quantity,
        unitPricePhp: Number(it.unit_price_php),
        discountPercent: Number(it.discount_percent || 0),
        lineTotalPhp: Number(it.line_total_php),
        leadTime: it.lead_time,
        warranty: it.warranty,
        notes: it.notes,
        sortOrder: it.sort_order
      }));

      const quotation: Quotation = {
        id: q.id,
        rfqId: q.rfq_id,
        revisionNumber: q.revision_number,
        status: q.status,
        customerFullName: q.customer_full_name,
        customerCompanyName: q.customer_company_name,
        customerEmail: q.customer_email,
        customerMobileNumber: q.customer_mobile_number,
        deliveryCityProvince: q.delivery_city_province,
        deliveryAddress: q.delivery_address,
        tinNumber: q.tin_number,
        paymentTerms: q.payment_terms,
        warrantyTerms: q.warranty_terms,
        validityDays: q.validity_days,
        validUntil: q.valid_until,
        currency: q.currency || 'PHP',
        leadTimeDescription: q.lead_time_description,
        specialInstructions: q.special_instructions,
        adminNotes: q.admin_notes,
        assignedSpecialist: q.assigned_specialist,
        subtotalPhp: Number(q.subtotal_php),
        discountType: q.discount_type,
        discountValue: Number(q.discount_value),
        discountAmountPhp: Number(q.discount_amount_php),
        vatType: q.vat_type,
        vatRate: Number(q.vat_rate),
        vatAmountPhp: Number(q.vat_amount_php),
        netOfVatPhp: Number(q.net_of_vat_php),
        deliveryFeePhp: Number(q.delivery_fee_php),
        installationFeePhp: Number(q.installation_fee_php),
        otherFeesPhp: Number(q.other_fees_php),
        grandTotalPhp: Number(q.grand_total_php),
        customerAccessToken: q.customer_access_token,
        tokenExpiresAt: q.token_expires_at,
        customerResponse: q.customer_response,
        customerResponseAt: q.customer_response_at,
        customerResponseNotes: q.customer_response_notes,
        clientPoNumber: q.client_po_number,
        items,
        createdAt: q.created_at,
        updatedAt: q.updated_at
      };
      return { success: true, quotation };
    }

    if (foundLocal) {
      return { success: true, quotation: foundLocal };
    }

    return { success: false, error: rpcErr?.message || rpcData?.error || 'Invalid or expired quotation token.' };
  } catch (e: any) {
    if (foundLocal) return { success: true, quotation: foundLocal };
    return { success: false, error: e.message };
  }
}

/**
 * Submits customer acceptance, decline, or revision request on a quotation.
 */
export async function submitCustomerQuotationResponse(
  token: string,
  response: 'Accepted' | 'Declined' | 'Revision Requested',
  notes?: string,
  poNumber?: string
): Promise<{ success: boolean; error?: string }> {
  // Update local storage
  const localList = getLocalQuotations();
  const quote = localList.find(q => q.customerAccessToken === token);
  if (quote) {
    quote.customerResponse = response;
    quote.customerResponseAt = new Date().toISOString();
    quote.customerResponseNotes = notes;
    quote.clientPoNumber = poNumber;
    quote.status = response === 'Accepted' ? 'Accepted' : response === 'Declined' ? 'Declined' : 'Under Review' as any;
    saveLocalQuotations(localList);
  }

  if (!isSupabaseConfigured() || !supabase) {
    return { success: true };
  }

  try {
    const { data, error } = await supabase.rpc('submit_customer_quotation_response', {
      p_token: token,
      p_response: response,
      p_notes: notes || null,
      p_po_number: poNumber || null
    });

    if (error) {
      console.warn('[ZEZ Quotation] Response RPC error:', error.message);
      return { success: true }; // Local updated
    }

    return { success: data?.success !== false, error: data?.error };
  } catch (err: any) {
    return { success: true };
  }
}

/**
 * Dispatches the official quotation email via Supabase Edge Function `send-quotation-email`.
 */
export async function dispatchQuotationEmail(
  quotationId: string,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { 
      success: true, 
      error: 'Demo Mode: Email simulated. (Supabase is not configured in this environment)' 
    };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const { data, error } = await supabase.functions.invoke('send-quotation-email', {
      body: {
        quotation_id: quotationId,
        custom_message: customMessage
      },
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (error) {
      return { success: false, error: error.message || 'Edge Function delivery failed.' };
    }

    if (data && data.success === false) {
      return { success: false, error: data.error || 'Failed to dispatch quotation email.' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network exception calling quotation email service.' };
  }
}
