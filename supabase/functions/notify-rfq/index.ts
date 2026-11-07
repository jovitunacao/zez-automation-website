// ==============================================================================
// ZEZ AUTOMATION CORPORATION - SUPABASE EDGE FUNCTION: notify-rfq (HARDENED)
// Runtime: Deno / TypeScript (Supabase Edge Runtime)
//
// PURPOSE:
//   Dispatches individual email notifications to active, authorized administrators
//   when a new Request for Quotation (RFQ) is submitted on the ZEZ website.
//   Integrates with Resend API using server-side credentials.
//
// SECURITY & RELIABILITY GUARDS:
//   1. Explicit server-side authorization: requires x-webhook-secret header OR
//      valid Bearer JWT of an active administrator or service-role. Unauthorized
//      requests are immediately rejected with HTTP 401.
//   2. Atomic row claiming via PostgreSQL 'claim_pending_rfq_notifications' RPC:
//      uses FOR UPDATE SKIP LOCKED to prevent duplicate emails under concurrent invocations.
//   3. Resend Idempotency-Key headers ('rfq_{id}_{recipient}_{attempt}') for zero-duplicate guarantee.
//   4. Enforces both daily (100) and monthly (3,000) Resend Free tier quota ceilings.
//   5. Fetches corporate branding and contact details dynamically from public.site_settings.
//
// ENVIRONMENT VARIABLES REQUIRED:
//   - RESEND_API_KEY: Resend API key (re_xxxx)
//   - RESEND_FROM_EMAIL: Verified sender address e.g. "ZEZ Procurement <notifications@zezautomation.ph>"
//   - NOTIFY_WEBHOOK_SECRET: Secret shared with database webhook / pg_net trigger
//   - PUBLIC_SITE_URL: Website URL e.g. "https://zezautomation.ph"
//   - SUPABASE_URL: Injected automatically by Supabase Edge runtime
//   - SUPABASE_SERVICE_ROLE_KEY: Injected automatically by Supabase Edge runtime
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_URL = "https://api.resend.com/emails";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
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

interface SiteSettings {
  company_name: string;
  tagline: string;
  phone_primary: string;
  phone_secondary: string;
  mobile_viber: string;
  email_sales: string;
  office_address: string;
}

serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "ZEZ RFQ Portal <onboarding@resend.dev>";
    const webhookSecret = Deno.env.get("NOTIFY_WEBHOOK_SECRET");
    const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://zezautomation.ph";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase service runtime environment variables." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize administrative Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // 2. SERVER-SIDE AUTHENTICATION & ACCESS CONTROL
    // Caller MUST provide either a valid x-webhook-secret OR a valid Bearer token for an active admin
    let isAuthorized = false;

    // Check webhook secret header (from database trigger or Supabase database webhook)
    const incomingSecret = req.headers.get("x-webhook-secret");
    if (webhookSecret && incomingSecret && incomingSecret === webhookSecret) {
      isAuthorized = true;
    }

    // Check Bearer authorization token
    if (!isAuthorized) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();

        // Check if caller used the service role key directly
        if (token === supabaseServiceKey) {
          isAuthorized = true;
        } else {
          // Verify user session JWT and check if caller is an active administrator
          const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
          if (!userError && userData?.user?.id) {
            const { data: adminRow } = await supabaseAdmin
              .from("administrator_users")
              .select("id, role, is_active")
              .eq("id", userData.user.id)
              .eq("is_active", true)
              .maybeSingle();

            if (adminRow && ["super_admin", "admin", "sales_engineer"].includes(adminRow.role)) {
              isAuthorized = true;
            }
          }
        }
      }
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: Access denied. Missing or invalid webhook secret or administrator session.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Parse request payload
    let payload: RequestPayload = {};
    if (req.headers.get("content-type")?.includes("application/json")) {
      try {
        payload = await req.json();
      } catch {
        payload = {};
      }
    }

    const targetRfqId = payload.rfq_id || payload.record?.id;

    // 4. Validate Resend API key
    if (!resendApiKey) {
      console.warn("[ZEZ Notify-RFQ] RESEND_API_KEY secret is not configured in Supabase project.");
      if (targetRfqId) {
        await supabaseAdmin
          .from("rfq_notification_logs")
          .update({
            status: "failed",
            error_message: "RESEND_API_KEY secret not configured in Supabase Edge Function secrets.",
            updated_at: new Date().toISOString(),
          })
          .eq("rfq_id", targetRfqId)
          .eq("status", "pending");
      }

      return new Response(
        JSON.stringify({
          success: false,
          warning: "RESEND_API_KEY secret not set. Notification queued but email paused.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Check email quota in Philippine Standard Time (UTC+8)
    const phDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const { data: quotaStatus, error: quotaCheckError } = await supabaseAdmin.rpc("check_email_quota", {
      p_date: phDateStr,
    });

    if (quotaCheckError) {
      console.warn("[ZEZ Notify-RFQ] Warning checking quota RPC:", quotaCheckError.message);
    } else if (quotaStatus && !quotaStatus.can_send) {
      console.warn(`[ZEZ Notify-RFQ] Email quota ceiling reached: ${quotaStatus.reason}`);
      if (targetRfqId) {
        await supabaseAdmin
          .from("rfq_notification_logs")
          .update({
            status: "quota_exceeded",
            error_message: quotaStatus.reason,
            updated_at: new Date().toISOString(),
          })
          .eq("rfq_id", targetRfqId)
          .in("status", ["pending", "retrying"]);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: quotaStatus.reason,
          quotaStatus,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. ATOMIC ROW CLAIMING VIA RPC (FOR UPDATE SKIP LOCKED)
    // Ensures concurrent calls never process or send the same notification twice!
    const { data: claimedRows, error: claimError } = await supabaseAdmin.rpc("claim_pending_rfq_notifications", {
      p_rfq_id: targetRfqId || null,
      p_limit: 15,
    });

    if (claimError) {
      console.error("[ZEZ Notify-RFQ] Error claiming pending notifications:", claimError);
      return new Response(
        JSON.stringify({ error: `Failed to claim notification queue: ${claimError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!claimedRows || claimedRows.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No pending RFQ notifications available or already claimed by another worker.",
          dispatched: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Load verified business settings from public.site_settings
    let siteSettings: SiteSettings = {
      company_name: "ZEZ Automation Corporation",
      tagline: "Powering Business Through Technology",
      phone_primary: "(02) 8800-9390",
      phone_secondary: "+63 917 800 9390",
      mobile_viber: "+63 917 800 9390",
      email_sales: "sales@zezautomation.ph",
      office_address: "Unit 1402, Corporate Center, Emerald Avenue, Ortigas Center, Pasig City, Metro Manila 1605 Philippines",
    };

    try {
      const { data: settingsRow } = await supabaseAdmin
        .from("site_settings")
        .select("*")
        .eq("id", "current")
        .maybeSingle();

      if (settingsRow) {
        siteSettings = {
          company_name: settingsRow.company_name || siteSettings.company_name,
          tagline: settingsRow.tagline || siteSettings.tagline,
          phone_primary: settingsRow.phone_primary || siteSettings.phone_primary,
          phone_secondary: settingsRow.phone_secondary || siteSettings.phone_secondary,
          mobile_viber: settingsRow.mobile_viber || siteSettings.mobile_viber,
          email_sales: settingsRow.email_sales || siteSettings.email_sales,
          office_address: settingsRow.office_address || siteSettings.office_address,
        };
      }
    } catch (settingsErr) {
      console.warn("[ZEZ Notify-RFQ] Using verified default corporate details:", settingsErr);
    }

    let dispatchedCount = 0;
    let failedCount = 0;

    // 8. Process each claimed notification individually
    for (const log of claimedRows) {
      // Re-verify quota mid-batch
      const { data: liveQuota } = await supabaseAdmin.rpc("check_email_quota", { p_date: phDateStr });
      if (liveQuota && !liveQuota.can_send) {
        await supabaseAdmin
          .from("rfq_notification_logs")
          .update({
            status: "quota_exceeded",
            error_message: liveQuota.reason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", log.id);
        continue;
      }

      // Fetch parent RFQ and associated quotation items
      const { data: rfq, error: rfqError } = await supabaseAdmin
        .from("quotation_requests")
        .select("*, quotation_items(*)")
        .eq("id", log.rfq_id)
        .maybeSingle();

      if (rfqError || !rfq) {
        await supabaseAdmin
          .from("rfq_notification_logs")
          .update({
            status: "cancelled",
            error_message: "Parent quotation request record was deleted or not found.",
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

      // Build HTML & plaintext email templates with verified corporate info
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
        siteSettings,
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
        siteSettings,
      });

      const subject = `[ZEZ RFQ] New Quotation Request: ${rfq.id} — ${rfq.customer_company_name || rfq.customer_full_name}`;

      // Idempotency key per recipient, RFQ, and attempt
      const idempotencyKey = `rfq_${rfq.id}_${recipientEmail}_attempt_${log.attempt_count}`;

      try {
        const resendRes = await fetch(RESEND_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
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
          await supabaseAdmin
            .from("rfq_notification_logs")
            .update({
              status: "sent",
              resend_id: resendData.id,
              sent_at: new Date().toISOString(),
              error_message: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", log.id);

          dispatchedCount++;

          // Concurrency-safe atomic quota increment
          await supabaseAdmin.rpc("increment_email_quota_counter", { p_date: phDateStr });
        } else {
          const errMsg = resendData?.message || `Resend error HTTP ${resendRes.status}`;
          console.error(`[ZEZ Notify-RFQ] Resend delivery failed for ${recipientEmail}:`, errMsg);

          const isTerminal = (log.attempt_count || 1) >= (log.max_attempts || 3);

          await supabaseAdmin
            .from("rfq_notification_logs")
            .update({
              status: isTerminal ? "failed" : "retrying",
              error_message: errMsg,
              updated_at: new Date().toISOString(),
            })
            .eq("id", log.id);

          failedCount++;
        }
      } catch (err: any) {
        console.error(`[ZEZ Notify-RFQ] Network exception sending to ${recipientEmail}:`, err);
        const isTerminal = (log.attempt_count || 1) >= (log.max_attempts || 3);

        await supabaseAdmin
          .from("rfq_notification_logs")
          .update({
            status: isTerminal ? "failed" : "retrying",
            error_message: err.message || "Network exception contacting Resend API.",
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
        totalClaimed: claimedRows.length,
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
  siteSettings: SiteSettings;
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
                      ${escapeHtml(data.siteSettings.tagline)}
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #B5121B; color: #ffffff; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 6px; font-family: monospace;">
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
                  ${data.deliveryAddress ? `
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">Delivery Address:</td>
                    <td style="padding: 4px 0; color: #111827;">${escapeHtml(data.deliveryAddress)}</td>
                  </tr>` : ""}
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

          <!-- Verified Corporate Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; line-height: 1.6;">
              <div>
                <strong>${escapeHtml(data.siteSettings.company_name)}</strong> &bull; ${escapeHtml(data.siteSettings.office_address)}
              </div>
              <div style="margin-top: 4px;">
                Direct Procurement Hotlines: ${escapeHtml(data.siteSettings.phone_primary)} &bull; ${escapeHtml(data.siteSettings.mobile_viber)} &bull; ${escapeHtml(data.siteSettings.email_sales)}
              </div>
              <div style="margin-top: 8px; color: #9ca3af; font-size: 10px;">
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
  siteSettings: SiteSettings;
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
${data.siteSettings.company_name.toUpperCase()} - NEW RFQ ALERT
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
${data.siteSettings.company_name}
${data.siteSettings.office_address}
Hotlines: ${data.siteSettings.phone_primary} / ${data.siteSettings.mobile_viber}
Sales: ${data.siteSettings.email_sales}
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
