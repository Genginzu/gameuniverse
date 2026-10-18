import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";
import { ReportServerService } from "@/lib/services/reportServerService";
import type { ReportStatus } from "@/types/report";

const STATUSES: (ReportStatus | "all")[] = ["pending", "reviewed", "resolved", "dismissed", "all"];

/** GET /api/admin/reports — Admin: list reports, optionally filtered by status. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const statusParam = request.nextUrl.searchParams.get("status") || "pending";
    const status = (
      STATUSES.includes(statusParam as ReportStatus | "all") ? statusParam : "pending"
    ) as ReportStatus | "all";

    const reports = await ReportServerService.listReports(status);
    return NextResponse.json({ reports });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in admin reports GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
