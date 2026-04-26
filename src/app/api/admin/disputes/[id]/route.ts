import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

type RouteParams = { params: Promise<{ id: string }> };

/** PATCH /api/admin/disputes/[id] — Admin: resolve or dismiss a dispute */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase: S = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

    const { error } = await supabase.from("coaching_disputes").update(updates).eq("id", id);
    if (error) {
      logger.error("Error updating dispute", { error });
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in dispute PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
