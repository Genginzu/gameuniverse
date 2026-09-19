import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { ReportServerService } from "@/lib/services/reportServerService";
import type { ReportStatus } from "@/types/report";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

const STATUSES: (ReportStatus | "all")[] = [
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
  "all",
];

/** GET /api/admin/reports — Admin: list reports, optionally filtered by status. */
export async function GET(request: NextRequest) {
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

    const statusParam = request.nextUrl.searchParams.get("status") || "pending";
    const status = (
      STATUSES.includes(statusParam as ReportStatus | "all") ? statusParam : "pending"
    ) as ReportStatus | "all";

    const reports = await ReportServerService.listReports(status);
    return NextResponse.json({ reports });
  } catch (error) {
    logger.error("Error in admin reports GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
