import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getCurrentUser } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";
import { ReportServerService } from "@/lib/services/reportServerService";
import { isValidSuspensionDays } from "@/lib/utils/suspension";
import {
  SUSPENSION_DAYS,
  type ReportAction,
  type ReportDecision,
  type ReportStatus,
} from "@/types/report";

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
    await requireAdmin();
    const admin = await getCurrentUser();

    const { id } = await params;
    const { decision, actionTaken, suspensionDays } = await request.json();

    if (!["review", "resolve", "dismiss"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }
    const action: ReportAction =
      actionTaken && ACTIONS.includes(actionTaken) ? actionTaken : "none";

    const days = suspensionDays ?? SUSPENSION_DAYS.DEFAULT;
    if (decision === "resolve" && action === "author_suspended" && !isValidSuspensionDays(days)) {
      return NextResponse.json(
        {
          error: `suspensionDays must be an integer between ${SUSPENSION_DAYS.MIN} and ${SUSPENSION_DAYS.MAX}`,
          code: "invalid_days",
        },
        { status: 400 }
      );
    }

    const status = DECISION_STATUS[decision as ReportDecision];
    const result = await ReportServerService.updateReport(id, status, action, admin.id, {
      suspensionDays: days,
    });
    if (result === "not_found") {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    if (result === "closed") {
      return NextResponse.json(
        { error: "Report already handled", code: "closed" },
        { status: 409 }
      );
    }
    if (result === "error") {
      return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in admin report PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
