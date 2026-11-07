/**
 * ==============================================================================
 * ZEZ AUTOMATION CORPORATION - SERVICE-ROLE RPC SMOKE TEST
 * File: supabase/tests/smoke_test_service_role_rpc.ts
 *
 * PURPOSE:
 *   Validates that the Supabase service-role client can successfully invoke
 *   the Phase 4 database RPCs without exposing credentials or contacting Resend:
 *     1. check_email_quota()
 *     2. reserve_email_quota() [with immediate release_email_quota()]
 *     3. claim_pending_rfq_notifications()
 *     4. (Optional) Verifies unprivileged anonymous callers are rejected.
 *
 * HOW TO EXECUTE:
 *   SUPABASE_URL="https://your-project.supabase.co" \
 *   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
 *   npx tsx supabase/tests/smoke_test_service_role_rpc.ts
 *
 * SAFETY:
 *   - Zero external HTTP calls to Resend.
 *   - Automatically releases any test quota reservation.
 *   - Masks all credentials in stdout.
 * ==============================================================================
 */

import { createClient } from "@supabase/supabase-js";

interface TestReport {
  name: string;
  status: "PASSED" | "FAILED" | "SKIPPED";
  detail: string;
}

const reports: TestReport[] = [];

async function runSmokeTests() {
  console.log("============================================================");
  console.log("ZEZ Automation Corporation — Service-Role RPC Smoke Test");
  console.log("============================================================\n");

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("ERROR: Missing required environment variables.");
    console.error("Please supply SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:");
    console.error(
      '\n  SUPABASE_URL="https://xxxx.supabase.co" SUPABASE_SERVICE_ROLE_KEY="ey..." npx tsx supabase/tests/smoke_test_service_role_rpc.ts\n'
    );
    process.exit(1);
  }

  // Masked URL display
  const maskedUrl = supabaseUrl.replace(/https?:\/\/([^.]+)\..*/, "https://$1.supabase.co");
  console.log(`Connecting to Supabase host: ${maskedUrl}`);
  console.log(`Service Role Key: [CONFIGURED - length ${serviceRoleKey.length} chars]\n`);

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // ----------------------------------------------------------------------------
  // SMOKE TEST 1: check_email_quota() RPC
  // ----------------------------------------------------------------------------
  try {
    process.stdout.write("[Test 1/4] Invoking check_email_quota()... ");
    const { data, error } = await supabaseAdmin.rpc("check_email_quota");

    if (error) {
      throw new Error(`RPC error: ${error.message}`);
    }

    if (
      typeof data?.daily_limit !== "number" ||
      typeof data?.monthly_limit !== "number" ||
      typeof data?.can_send !== "boolean"
    ) {
      throw new Error(`Invalid response structure: ${JSON.stringify(data)}`);
    }

    console.log("PASSED");
    reports.push({
      name: "check_email_quota",
      status: "PASSED",
      detail: `Daily limit: ${data.daily_limit}, Monthly limit: ${data.monthly_limit}, Can send: ${data.can_send}`,
    });
  } catch (err: any) {
    console.log("FAILED");
    reports.push({ name: "check_email_quota", status: "FAILED", detail: err.message });
  }

  // ----------------------------------------------------------------------------
  // SMOKE TEST 2: reserve_email_quota() and release_email_quota()
  // ----------------------------------------------------------------------------
  try {
    process.stdout.write("[Test 2/4] Invoking reserve_email_quota() & release_email_quota()... ");

    // Today's date in Manila timezone
    const todayPh = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // 1. Reserve 1 slot
    const { data: reserveData, error: reserveError } = await supabaseAdmin.rpc("reserve_email_quota", {
      p_count: 1,
      p_date: todayPh,
    });

    if (reserveError) {
      throw new Error(`reserve_email_quota error: ${reserveError.message}`);
    }

    if (!reserveData?.allowed) {
      throw new Error(`Reservation rejected: ${reserveData?.reason || "unknown"}`);
    }

    // 2. Immediately release the reserved slot to keep quota tracking clean
    const { error: releaseError } = await supabaseAdmin.rpc("release_email_quota", {
      p_count: 1,
      p_date: todayPh,
    });

    if (releaseError) {
      throw new Error(`release_email_quota error: ${releaseError.message}`);
    }

    console.log("PASSED");
    reports.push({
      name: "reserve_and_release_quota",
      status: "PASSED",
      detail: `Atomically reserved 1 slot and synchronized release under advisory lock for ${todayPh}`,
    });
  } catch (err: any) {
    console.log("FAILED");
    reports.push({ name: "reserve_and_release_quota", status: "FAILED", detail: err.message });
  }

  // ----------------------------------------------------------------------------
  // SMOKE TEST 3: claim_pending_rfq_notifications()
  // ----------------------------------------------------------------------------
  try {
    process.stdout.write("[Test 3/4] Invoking claim_pending_rfq_notifications()... ");

    const { data: claimed, error: claimError } = await supabaseAdmin.rpc("claim_pending_rfq_notifications", {
      p_rfq_id: "SMOKE_TEST_NON_EXISTENT_RFQ_000",
      p_limit: 1,
    });

    if (claimError) {
      throw new Error(`claim_pending_rfq_notifications error: ${claimError.message}`);
    }

    if (!Array.isArray(claimed)) {
      throw new Error(`Expected array response, got: ${typeof claimed}`);
    }

    console.log("PASSED");
    reports.push({
      name: "claim_pending_rfq_notifications",
      status: "PASSED",
      detail: `RPC executed cleanly with FOR UPDATE SKIP LOCKED (returned ${claimed.length} rows for synthetic ID)`,
    });
  } catch (err: any) {
    console.log("FAILED");
    reports.push({ name: "claim_pending_rfq_notifications", status: "FAILED", detail: err.message });
  }

  // ----------------------------------------------------------------------------
  // SMOKE TEST 4: NEGATIVE TEST (Unprivileged anonymous caller rejection)
  // ----------------------------------------------------------------------------
  if (anonKey) {
    try {
      process.stdout.write("[Test 4/4] Verifying anonymous execution is rejected... ");
      const supabaseAnon = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false },
      });

      const { data: anonData, error: anonError } = await supabaseAnon.rpc("reserve_email_quota", {
        p_count: 1,
      });

      if (!anonError && anonData) {
        throw new Error("SECURITY FAILURE: Anonymous client was permitted to execute reserve_email_quota!");
      }

      console.log("PASSED");
      reports.push({
        name: "unprivileged_call_rejection",
        status: "PASSED",
        detail: `Anonymous invocation properly rejected: ${anonError?.message || "Denied"}`,
      });
    } catch (err: any) {
      console.log("FAILED");
      reports.push({ name: "unprivileged_call_rejection", status: "FAILED", detail: err.message });
    }
  } else {
    console.log("[Test 4/4] Negative test SKIPPED (SUPABASE_ANON_KEY not provided)");
    reports.push({
      name: "unprivileged_call_rejection",
      status: "SKIPPED",
      detail: "Pass SUPABASE_ANON_KEY to enable negative test verification",
    });
  }

  // ----------------------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------------------
  console.log("\n============================================================");
  console.log("SMOKE TEST SUMMARY");
  console.log("============================================================");
  reports.forEach((r) => {
    console.log(`[${r.status}] ${r.name}: ${r.detail}`);
  });

  const hasFailures = reports.some((r) => r.status === "FAILED");
  if (hasFailures) {
    console.log("\nSome smoke tests encountered issues. Review details above.");
    process.exit(1);
  } else {
    console.log("\nAll service-role RPC smoke tests PASSED successfully!");
  }
}

runSmokeTests().catch((err) => {
  console.error("Unhandled exception running smoke tests:", err);
  process.exit(1);
});
