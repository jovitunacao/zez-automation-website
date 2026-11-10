// ==============================================================================
// ZEZ AUTOMATION CORPORATION — EDGE FUNCTION: send-quotation-email (HARDENED)
// Runtime: Deno / TypeScript (Supabase Edge Runtime)
//
// PURPOSE:
//   Dispatches official B2B pro-forma quotation emails with itemized pricing,
//   corporate terms, server-generated PDF attachments, and secure customer links.
//
// SECURITY & RELIABILITY CONTROLS:
//   - Requires valid administrator JWT and active authorized role.
//   - Atomic email-send claiming via `claim_quotation_for_email_send` RPC with row locking.
//   - Server-generated stable idempotency keys prevent duplicate sends under concurrent dispatches.
//   - Recipient locked strictly to official quotation customer email on record.
//   - Generates authentic pro-forma vector PDF server-side using locked database record.
//     Prevents browser-supplied PDF substitution or pricing tampering.
//   - Durable delivery tracking via `finalize_quotation_email_send` RPC.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const RESEND_API_URL = "https://api.resend.com/emails";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SendQuotationPayload {
  quotation_id: string;
  custom_message?: string;
  force_resend?: boolean;
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

    // 1. Authorization Check: Require valid administrator JWT
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
        JSON.stringify({ success: false, error: "Unauthorized: Active administrator account required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedRoles = ["super_admin", "operations_manager", "sales_engineer"];
    if (!allowedRoles.includes(adminUser.role)) {
      return new Response(
        JSON.stringify({ success: false, error: `Forbidden: Role '${adminUser.role}' is not authorized to dispatch quotations.` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request payload
    const body: SendQuotationPayload = await req.json();
    const { quotation_id, custom_message, force_resend } = body;

    if (!quotation_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required 'quotation_id' parameter." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Atomically claim quotation for sending (Row lock + Server-side idempotency key + Status check)
    const { data: claimData, error: claimError } = await supabaseAdmin.rpc(
      "claim_quotation_for_email_send",
      {
        p_quotation_id: quotation_id,
        p_actor_id: adminUser.id,
        p_force_resend: Boolean(force_resend),
      }
    );

    if (claimError) {
      return new Response(
        JSON.stringify({ success: false, error: claimError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!claimData || claimData.success === false) {
      const statusCode = claimData?.already_sent ? 200 : 400;
      return new Response(
        JSON.stringify(claimData || { success: false, error: "Failed to claim quotation for email dispatch." }),
        { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const quote = claimData.quotation;
    const items = claimData.items || [];
    const serverIdempotencyKey = claimData.idempotency_key;

    // 4. Recipient Security: Lock recipient strictly to quote's recorded customer email
    const targetRecipient = (quote.customer_email || "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetRecipient)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid customer email address in quotation record: '${targetRecipient}'.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Generate Official Pro-Forma PDF Server-Side from locked database data
    // (Prevents browser-supplied PDF tampering)
    let pdfBase64 = "";
    try {
      pdfBase64 = generateServerQuotationPdfBase64(quote, items);
    } catch (pdfErr: any) {
      console.warn("[ZEZ Edge Function] Server PDF generation warning:", pdfErr?.message);
    }

    const secureReviewUrl = `${siteUrl}?quote_token=${quote.customer_access_token}&quote_id=${quote.id}`;

    // 6. Construct HTML Table and Email Body
    const itemRowsHtml = items
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
              <div style="font-size: 11px; color: #6B7280; margin-top: 6px;">Secure link valid for ${quote.validity_days || 30} calendar days</div>
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

    // 7. Attach Server-Generated Pro-Forma PDF
    const attachments = [];
    if (pdfBase64 && pdfBase64.length > 100) {
      attachments.push({
        filename: `${quote.id}_Rev${quote.revision_number}.pdf`,
        content: pdfBase64,
      });
    }

    // 8. Dispatch via Resend with Server Idempotency Key
    const resendRes = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": serverIdempotencyKey,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [targetRecipient],
        reply_to: "zigmatechdvo2003@gmail.com",
        subject: emailSubject,
        html: htmlBody,
        ...(attachments.length > 0 ? { attachments } : {}),
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

    // 9. Finalize email send transactionally via database RPC
    const { data: finalizeData, error: finalizeError } = await supabaseAdmin.rpc(
      "finalize_quotation_email_send",
      {
        p_quotation_id: quote.id,
        p_actor_id: adminUser.id,
        p_resend_id: resendData.id,
        p_idempotency_key: serverIdempotencyKey,
        p_recipient: targetRecipient,
        p_pdf_attached: attachments.length > 0,
      }
    );

    if (finalizeError) {
      console.warn("[ZEZ Edge Function] Notice during finalize_quotation_email_send:", finalizeError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        quotation_id: quote.id,
        resend_id: resendData.id,
        recipient: targetRecipient,
        delivery_count: finalizeData?.delivery_count || (quote.email_delivery_count || 0) + 1,
        pdf_attached: attachments.length > 0,
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

/**
 * Generates an official branded B2B pro-forma quotation PDF document server-side.
 */
function generateServerQuotationPdfBase64(quote: any, items: any[]): string {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  // Header Bar
  doc.setFillColor(41, 47, 54); // Charcoal #292F36
  doc.rect(0, 0, pageWidth, 70, "F");

  doc.setFillColor(181, 18, 27); // Red #B5121B
  doc.rect(0, 67, pageWidth, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("ZEZ AUTOMATION CORPORATION", margin, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(209, 213, 219);
  doc.text("ICT Equipment Distribution & Technology Infrastructure Engineering", margin, 46);
  doc.text("Davao & Zamboanga Hubs · Nationwide Delivery · +63-917-719-8503", margin, 58);

  // Pro-Forma Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(181, 18, 27);
  doc.text("PRO-FORMA QUOTATION", pageWidth - margin, 32, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`${quote.id} (Rev ${quote.revision_number})`, pageWidth - margin, 48, { align: "right" });

  let y = 92;

  // Metadata Grid
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(41, 47, 54);
  doc.text("CLIENT / COMMERCIAL TARGET:", margin, y);
  doc.text("COMMERCIAL TERMS:", margin + 260, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Attention: ${quote.customer_full_name || "Purchasing Department"}`, margin, y);
  doc.text(`Quotation Date: ${new Date(quote.created_at || Date.now()).toLocaleDateString()}`, margin + 260, y);
  y += 12;

  if (quote.customer_company_name) {
    doc.text(`Company: ${quote.customer_company_name}`, margin, y);
  }
  doc.text(`Validity: ${quote.validity_days || 30} Days (Until ${new Date(quote.valid_until).toLocaleDateString()})`, margin + 260, y);
  y += 12;

  doc.text(`Email: ${quote.customer_email || "N/A"}`, margin, y);
  doc.text(`Payment: ${quote.payment_terms || "Standard terms"}`, margin + 260, y);
  y += 12;

  doc.text(`Delivery: ${quote.delivery_city_province || "As specified"}`, margin, y);
  doc.text(`Warranty: ${quote.warranty_terms || "Standard warranty"}`, margin + 260, y);
  y += 22;

  // Table Headers
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, y, contentWidth, 18, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  doc.text("#", margin + 6, y + 12);
  doc.text("Description", margin + 24, y + 12);
  doc.text("Qty", margin + 300, y + 12, { align: "center" });
  doc.text("Unit Price (PHP)", margin + 410, y + 12, { align: "right" });
  doc.text("Subtotal (PHP)", margin + contentWidth - 8, y + 12, { align: "right" });

  y += 20;

  // Item Rows
  items.forEach((it: any, idx: number) => {
    if (y > pageHeight - 140) {
      doc.addPage();
      y = 40;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text(String(idx + 1), margin + 6, y + 10);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    const title = it.product_name || "ICT Equipment";
    doc.text(title.length > 55 ? title.substring(0, 52) + "..." : title, margin + 24, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(`${it.brand || ""} ${it.model || ""}`.trim(), margin + 24, y + 20);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(String(it.quantity), margin + 300, y + 14, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    doc.text(Number(it.unit_price_php).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), margin + 410, y + 14, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(Number(it.line_total_php).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), margin + contentWidth - 8, y + 14, { align: "right" });

    y += 26;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, margin + contentWidth, y);
    y += 4;
  });

  // Summary Box
  y = Math.max(y + 10, pageHeight - 160);
  const summaryX = margin + contentWidth - 220;

  doc.setFillColor(249, 250, 251);
  doc.rect(summaryX, y, 220, 96, "F");
  doc.setDrawColor(229, 231, 235);
  doc.rect(summaryX, y, 220, 96, "S");

  let sy = y + 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text("Subtotal:", summaryX + 12, sy);
  doc.text(`₱${Number(quote.subtotal_php).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, summaryX + 208, sy, { align: "right" });

  if (Number(quote.discount_amount_php) > 0) {
    sy += 14;
    doc.setTextColor(5, 150, 105);
    doc.text("Discount:", summaryX + 12, sy);
    doc.text(`-₱${Number(quote.discount_amount_php).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, summaryX + 208, sy, { align: "right" });
  }

  sy += 14;
  doc.setTextColor(75, 85, 99);
  doc.text("VAT (12%):", summaryX + 12, sy);
  doc.text(`₱${Number(quote.vat_amount_php).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, summaryX + 208, sy, { align: "right" });

  sy += 18;
  doc.setDrawColor(209, 213, 219);
  doc.line(summaryX + 10, sy - 4, summaryX + 210, sy - 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(181, 18, 27);
  doc.text("Grand Total (PHP):", summaryX + 12, sy + 6);
  doc.text(`₱${Number(quote.grand_total_php).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, summaryX + 208, sy + 6, { align: "right" });

  // Conforme Section
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text("CONFORME & ACCEPTANCE:", margin, pageHeight - 75);
  doc.line(margin, pageHeight - 45, margin + 200, pageHeight - 45);
  doc.text("Authorized Signature over Printed Name / Date", margin, pageHeight - 34);

  const dataUri = doc.output("datauristring");
  return dataUri.split(",")[1];
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
