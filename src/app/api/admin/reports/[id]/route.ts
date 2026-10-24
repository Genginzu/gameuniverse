import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { ReportServerService } from "@/lib/services/reportServerService";
import { isValidSuspensionDays } from "@/lib/utils/suspension";
import {
  SUSPENSION_DAYS,
  type ReportAction,
  type ReportDecision,
  type ReportStatus,
} from "@/types/report";

const DECISION_STATUS: Record<ReportDecision, ReportStatus> = {
  review: "reviewed",
  resolve: "resolved",
  dismiss: "dismissed",
};

const ACTIONS: ReportAction[] = ["none", "content_deleted", "author_warned", "author_suspended"];

// Field values are checked below so the dedicated 400 messages and codes stay unchanged.
const patchReportSchema = z.object({
  decision: z.any().optional(),
  actionTaken: z.any().optional(),
  suspensionDays: z.any().optional(),
});

/** PATCH /api/admin/reports/[id] — Admin: resolve, review or dismiss a report. */
export const PATCH = defineRoute(
  { auth: "admin", body: patchReportSchema },
  async ({ params, body, user }) => {
    const { id } = params;
    const { decision, actionTaken, suspensionDays } = body;

    if (!["review", "resolve", "dismiss"].includes(decision)) {
      throw validationError(undefined, "Invalid decision");
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
    const result = await ReportServerService.updateReport(id, status, action, user.id, {
      suspensionDays: days,
    });
    if (result === "not_found") throw notFound("Report not found");
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
  }
);
