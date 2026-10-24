import { NextResponse } from "next/server";
import { defineRoute, notFound } from "@/lib/api/route";
import { ReportUserServerService } from "@/lib/services/reportUserServerService";

/** DELETE /api/reports/[id] — Reporter: withdraw one of their own open reports. */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { id } = params;
  const result = await ReportUserServerService.cancel(id, user.id);

  if (result === "not_found") throw notFound("Report not found");
  if (result === "closed") {
    return NextResponse.json({ error: "Report already handled", code: "closed" }, { status: 409 });
  }
  if (result === "error") {
    return NextResponse.json({ error: "Failed to cancel report" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
