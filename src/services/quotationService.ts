import { 
  Quotation, 
  QuotationLineItem, 
  QuotationRequest, 
  AdminUserSession, 
  QuotationStatus,
  VatType,
  DiscountType 
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  calculateLineTotal, 
  calculateQuotationTotals, 
  generateFallbackQuotationId, 
  generateCustomerAccessToken,
  round2 
} from '../utils/quotationCalculations';
import { generateQuotationPdfBase64 } from './quotationPdfService';

const LOCAL_STORAGE_KEY = 'zez_b2b_quotations_cache';

/**
 * Retrieves local stored quotations for dev testing or offline fallback.
 */
export function getLocalQuotations(): Quotation[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Saves quotations array to local cache.
 */
export function saveLocalQuotations(quotes: Quotation[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
  } catch (e) {
    console.warn('[ZEZ Quotation] Failed to cache quotations locally:', e);
  }
}

/**
 * Converts an incoming customer RFQ into an editable B2B Quotation draft.
 * Preserves the original RFQ request without modifying it.
 */
export function convertRfqToQuotation(
  rfq: QuotationRequest,
  adminUser?: AdminUserSession | null
): Quotation {
  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const fallbackId = generateFallbackQuotationId();
  const token = generateCustomerAccessToken();

  const lineItems: QuotationLineItem[] = rfq.items.map((item, idx) => {
    const unitPrice = item.subtotalPhp && item.quantity > 0 
      ? round2(item.subtotalPhp / item.quantity) 
      : 0;

    return {
      id: `item-${Date.now()}-${idx}`,
      productId: item.productId,
      sku: item.model ? `ZEZ-${item.model.replace(/\s+/g, '-').toUpperCase()}` : undefined,
      productName: item.productName,
      model: item.model,
      quantity: Math.max(1, item.quantity),
      unitPricePhp: unitPrice,
      discountPercent: 0,
      lineTotalPhp: calculateLineTotal(item.quantity, unitPrice, 0),
      leadTime: 'Standard Freight Delivery (3-5 business days upon PO acceptance)',
      warranty: 'Standard 1-Year Local Manufacturer Warranty on Hardware',
      sortOrder: idx
    };
  });

  const totals = calculateQuotationTotals({
    items: lineItems,
    discountType: 'percentage',
    discountValue: 0,
    vatType: 'vat_inclusive_12'
  });

  const specialistName = adminUser?.fullName
    ? adminUser.fullName
    : undefined;

  return {
    id: fallbackId,
    baseQuotationId: fallbackId,
    rfqId: rfq.id,
    revisionNumber: 1,
    status: 'Draft',
    customerFullName: rfq.customer.fullName || 'Purchasing Department',
    customerCompanyName: rfq.customer.companyName || '',
    customerEmail: rfq.customer.email,
    customerMobileNumber: rfq.customer.mobileNumber || '',
    deliveryCityProvince: rfq.customer.deliveryCityProvince || 'Metro Manila',
    deliveryAddress: rfq.customer.deliveryCityProvince || '',
    tinNumber: '',
    paymentTerms: 'Standard commercial terms as specified in quotation / PO',
    warrantyTerms: 'Standard manufacturer warranty as specified per product line',
    validityDays: 30,
    validUntil: validUntil.toISOString(),
    currency: 'PHP',
    leadTimeDescription: 'Subject to stock availability and logistics confirmation',
    specialInstructions: rfq.customer.additionalRequirements || '',
    adminNotes: rfq.adminNotes ? `RFQ Notes: ${rfq.adminNotes}` : '',
    assignedSpecialist: specialistName,
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

  const specialistName = adminUser?.fullName
    ? adminUser.fullName
    : undefined;

  return {
    id: fallbackId,
    baseQuotationId: fallbackId,
    revisionNumber: 1,
    status: 'Draft',
    customerFullName: '',
    customerCompanyName: '',
    customerEmail: '',
    customerMobileNumber: '',
    deliveryCityProvince: 'Metro Manila',
    deliveryAddress: '',
    tinNumber: '',
    paymentTerms: 'Standard commercial terms as specified in quotation / PO',
    warrantyTerms: 'Standard manufacturer warranty as specified per product line',
    validityDays: 30,
    validUntil: validUntil.toISOString(),
    currency: 'PHP',
    leadTimeDescription: 'Subject to stock availability and logistics confirmation',
    specialInstructions: '',
    adminNotes: '',
    assignedSpecialist: specialistName,
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
 * Preserves immutable sent quotation versions; never overwrites issued revisions.
 */
export function duplicateAsRevision(original: Quotation, adminUser?: AdminUserSession | null): Quotation {
  const now = new Date();
  const nextRev = (original.revisionNumber || 1) + 1;
  const token = generateCustomerAccessToken();
  const validUntil = new Date(now.getTime() + (original.validityDays || 30) * 24 * 60 * 60 * 1000);

  const baseId = original.baseQuotationId || original.id.replace(/-R\d+$/, '');
  const revisionId = `${baseId}-R${nextRev}`;

  const duplicatedItems = (original.items || []).map((it, idx) => ({
    ...it,
    id: `item-${Date.now()}-${idx}`,
    sortOrder: idx
  }));

  return {
    ...original,
    id: revisionId,
    baseQuotationId: baseId,
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
    clientPoNumber: undefined,
    lastEmailIdempotencyKey: undefined,
    lastResendEmailId: undefined,
    emailDeliveryCount: 0,
    items: duplicatedItems,
    auditLogs: [
      ...(original.auditLogs || []),
      {
        id: `audit-${Date.now()}`,
        quotationId: revisionId,
        actorName: adminUser?.fullName || 'System Administrator',
        action: `Created Revision ${nextRev} from ${original.id}`,
        createdAt: now.toISOString()
      }
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

/**
 * Saves or updates a quotation in Supabase.
 * Enforces transaction consistency and never reports success on database error.
 */
export async function persistQuotation(
  quotation: Quotation,
  adminUser?: AdminUserSession | null
): Promise<{ success: boolean; quotation?: Quotation; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    const localList = getLocalQuotations();
    const updatedList = [quotation, ...localList.filter(q => q.id !== quotation.id)];
    saveLocalQuotations(updatedList);
    return { success: true, quotation };
  }

  try {
    const targetId = quotation.id;
    const baseId = quotation.baseQuotationId || targetId.replace(/-R\d+$/, '');

    // 1. Try atomic database stored procedure first
    const itemsPayload = (quotation.items || []).map((it, idx) => ({
      product_id: it.productId || null,
      sku: it.sku || null,
      product_name: it.productName,
      model: it.model || null,
      brand: it.brand || null,
      quantity: it.quantity,
      unit_price_php: it.unitPricePhp,
      discount_percent: it.discountPercent || 0,
      line_total_php: it.lineTotalPhp,
      lead_time: it.leadTime || null,
      warranty: it.warranty || null,
      notes: it.notes || null,
      sort_order: idx
    }));

    const quoteRpcPayload = {
      id: targetId,
      base_quotation_id: baseId,
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
      sent_to_email: quotation.sentToEmail || null
    };

    const { data: rpcData, error: rpcErr } = await supabase.rpc('save_official_quotation', {
      p_quote: quoteRpcPayload,
      p_items: itemsPayload,
      p_actor_name: adminUser?.fullName || 'System Administrator',
      p_audit_action: `Saved Quotation (${quotation.status})`
    });

    if (!rpcErr && rpcData?.success) {
      const saved: Quotation = {
        ...quotation,
        id: rpcData.id || quotation.id,
        baseQuotationId: baseId,
        revisionNumber: rpcData.revision_number || quotation.revisionNumber,
        status: rpcData.status || quotation.status
      };
      const localList = getLocalQuotations();
      saveLocalQuotations([saved, ...localList.filter(q => q.id !== saved.id)]);
      return { success: true, quotation: saved };
    }

    // In production with Supabase configured, all quotation and line-item writes
    // must be strictly transactional via save_official_quotation.
    // Direct table upsert bypass is prohibited.
    return {
      success: false,
      error: rpcErr?.message || rpcData?.error || 'Database rejected quotation write. Transactional validation failed.'
    };
  } catch (err: any) {
    console.error('[ZEZ Quotation] Exception persisting quotation:', err);
    return { success: false, error: err.message || 'Database connection error' };
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
        baseQuotationId: row.base_quotation_id || row.id.replace(/-R\d+$/, ''),
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
        lastEmailIdempotencyKey: row.last_email_idempotency_key,
        lastResendEmailId: row.last_resend_email_id,
        emailDeliveryCount: row.email_delivery_count || 0,
        emailDispatchStatus: row.email_dispatch_status || 'idle',
        items,
        auditLogs,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    saveLocalQuotations(mapped);
    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: getLocalQuotations(), error: err.message };
  }
}

/**
 * Fetches a single quotation via customer access token for client portal.
 * Enforces token expiration and sanitized data exposure.
 */
export async function fetchPublicQuotation(token: string): Promise<{
  success: boolean;
  quotation?: Quotation;
  error?: string;
  isExpired?: boolean;
}> {
  const localList = getLocalQuotations();
  const foundLocal = localList.find(q => q.customerAccessToken === token);

  if (!isSupabaseConfigured() || !supabase) {
    if (foundLocal) {
      if (new Date(foundLocal.validUntil) < new Date() && foundLocal.status !== 'Accepted') {
        return {
          success: false,
          error: 'This quotation link has expired. Confidential pricing has been secured.',
          isExpired: true
        };
      }
      return { success: true, quotation: foundLocal };
    }
    return { success: false, error: 'Quotation not found.' };
  }

  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_public_quotation_by_token', {
      p_token: token
    });

    if (rpcData && rpcData.success) {
      const q = rpcData.quotation;
      const items: QuotationLineItem[] = (rpcData.items || []).map((it: any) => ({
        id: it.id,
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
        baseQuotationId: q.id.replace(/-R\d+$/, ''),
        rfqId: q.rfq_id,
        revisionNumber: q.revision_number,
        status: q.status as QuotationStatus,
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
        adminNotes: '', // Sanitized: Never exposed to client
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
        customerAccessToken: token,
        tokenExpiresAt: q.valid_until,
        customerResponse: q.customer_response,
        customerResponseAt: q.customer_response_at,
        customerResponseNotes: q.customer_response_notes,
        clientPoNumber: q.client_po_number,
        items,
        createdAt: q.created_at,
        updatedAt: q.created_at
      };
      return { success: true, quotation };
    }

    if (rpcData && rpcData.is_expired) {
      return {
        success: false,
        error: rpcData.error || 'Quotation expired.',
        isExpired: true
      };
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
      return { success: false, error: error.message };
    }

    if (data && data.success === false) {
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Dispatches the official quotation email via Supabase Edge Function `send-quotation-email`.
 * Attaches the genuine corporate PDF and enforces approval status.
 */
export async function dispatchQuotationEmail(
  quotation: Quotation,
  customMessage?: string,
  forceResend?: boolean
): Promise<{ success: boolean; error?: string }> {
  if (quotation.status === 'Draft' || quotation.status === 'Pending Approval') {
    return {
      success: false,
      error: `Cannot send quotation in '${quotation.status}' status. Quotation must be officially Approved before sending to customer.`
    };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return { 
      success: true, 
      error: 'Demo Mode: Email simulated. (Supabase is not configured in this environment)' 
    };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    let pdfBase64 = '';
    try {
      pdfBase64 = generateQuotationPdfBase64(quotation);
    } catch (pdfErr) {
      console.warn('[ZEZ Quotation] Could not generate PDF attachment:', pdfErr);
    }

    const { data, error } = await supabase.functions.invoke('send-quotation-email', {
      body: {
        quotation_id: quotation.id,
        custom_message: customMessage,
        force_resend: Boolean(forceResend)
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
