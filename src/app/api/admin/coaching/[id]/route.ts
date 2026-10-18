import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { adminAuthErrorStatus, requireAdminUser } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/coaching/[id] — Admin actions: verify, suspend, unsuspend.
 * coach_profiles only lets owners update their row, so the admin check runs
 * first and the update uses the service-role client (issue #385).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminUser();
    const supabase: S = getSupabaseAdmin();

    const { id } = await params;
    const { action, reason } = await request.json();

    const updates: Record<string, unknown> = {};

    switch (action) {
      case "verify":
        updates.is_verified = true;
        updates.verified_at = new Date().toISOString();
        break;
      case "unverify":
        updates.is_verified = false;
        updates.verified_at = null;
        break;
      case "suspend":
        updates.is_suspended = true;
        updates.is_active = false;
        updates.suspended_at = new Date().toISOString();
        updates.suspended_reason = reason || null;
        break;
      case "unsuspend":
        updates.is_suspended = false;
        updates.suspended_at = null;
        updates.suspended_reason = null;
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { data: updatedRows, error } = await supabase
      .from("coach_profiles")
      .update(updates)
      .eq("id", id)
      .select("id");
    if (error) {
      logger.error("Error updating coach", { error });
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
    if (!updatedRows?.length) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    const authStatus = adminAuthErrorStatus(error);
    if (authStatus) {
      return NextResponse.json({ error: (error as Error).message }, { status: authStatus });
    }
    logger.error("Error in admin coaching PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
