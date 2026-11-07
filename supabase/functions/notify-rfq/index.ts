// ==============================================================================
// ZEZ AUTOMATION CORPORATION - SUPABASE EDGE FUNCTION: notify-rfq
// Runtime: Deno / TypeScript (Supabase Edge Runtime)
//
// PURPOSE:
//   Dispatches individual email notifications to active, authorized administrators
//   when a new Request for Quotation (RFQ) is submitted on the ZEZ website.
//   Integrates with Resend API using server-side credentials.
//
// ENVIRONMENT VARIABLES REQUIRED:
//   - RESEND_API_KEY: Resend API key (re_xxxx)
//   - RESEND_FROM_EMAIL: Verified sender address e.g. "ZEZ Procurement <notifications@zezautomation.ph>"
//   - PUBLIC_SITE_URL: Website URL e.g. "https://zezautomation.ph"
//   - SUPABASE_URL: Automatically injected by Supabase Edge runtime
//   - SUPABASE_SERVICE_ROLE_KEY: Automatically injected by Supabase Edge runtime
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_DAILY_LIMIT = 100; // Resend Free Tier daily ceiling
const RESEND_MONTHLY_LIMIT = 3000; // Resend Free Tier monthly ceiling

// Standard CORS headers for pre-flight & browser calls
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestPayload {
  rfq_id?: string;
  process_pending?: boolean;
  type?: string;
  record?: {
    id: string;
    customer_full_name?: string;
    customer_company_name?: string;
    customer_email?: string;
    customer_mobile_number?: string;
    delivery_city_province?: string;
    total_estimated_php?: number;
    created_at?: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "ZEZ RFQ Portal <onboarding@resend.dev>";
    const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://zezautomation.ph";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase runtime environment variables." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize administrative Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let payload: RequestPayload = {};
    if (req.headers.get("content-type")?.includes("application/json")) {
      try {
        payload = await req.json();
      } catch {
        payload = {};
      }
    }

    // Determine target RFQ ID
    const targetRfqId = payload.rfq_id || payload.record?.id;

    // Check Resend API key
    if (!resendApiKey) {
      console.warn("[ZEZ Notify-RFQ] RESEND_API_KEY is not configured in Supabase secrets.");
      // If RFQ is specified, log warning in rfq_notification_logs so admin sees it in dashboard
      if (targetRfqId) {
        await supabase
          .from("rfq_notification_logs")
          .update({
            status: "failed",
            error_message: "RESEND_API_KEY secret is not set in Supabase project settings. Email was not sent.",
            updated_at: new Date().toISOString(),
          })
          .eq("rfq_id", targetRfqId)
          .eq("status", "pending");
      }

      return new Response(
        JSON.stringify({
          success: false,
          warning: "RESEND_API_KEY not set. Check Supabase Edge Function secrets.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check daily Resend quota in Philippine Standard Time (UTC+8)
    const phDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const { data: quotaRow } = await supabase
      .from("email_quota_tracking")
      .select("sent_count")
      .eq("date_key", phDateStr)
      .maybeSingle();

    const todaySentCount = quotaRow?.sent_count || 0;
    if (todaySentCount >= RESEND_DAILY_LIMIT) {
      console.warn(`[ZEZ Notify-RFQ] Daily Resend Free quota reached: ${todaySentCount}/${RESEND_DAILY_LIMIT}`);
      if (targetRfqId) {
        await supabase
          .from("rfq_notification_logs")
          .update({
            status: "quota_exceeded",
            error_message: `Daily Resend limit reached (${todaySentCount}/${RESEND_DAILY_LIMIT} sent today). Notification paused.`,
            updated_at: new Date().toISOString(),
          })
          .eq("rfq_id", targetRfqId)
          .eq("status", "pending");
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Daily Resend Free limit reached (100 emails/day). RFQ was saved; email paused.",
          todaySentCount,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine pending notifications to process
    let query = supabase
      .from("rfq_notification_logs")
      .select("*, quotation_requests(*, quotation_items(*))")
      .in("status", ["pending", "retrying"]);

    if (targetRfqId) {
      query = query.eq("rfq_id", targetRfqId);
    }

    // Limit batch size to prevent timeout and respect free tier bursts
    const { data: pendingLogs, error: pendingError } = await query.limit(20);

    if (pendingError) {
      console.error("[ZEZ Notify-RFQ] Error querying notification logs:", pendingError);
      return new Response(
        JSON.stringify({ error: pendingError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingLogs || pendingLogs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending RFQ notifications to dispatch.", dispatched: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let dispatchedCount = 0;
    let failedCount = 0;

    // Process each notification individually
    for (const log of pendingLogs) {
      // Re-verify daily quota inside loop
      if (todaySentCount + dispatchedCount >= RESEND_DAILY_LIMIT) {
        await supabase
          .from("rfq_notification_logs")
          .update({
            status: "quota_exceeded",
            error_message: "Daily Resend Free ceiling reached during batch dispatch.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", log.id);
        continue;
      }

      const rfq = log.quotation_requests;
      if (!rfq) {
        // Missing parent RFQ, cancel orphaned log
        await supabase
          .from("rfq_notification_logs")
          .update({
            status: "cancelled",
            error_message: "Parent quotation request row was deleted or not found.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", log.id);
        continue;
      }

      const items = rfq.quotation_items || [];
      const recipientName = log.recipient_name || "ZEZ Administrator";
      const recipientEmail = log.recipient_email;

      // Format submission time in Philippine Time (PST: UTC+8)
      const submissionDate = new Date(rfq.created_at || log.created_at);
      const phFormattedDate = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        dateStyle: "full",
        timeStyle: "short",
      }).format(submissionDate);

      // Build HTML email template
      const emailHtml = generateRfqEmailHtml({
        recipientName,
        rfqId: rfq.id,
        customerName: rfq.customer_full_name,
        companyName: rfq.customer_company_name,
        customerEmail: rfq.customer_email,
        customerPhone: rfq.customer_mobile_number,
        deliveryLocation: rfq.delivery_city_province,
        deliveryAddress: rfq.delivery_address,
        tinNumber: rfq.tin_number,
        targetDeliveryDate: rfq.target_delivery_date,
        additionalRequirements: rfq.additional_requirements,
        totalEstimatedPhp: rfq.total_estimated_php,
        items,
        phFormattedDate,
        adminDashboardUrl: `${siteUrl}/?view=admin&tab=rfqs&rfq=${encodeURIComponent(rfq.id)}`,
      });

      const emailText = generateRfqEmailText({
        recipientName,
        rfqId: rfq.id,
        customerName: rfq.customer_full_name,
        companyName: rfq.customer_company_name,
        customerEmail: rfq.customer_email,
        customerPhone: rfq.customer_mobile_number,
        totalEstimatedPhp: rfq.total_estimated_php,
        items,
        phFormattedDate,
        adminDashboardUrl: `${siteUrl}/?view=admin&tab=rfqs&rfq=${encodeURIComponent(rfq.id)}`,
      });

      const subject = `[ZEZ RFQ] New Quotation Request: ${rfq.id} — ${rfq.customer_company_name || rfq.customer_full_name}`;

      try {
        // Dispatch individual email via Resend REST API
        const resendRes = await fetch(RESEND_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [recipientEmail],
            subject: subject,
            html: emailHtml,
            text: emailText,
            headers: {
              "X-Entity-Ref-ID": rfq.id,
            },
          }),
        });

        const resendData = await resendRes.json();

        if (resendRes.ok && resendData?.id) {
          // Success: Mark log as sent
          await supabase
            .from("rfq_notification_logs")
            .update({
              status: "sent",
              resend_id: resendData.id,
              sent_at: new Date().toISOString(),
              last_attempt_at: new Date().toISOString(),
              attempt_count: (log.attempt_count || 0) + 1,
              error_message: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", log.id);

          dispatchedCount++;

          // Upsert email quota counter
          await supabase.rpc("increment_email_quota_counter", { p_date: phDateStr });
        } else {
          // Failure from Resend
          const errMsg = resendData?.message || `Resend error HTTP ${resendRes.status}`;
          console.error(`[ZEZ Notify-RFQ] Resend delivery failed for ${recipientEmail}:`, errMsg);

          const newAttemptCount = (log.attempt_count || 0) + 1;
          const nextStatus = newAttemptCount >= (log.max_attempts || 3) ? "failed" : "retrying";

          await supabase
            .from("rfq_notification_logs")
            .update({
              status: nextStatus,
              error_message: errMsg,
              attempt_count: newAttemptCount,
              last_attempt_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", log.id);

          failedCount++;
        }
      } catch (err: any) {
        console.error(`[ZEZ Notify-RFQ] Network exception sending to ${recipientEmail}:`, err);
        const newAttemptCount = (log.attempt_count || 0) + 1;
        await supabase
          .from("rfq_notification_logs")
          .update({
            status: newAttemptCount >= 3 ? "failed" : "retrying",
            error_message: err.message || "Network exception contacting Resend API.",
            attempt_count: newAttemptCount,
            last_attempt_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", log.id);

        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dispatched: dispatchedCount,
        failed: failedCount,
        totalProcessed: pendingLogs.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (globalErr: any) {
    console.error("[ZEZ Notify-RFQ] Global unhandled exception:", globalErr);
    return new Response(
      JSON.stringify({ error: globalErr.message || "Internal server error in notification dispatcher." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// -----------------------------------------------------------------------------
// HTML & TEXT EMAIL GENERATORS (Corporate ZEZ Automation Styling)
// -----------------------------------------------------------------------------

function generateRfqEmailHtml(data: {
  recipientName: string;
  rfqId: string;
  customerName: string;
  companyName?: string;
  customerEmail: string;
  customerPhone: string;
  deliveryLocation?: string;
  deliveryAddress?: string;
  tinNumber?: string;
  targetDeliveryDate?: string;
  additionalRequirements?: string;
  totalEstimatedPhp?: number;
  items: any[];
  phFormattedDate: string;
  adminDashboardUrl: string;
}): string {
  const itemsHtml = data.items
    .map(
      (it, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb; font-size: 13px;">
        <td style="padding: 10px 12px; color: #6b7280; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 10px 12px;">
          <div style="font-weight: 700; color: #111827;">${escapeHtml(it.product_name)}</div>
          <div style="font-size: 11px; color: #6b7280; font-family: monospace;">
            SKU: ${escapeHtml(it.sku)} &bull; Model: ${escapeHtml(it.model)} &bull; ${escapeHtml(it.brand)}
          </div>
          ${it.notes ? `<div style="font-size: 11px; color: #b91c1c; margin-top: 2px;">Note: ${escapeHtml(it.notes)}</div>` : ""}
        </td>
        <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #111827;">
          ${it.quantity}
        </td>
        <td style="padding: 10px 12px; text-align: right; font-family: monospace; color: #374151;">
          ${it.unit_price_php ? `₱${Number(it.unit_price_php).toLocaleString()}` : '<span style="color:#9ca3af;">Custom / TBD</span>'}
        </td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 700; font-family: monospace; color: #b91c1c;">
          ${it.subtotal_php ? `₱${Number(it.subtotal_php).toLocaleString()}` : '<span style="color:#9ca3af;">TBD</span>'}
        </td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Quotation Request: ${escapeHtml(data.rfqId)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 680px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
          
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #292F36; padding: 24px 32px; border-bottom: 4px solid #B5121B;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 900; letter-spacing: 0.5px; color: #ffffff;">
                      ZEZ <span style="color: #B5121B;">AUTOMATION</span>
                    </div>
                    <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">
                      Corporate Procurement &amp; Distribution
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #B5121B; color: #ffffff; font-size: 12px; font-weight: 700; padding: 6px 14px; rounded: 6px; border-radius: 6px; font-family: monospace;">
                      ${escapeHtml(data.rfqId)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notification Notice -->
          <tr>
            <td style="padding: 28px 32px 16px 32px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">
                Hello <strong>${escapeHtml(data.recipientName)}</strong>,
              </p>
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">
                A new Request for Quotation (RFQ) has been submitted.
              </h1>
              <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                Submitted on: <strong>${escapeHtml(data.phFormattedDate)} (Philippine Standard Time)</strong>.
              </p>
            </td>
          </tr>

          <!-- Customer Information Card -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px 20px;">
                <div style="font-size: 11px; font-weight: 800; color: #B5121B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                  Customer &amp; Procurement Details
                </div>
                <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; width: 35%;">Client Name:</td>
                    <td style="padding: 4px 0; font-weight: 700; color: #111827;">${escapeHtml(data.customerName)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">Company / Org:</td>
                    <td style="padding: 4px 0; font-weight: 700; color: #111827;">${escapeHtml(data.companyName || "Direct / Individual Client")}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">Work Email:</td>
                    <td style="padding: 4px 0; color: #111827;">
                      <a href="mailto:${escapeHtml(data.customerEmail)}" style="color: #B5121B; text-decoration: none; font-weight: 600;">
                        ${escapeHtml(data.customerEmail)}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">Mobile / Viber:</td>
                    <td style="padding: 4px 0; font-weight: 600; color: #111827;">${escapeHtml(data.customerPhone)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">Delivery Location:</td>
                    <td style="padding: 4px 0; color: #111827;">${escapeHtml(data.deliveryLocation || "Metro Manila")}</td>
                  </tr>
                  ${data.tinNumber ? `
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">TIN Number:</td>
                    <td style="padding: 4px 0; font-family: monospace; color: #111827;">${escapeHtml(data.tinNumber)}</td>
                  </tr>` : ""}
                  ${data.targetDeliveryDate ? `
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">Target Delivery:</td>
                    <td style="padding: 4px 0; color: #111827;">${escapeHtml(data.targetDeliveryDate)}</td>
                  </tr>` : ""}
                </table>
              </div>
            </td>
          </tr>

          ${data.additionalRequirements ? `
          <!-- Additional Requirements Note -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px;">
                <div style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase;">Customer Project Notes:</div>
                <div style="font-size: 12px; color: #92400e; margin-top: 4px; line-height: 1.4;">
                  ${escapeHtml(data.additionalRequirements)}
                </div>
              </div>
            </td>
          </tr>` : ""}

          <!-- Requested Equipment Table -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="font-size: 11px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                Requested Equipment (${data.items.length} line items)
              </div>
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">
                    <th style="padding: 10px 12px; text-align: left; width: 30px;">#</th>
                    <th style="padding: 10px 12px; text-align: left;">Product &amp; SKU</th>
                    <th style="padding: 10px 12px; text-align: center; width: 60px;">Qty</th>
                    <th style="padding: 10px 12px; text-align: right; width: 110px;">Ref Price</th>
                    <th style="padding: 10px 12px; text-align: right; width: 110px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr style="background-color: #f9fafb; font-weight: 800;">
                    <td colspan="4" style="padding: 12px; text-align: right; font-size: 13px; color: #111827;">
                      Estimated Indicative Total:
                    </td>
                    <td style="padding: 12px; text-align: right; font-size: 15px; color: #B5121B; font-family: monospace;">
                      ${data.totalEstimatedPhp ? `₱${Number(data.totalEstimatedPhp).toLocaleString()}` : 'Custom RFQ'}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div style="font-size: 11px; color: #9ca3af; margin-top: 6px; font-style: italic;">
                * All indicative pricing subject to corporate account discounting, project volume, and tax invoicing.
              </div>
            </td>
          </tr>

          <!-- Action Button CTA -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <a href="${escapeHtml(data.adminDashboardUrl)}" style="display: inline-block; background-color: #B5121B; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(181, 18, 27, 0.3);">
                Review &amp; Prepare Official Quotation &rarr;
              </a>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #9ca3af;">
                Or sign in directly to the ZEZ Operations Portal to manage RFQ status and print quotation PDFs.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.5;">
              <div>
                <strong>ZEZ Automation Corporation</strong> &bull; Unit 1402, Corporate Center, Ortigas Center, Pasig City
              </div>
              <div style="margin-top: 4px;">
                Direct Procurement Hotlines: (02) 8800-9390 &bull; +63 917 800 9390 &bull; sales@zezautomation.ph
              </div>
              <div style="margin-top: 8px; color: #cbd5e1;">
                You received this alert because your administrator account has RFQ notifications enabled in the ZEZ Operations Portal.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function generateRfqEmailText(data: {
  recipientName: string;
  rfqId: string;
  customerName: string;
  companyName?: string;
  customerEmail: string;
  customerPhone: string;
  totalEstimatedPhp?: number;
  items: any[];
  phFormattedDate: string;
  adminDashboardUrl: string;
}): string {
  const itemsText = data.items
    .map(
      (it, idx) =>
        `${idx + 1}. ${it.product_name} (SKU: ${it.sku}, Qty: ${it.quantity}${
          it.unit_price_php ? `, ₱${Number(it.unit_price_php).toLocaleString()}` : ""
        })`
    )
    .join("\n");

  return `
ZEZ AUTOMATION CORPORATION - NEW RFQ ALERT
Reference: ${data.rfqId}
Submitted: ${data.phFormattedDate} (PST)

Dear ${data.recipientName},

A new Request for Quotation has been submitted through the ZEZ Automation storefront.

CUSTOMER DETAILS:
- Name: ${data.customerName}
- Company: ${data.companyName || "Direct / Individual"}
- Email: ${data.customerEmail}
- Mobile/Viber: ${data.customerPhone}

REQUESTED EQUIPMENT:
${itemsText}

Estimated Indicative Total: ${
    data.totalEstimatedPhp ? `₱${Number(data.totalEstimatedPhp).toLocaleString()}` : "Custom RFQ"
  }

OPEN IN ADMIN PORTAL:
${data.adminDashboardUrl}

--
ZEZ Automation Corporation
Corporate Procurement & ICT Distribution
sales@zezautomation.ph
`.trim();
}

function escapeHtml(str?: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
