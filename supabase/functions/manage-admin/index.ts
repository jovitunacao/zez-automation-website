// ==============================================================================
// ZEZ AUTOMATION CORPORATION - SUPABASE EDGE FUNCTION: manage-admin
// Runtime: Deno / TypeScript (Supabase Edge Runtime)
//
// PURPOSE:
//   Secure server-side administrator account provisioning, role assignment, and
//   invitations using Supabase Auth Admin API and the service-role key.
//   Enforces Super Admin privilege verification on all administrative actions.
//
// ACTIONS SUPPORTED:
//   - 'list': List all administrator users.
//   - 'invite': Invite/create an admin via Auth Admin API and insert into administrator_users.
//   - 'update': Update role, active status, or notification preference.
//   - 'delete': Delete an administrator account (with last super admin protection).
//   - 'update_own_preference': Update own receive_rfq_notifications setting.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ManageAdminRequest {
  action: "list" | "invite" | "update" | "delete" | "update_own_preference";
  email?: string;
  fullName?: string;
  role?: "super_admin" | "admin" | "sales_engineer";
  isActive?: boolean;
  receiveRfqNotifications?: boolean;
  targetAdminId?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase service credentials not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract Bearer token from caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize administrative client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Authenticate the calling user's JWT
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session. Please sign in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = userData.user.id;

    // Verify caller's role in public.administrator_users
    const { data: callerAdmin, error: callerError } = await supabaseAdmin
      .from("administrator_users")
      .select("id, email, full_name, role, is_active, receive_rfq_notifications")
      .eq("id", callerId)
      .eq("is_active", true)
      .maybeSingle();

    if (callerError || !callerAdmin) {
      return new Response(
        JSON.stringify({ error: "Access Denied: You do not possess authorized administrator permissions." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isSuperAdmin = callerAdmin.role === "super_admin";

    // Parse request body
    const body: ManageAdminRequest = await req.json();
    const action = body.action;

    // 1. UPDATE OWN NOTIFICATION PREFERENCE (Any active administrator can perform)
    if (action === "update_own_preference") {
      const receiveNotifs = body.receiveRfqNotifications !== false;
      const { data, error } = await supabaseAdmin
        .from("administrator_users")
        .update({
          receive_rfq_notifications: receiveNotifs,
          updated_at: new Date().toISOString(),
        })
        .eq("id", callerId)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, user: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. LIST ADMINISTRATORS (Any active administrator can view)
    if (action === "list") {
      const { data: admins, error: listError } = await supabaseAdmin
        .from("administrator_users")
        .select("*")
        .order("created_at", { ascending: true });

      if (listError) {
        return new Response(
          JSON.stringify({ error: listError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, administrators: admins, isCallerSuperAdmin: isSuperAdmin }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -------------------------------------------------------------------------
    // ALL SUBSEQUENT ACTIONS (INVITE, UPDATE, DELETE) REQUIRE SUPER ADMIN ROLE
    // -------------------------------------------------------------------------
    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "Access Denied: Only Super Admins can manage administrator accounts." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. INVITE NEW ADMINISTRATOR
    if (action === "invite") {
      const email = body.email?.trim().toLowerCase();
      const fullName = body.fullName?.trim();
      const role = body.role || "sales_engineer";
      const receiveNotifs = body.receiveRfqNotifications !== false;

      if (!email || !fullName) {
        return new Response(
          JSON.stringify({ error: "Both email and full name are required to invite an administrator." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if email already exists in administrator_users
      const { data: existingAdmin } = await supabaseAdmin
        .from("administrator_users")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      if (existingAdmin) {
        return new Response(
          JSON.stringify({ error: `An administrator account with email ${email} already exists.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Invite user through Supabase Auth Admin API
      let authUserId: string | null = null;
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          role: role,
        },
      });

      if (inviteError) {
        // If user already exists in auth.users (e.g. registered customer promoting to admin), fetch their id
        if (inviteError.message?.toLowerCase().includes("already registered") || inviteError.status === 422) {
          const { data: listUserResult } = await supabaseAdmin.auth.admin.listUsers();
          const found = listUserResult?.users?.find(u => u.email?.toLowerCase() === email);
          if (found) {
            authUserId = found.id;
          } else {
            return new Response(
              JSON.stringify({ error: `Auth registration error: ${inviteError.message}` }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          return new Response(
            JSON.stringify({ error: `Failed to dispatch Supabase Auth invitation: ${inviteError.message}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        authUserId = inviteData?.user?.id;
      }

      if (!authUserId) {
        return new Response(
          JSON.stringify({ error: "Could not retrieve user ID from Supabase Auth." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert into public.administrator_users
      const { data: newAdminRow, error: insertError } = await supabaseAdmin
        .from("administrator_users")
        .insert({
          id: authUserId,
          email: email,
          full_name: fullName,
          role: role,
          is_active: true,
          receive_rfq_notifications: receiveNotifs,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("[ZEZ Manage-Admin] Error inserting administrator row:", insertError);
        return new Response(
          JSON.stringify({ error: `Auth user created, but database record failed: ${insertError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Invitation email sent to ${email}. Account added as ${role}.`,
          administrator: newAdminRow,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. UPDATE ADMINISTRATOR (Role, Status, Notifications)
    if (action === "update") {
      const targetId = body.targetAdminId;
      if (!targetId) {
        return new Response(
          JSON.stringify({ error: "targetAdminId is required for update." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch current target record
      const { data: targetAdmin } = await supabaseAdmin
        .from("administrator_users")
        .select("*")
        .eq("id", targetId)
        .maybeSingle();

      if (!targetAdmin) {
        return new Response(
          JSON.stringify({ error: "Target administrator record not found." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Last active Super Admin safeguard
      if (
        targetAdmin.role === "super_admin" &&
        targetAdmin.is_active === true &&
        (body.role !== undefined && body.role !== "super_admin" || body.isActive === false)
      ) {
        const { count: superAdminCount } = await supabaseAdmin
          .from("administrator_users")
          .select("id", { count: "exact", head: true })
          .eq("role", "super_admin")
          .eq("is_active", true)
          .neq("id", targetId);

        if (!superAdminCount || superAdminCount < 1) {
          return new Response(
            JSON.stringify({ error: "Action Rejected: Cannot deactivate or demote the last active Super Admin account." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const updates: any = { updated_at: new Date().toISOString() };
      if (body.role !== undefined) updates.role = body.role;
      if (body.isActive !== undefined) updates.is_active = body.isActive;
      if (body.receiveRfqNotifications !== undefined) updates.receive_rfq_notifications = body.receiveRfqNotifications;
      if (body.fullName !== undefined) updates.full_name = body.fullName.trim();

      const { data: updatedAdmin, error: updateError } = await supabaseAdmin
        .from("administrator_users")
        .update(updates)
        .eq("id", targetId)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, administrator: updatedAdmin }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. DELETE ADMINISTRATOR
    if (action === "delete") {
      const targetId = body.targetAdminId;
      if (!targetId) {
        return new Response(
          JSON.stringify({ error: "targetAdminId is required for deletion." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Cannot delete self
      if (targetId === callerId) {
        return new Response(
          JSON.stringify({ error: "Cannot delete your own active administrator account." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if target is a super admin
      const { data: targetAdmin } = await supabaseAdmin
        .from("administrator_users")
        .select("role, is_active")
        .eq("id", targetId)
        .maybeSingle();

      if (targetAdmin?.role === "super_admin" && targetAdmin.is_active) {
        const { count: superAdminCount } = await supabaseAdmin
          .from("administrator_users")
          .select("id", { count: "exact", head: true })
          .eq("role", "super_admin")
          .eq("is_active", true)
          .neq("id", targetId);

        if (!superAdminCount || superAdminCount < 1) {
          return new Response(
            JSON.stringify({ error: "Action Rejected: Cannot delete the last active Super Admin account." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Delete from administrator_users
      const { error: dbDeleteError } = await supabaseAdmin
        .from("administrator_users")
        .delete()
        .eq("id", targetId);

      if (dbDeleteError) {
        return new Response(
          JSON.stringify({ error: dbDeleteError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete from auth.users via admin API
      try {
        await supabaseAdmin.auth.admin.deleteUser(targetId);
      } catch (authErr: any) {
        console.warn(`[ZEZ Manage-Admin] Warning deleting auth user ${targetId}:`, authErr.message);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Administrator account deleted successfully." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action "${action}".` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
