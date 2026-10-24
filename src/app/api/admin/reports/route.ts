import { NextResponse } from "next/server";
import { defineRoute } from "@/lib/api/route";
import { ReportServerService } from "@/lib/services/reportServerService";
import type { ReportStatus } from "@/types/report";

const STATUSES: (ReportStatus | "all")[] = ["pending", "reviewed", "resolved", "dismissed", "all"];

/** GET /api/admin/reports — Admin: list reports, optionally filtered by status. */
export const GET = defineRoute({ auth: "admin" }, async ({ request }) => {
  const statusParam = request.nextUrl.searchParams.get("status") || "pending";
  const status = (
    STATUSES.includes(statusParam as ReportStatus | "all") ? statusParam : "pending"
  ) as ReportStatus | "all";

  const reports = await ReportServerService.listReports(status);
  return NextResponse.json({ reports });
});
