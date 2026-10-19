import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { adminAuthErrorStatus, requireAdminUser } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/disputes/[id] — Admin: resolve or dismiss a dispute.
 * coaching_disputes has no UPDATE policy, so the admin check runs first and the
 * update uses the service-role client (issue #385).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAdminUser();
    const supabase: S = getSupabaseAdmin();

    const { id } = await params;
    const { action, adminNotes } = await request.json();

    if (!["resolve", "dismiss", "investigate"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

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
    if (!updatedRows?.length) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const authStatus = adminAuthErrorStatus(error);
    if (authStatus) {
      return NextResponse.json({ error: (error as Error).message }, { status: authStatus });
    }
    logger.error("Error in dispute PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
