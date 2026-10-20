import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import {
  mergeSyncHistory,
  SYNC_JOB_HISTORY_COLUMNS,
  SYNC_LOG_HISTORY_COLUMNS,
  type SyncJobRow,
  type SyncLogRow,
  type SyncRunRecord,
} from "@/lib/pandascore/sync-history";

/**
 * GET /api/admin/esport/sync-history?page=1&limit=20
 *
 * Unified history of every PandaScore sync run, regardless of whether
 * it was an incremental run (cron 5min or admin manual button, stored
 * in `pandascore_sync_logs`) or a full sync job (admin "Sync complète",
 * stored in `pandascore_sync_jobs`).
 *
 * Both tables are queried, normalised into a single shape by
 * src/lib/pandascore/sync-history.ts and merged by start date, then
 * paginated. The admin UI uses this endpoint exclusively.
 */

const MAX_FETCH = 200;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));

    const supabase = getSupabaseAdmin();

    // Fetch the most recent rows from each table separately, merge, then
    // paginate in memory. This is safe because each table stays small
    // (sync_logs grows ~288/day for a 5-min cron; sync_jobs is rarely
    // touched). We cap each fetch at MAX_FETCH so a runaway log table
    // never breaks this endpoint.
    const [logsResp, jobsResp] = await Promise.all([
      supabase
        .from("pandascore_sync_logs")
        .select(SYNC_LOG_HISTORY_COLUMNS)
        .order("started_at", { ascending: false })
        .limit(MAX_FETCH),
      supabase
        .from("pandascore_sync_jobs")
        .select(SYNC_JOB_HISTORY_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(MAX_FETCH),
    ]);

    if (logsResp.error) throw logsResp.error;
    if (jobsResp.error) throw jobsResp.error;

    const records: SyncRunRecord[] = [
      ...(logsResp.data ?? []).map((row) => ({ source: "log" as const, row: row as unknown as SyncLogRow })),
      ...(jobsResp.data ?? []).map((row) => ({ source: "job" as const, row: row as unknown as SyncJobRow })),
    ];

    return NextResponse.json(mergeSyncHistory(records, page, limit));
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error fetching sync history", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
