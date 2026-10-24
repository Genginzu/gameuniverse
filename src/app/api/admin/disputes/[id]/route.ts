import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { defineRoute, notFound } from "@/lib/api/route";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

const disputeActionSchema = z.object({
  action: z.enum(["resolve", "dismiss", "investigate"]),
  adminNotes: z.unknown().optional(),
});

/**
 * PATCH /api/admin/disputes/[id] — Admin: resolve or dismiss a dispute.
 * coaching_disputes has no UPDATE policy, so the admin check runs first and the
 * update uses the service-role client (issue #385).
 */
export const PATCH = defineRoute(
  { auth: "admin", body: disputeActionSchema },
  async ({ user, params, body }) => {
    const supabase: S = getSupabaseAdmin();

    const { id } = params;
    const { action, adminNotes } = body;

    const statusMap: Record<string, string> = {
      resolve: "resolved",
      dismiss: "dismissed",
      investigate: "investigating",
    };
    const updates: Record<string, unknown> = { status: statusMap[action] };

    if (adminNotes) updates.admin_notes = adminNotes;
    if (action === "resolve" || action === "dismiss") {
      updates.resolved_by = user.id;
      updates.resolved_at = new Date().toISOString();
    }

    const { data: updatedRows, error } = await supabase
      .from("coaching_disputes")
      .update(updates)
      .eq("id", id)
      .select("id");
    if (error) {
      logger.error("Error updating dispute", { error });
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
    if (!updatedRows?.length) throw notFound("Dispute not found");

    return NextResponse.json({ success: true });
  }
);
