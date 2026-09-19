import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { ReportServerService } from "@/lib/services/reportServerService";
import type { ReportAction, ReportDecision, ReportStatus } from "@/types/report";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

type RouteParams = { params: Promise<{ id: string }> };

const DECISION_STATUS: Record<ReportDecision, ReportStatus> = {
  review: "reviewed",
  resolve: "resolved",
  dismiss: "dismissed",
};

const ACTIONS: ReportAction[] = ["none", "content_deleted", "author_warned", "author_suspended"];

/** PATCH /api/admin/reports/[id] — Admin: resolve, review or dismiss a report. */
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
    const { decision, actionTaken } = await request.json();

    if (!["review", "resolve", "dismiss"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }
    const action: ReportAction =
      actionTaken && ACTIONS.includes(actionTaken) ? actionTaken : "none";

    const status = DECISION_STATUS[decision as ReportDecision];
    const ok = await ReportServerService.updateReport(id, status, action, user.id);
    if (!ok) {
      return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in admin report PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
