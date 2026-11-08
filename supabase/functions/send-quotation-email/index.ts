// ==============================================================================
// ZEZ AUTOMATION CORPORATION — EDGE FUNCTION: send-quotation-email
// Runtime: Deno / TypeScript (Supabase Edge Runtime)
//
// PURPOSE:
//   Dispatches official B2B pro-forma quotation emails with itemized pricing,
//   terms, and secure expiring customer approval link via Resend.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_URL = "https://api.resend.com/emails";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SendQuotationPayload {
  quotation_id: string;
  recipient_email?: string;
  custom_message?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "ZEZ Corporate Sales <sales@zezautomation.ph>";
    const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://zez.zigmatech.shop";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Supabase runtime environment variables." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY is not configured on this environment." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // 1. Authorization Check: Require valid administrator JWT or service role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired authorization token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from("administrator_users")
      .select("id, full_name, email, is_active, role")
      .eq("id", userId)
      .eq("is_active", true)
      .single();

    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: Administrator permissions required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request payload
    const body: SendQuotationPayload = await req.json();
    const { quotation_id, recipient_email, custom_message } = body;

    if (!quotation_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing quotation_id parameter." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch Quotation and Line Items
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("quotations")
      .select("*")
      .eq("id", quotation_id)
      .single();

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({ success: false, error: `Quotation ${quotation_id} not found.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("quotation_line_items")
      .select("*")
      .eq("quotation_id", quotation_id)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch quotation line items." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetRecipient = recipient_email || quote.customer_email;
    const secureReviewUrl = `${siteUrl}?quote_token=${quote.customer_access_token}&quote_id=${quote.id}`;

    // 4. Construct Item Rows HTML
    const itemRowsHtml = (items || [])
      .map(
        (it: any, idx: number) => `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 10px 12px; font-family: monospace; font-size: 11px; color: #6B7280;">${idx + 1}</td>
          <td style="padding: 10px 12px;">
            <strong style="color: #111827; font-size: 13px;">${escapeHtml(it.product_name)}</strong>
            <div style="font-size: 11px; color: #4B5563;">${escapeHtml(it.brand || "")} · ${escapeHtml(it.model || "")}</div>
            ${it.sku ? `<div style="font-family: monospace; font-size: 10px; color: #9CA3AF;">SKU: ${escapeHtml(it.sku)}</div>` : ""}
          </td>
          <td style="padding: 10px 12px; text-align: center; font-weight: bold; font-size: 13px; color: #111827;">${it.quantity}</td>
          <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-size: 12px; color: #374151;">₱${Number(it.unit_price_php).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-weight: bold; font-size: 13px; color: #111827;">₱${Number(it.line_total_php).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `
      )
      .join("");

    const formattedValidUntil = new Date(quote.valid_until).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const emailSubject = `Official Quotation ${quote.id} Rev ${quote.revision_number} — ZEZ Automation Corporation`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #292F36; background: #F4F5F7; margin: 0; padding: 20px; }
          .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; }
          .header { background: #292F36; padding: 28px 32px; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; letter-spacing: -0.5px; }
          .badge { display: inline-block; background: #B5121B; color: #ffffff; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 8px; }
          .content { padding: 32px; }
          .meta-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .btn { display: inline-block; background: #B5121B; color: #ffffff !important; padding: 14px 28px; font-weight: bold; text-decoration: none; border-radius: 8px; font-size: 14px; margin: 20px 0; }
          .footer { background: #F9FAFB; padding: 20px 32px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #6B7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">Official Pro-Forma Quotation</div>
            <h1>ZEZ Automation Corporation</h1>
            <p style="margin: 4px 0 0; color: #D1D5DB; font-size: 12px;">ICT Equipment Distribution & Technology Infrastructure Engineering</p>
          </div>
          <div class="content">
            <p style="font-size: 14px; line-height: 1.5; color: #374151;">
              Dear <strong>${escapeHtml(quote.customer_full_name)}</strong>${quote.customer_company_name ? ` (${escapeHtml(quote.customer_company_name)})` : ""},
            </p>
            <p style="font-size: 13px; line-height: 1.5; color: #4B5563;">
              Thank you for choosing ZEZ Automation Corporation as your enterprise technology and infrastructure partner. Please find our formal quotation <strong>${escapeHtml(quote.id)} (Revision ${quote.revision_number})</strong> detailed below.
            </p>

            ${custom_message ? `<div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 12px 16px; margin: 16px 0; font-size: 12px; color: #1E3A8A;"><strong>Specialist Remarks:</strong> ${escapeHtml(custom_message)}</div>` : ""}

            <div class="meta-box">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: #6B7280; width: 140px;">Quotation Ref:</td>
                  <td style="padding: 4px 0; font-weight: bold; font-family: monospace; color: #B5121B;">${escapeHtml(quote.id)} (Rev ${quote.revision_number})</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6B7280;">Valid Until:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: #111827;">${formattedValidUntil} (${quote.validity_days} Days)</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6B7280;">Payment Terms:</td>
                  <td style="padding: 4px 0; color: #111827;">${escapeHtml(quote.payment_terms)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6B7280;">Delivery Location:</td>
                  <td style="padding: 4px 0; color: #111827;">${escapeHtml(quote.delivery_city_province || "As specified")}</td>
                </tr>
              </table>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 12px;">
              <thead>
                <tr style="background: #292F36; color: #ffffff;">
                  <th style="padding: 8px 12px; text-align: left; width: 20px;">#</th>
                  <th style="padding: 8px 12px; text-align: left;">Item Description</th>
                  <th style="padding: 8px 12px; text-align: center; width: 50px;">Qty</th>
                  <th style="padding: 8px 12px; text-align: right; width: 100px;">Unit Price (PHP)</th>
                  <th style="padding: 8px 12px; text-align: right; width: 110px;">Subtotal (PHP)</th>
                </tr>
              </thead>
              <tbody>
                ${itemRowsHtml}
              </tbody>
            </table>

            <div style="margin-top: 16px; margin-left: auto; width: 280px; font-size: 12px; background: #F9FAFB; padding: 14px; border-radius: 8px; border: 1px solid #E5E7EB;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #4B5563;">
                <span>Subtotal:</span>
                <span style="font-family: monospace;">₱${Number(quote.subtotal_php).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              ${Number(quote.discount_amount_php) > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #059669;">
                <span>Discount:</span>
                <span style="font-family: monospace;">-₱${Number(quote.discount_amount_php).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>` : ""}
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #4B5563;">
                <span>VAT (12%):</span>
                <span style="font-family: monospace;">₱${Number(quote.vat_amount_php).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              ${Number(quote.delivery_fee_php) > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #4B5563;">
                <span>Delivery:</span>
                <span style="font-family: monospace;">₱${Number(quote.delivery_fee_php).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>` : ""}
              <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #D1D5DB; font-weight: bold; color: #B5121B; font-size: 14px;">
                <span>Grand Total:</span>
                <span style="font-family: monospace;">₱${Number(quote.grand_total_php).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP</span>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${secureReviewUrl}" class="btn" target="_blank">Review & Accept Quotation Online →</a>
              <div style="font-size: 11px; color: #6B7280; margin-top: 6px;">Secure link valid for 30 calendar days</div>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0 0 6px;"><strong>ZEZ Automation Corporation</strong></p>
            <p style="margin: 0 0 4px;">Davao City & Zamboanga City Operations Hubs · Nationwide Delivery</p>
            <p style="margin: 0;">Phone: +63-917-719-8503 · Email: zigmatechdvo2003@gmail.com · Web: https://zez.zigmatech.shop</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 5. Send via Resend with Idempotency Key
    const idempotencyKey = `quote_${quote.id}_rev_${quote.revision_number}_${Date.now()}`;
    const resendRes = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [targetRecipient],
        reply_to: "zigmatechdvo2003@gmail.com",
        subject: emailSubject,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("[ZEZ Edge Function] Resend email failed:", resendData);
      return new Response(
        JSON.stringify({ success: false, error: resendData.message || "Failed to dispatch email via Resend." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Update Quotation Status to 'Sent' and record audit log
    await supabaseAdmin
      .from("quotations")
      .update({
        status: "Sent",
        sent_at: new Date().toISOString(),
        sent_to_email: targetRecipient,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quotation_id);

    await supabaseAdmin.from("quotation_audit_logs").insert({
      quotation_id: quote.id,
      actor_id: adminUser.id,
      actor_name: `${adminUser.full_name || adminUser.email} (Sales Specialist)`,
      action: "Quotation Sent to Customer",
      details: {
        recipient: targetRecipient,
        resend_id: resendData.id,
        sent_at: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        quotation_id: quote.id,
        resend_id: resendData.id,
        recipient: targetRecipient,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[ZEZ Edge Function] Unexpected error in send-quotation-email:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Unexpected internal error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
