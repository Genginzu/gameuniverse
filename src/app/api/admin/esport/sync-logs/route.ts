import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/esport/sync-logs?page=1&limit=20
 * Returns paginated sync logs.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
    const offset = (page - 1) * limit;

    const supabase = getSupabaseAdmin();
    const { data, count, error } = await supabase
      .from("pandascore_sync_logs")
      .select("*", { count: "exact" })
      .order("started_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      logs: data ?? [],
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error fetching sync logs", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
