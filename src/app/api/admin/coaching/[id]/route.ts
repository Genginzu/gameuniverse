import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

const coachActionSchema = z.object({
  action: z.unknown().optional(),
  reason: z.unknown().optional(),
});

/**
 * PATCH /api/admin/coaching/[id] — Admin actions: verify, suspend, unsuspend.
 * coach_profiles only lets owners update their row, so the admin check runs
 * first and the update uses the service-role client (issue #385).
 */
export const PATCH = defineRoute(
  { auth: "admin", body: coachActionSchema },
  async ({ params, body }) => {
    const supabase: S = getSupabaseAdmin();

    const { id } = params;
    const { action, reason } = body;

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
        throw validationError(undefined, "Invalid action");
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
    if (!updatedRows?.length) throw notFound("Coach not found");

    return NextResponse.json({ success: true, action });
  }
);
