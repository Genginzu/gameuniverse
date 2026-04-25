import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

type RouteParams = { params: Promise<{ id: string }> };

async function requireAdmin(supabase: S) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

/** PATCH /api/admin/coaching/[id] — Admin actions: verify, suspend, unsuspend */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase: S = await createRouteHandlerClient();
    const admin = await requireAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

    const { error } = await supabase.from("coach_profiles").update(updates).eq("id", id);
    if (error) {
      logger.error("Error updating coach", { error });
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    logger.error("Error in admin coaching PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
