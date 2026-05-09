import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/esport/sync-history?page=1&limit=20
 *
 * Unified history of every PandaScore sync run, regardless of whether
 * it was an incremental run (cron 5min or admin manual button, stored
 * in `pandascore_sync_logs`) or a full sync job (admin "Sync complète",
 * stored in `pandascore_sync_jobs`).
 *
 * Both tables are queried, normalised into a single shape and merged
 * by start date, then paginated. The legacy /api/admin/esport/sync-logs
 * endpoint is kept around for any caller that still depends on it but
 * the admin UI now uses this one exclusively.
 *
 * The unified shape carries a `kind` discriminator the UI uses to pick
 * the right rendering (incremental shows per-entity counts, full shows
 * cumulative totals + cursor progress).
 */

export interface SyncHistoryError {
  type: string;
  id: number | null;
  phase: string;
  error: string;
}

export interface SyncHistoryEntry {
  /** Stable union ID prefixed with kind so React keys never collide. */
  id: string;
  kind: "incremental" | "full";
  /** "cron" | "manual" for incremental, "manual" for full (always
   *  user-triggered today). */
  trigger: string;
  status: string;
  /** Sum of all entity-level synced counts. */
  total_synced: number;
  total_errors: number;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  error_details: SyncHistoryError[];
  /** Per-entity breakdown — populated for incremental runs (sync_logs).
   *  Empty for full syncs which don't track per-entity in the same way. */
  per_entity?: {
    teams_synced: number;
    teams_errors: number;
    players_synced: number;
    players_errors: number;
    tournaments_synced: number;
    tournaments_errors: number;
    matches_synced: number;
    matches_errors: number;
  } | null;
  /** Sync entity (only meaningful for full sync jobs of kind="entity"). */
  entity?: string | null;
}

interface SyncLogRow {
  id: string;
  trigger: string;
  status: string;
  teams_synced: number;
  teams_errors: number;
  players_synced: number;
  players_errors: number;
  tournaments_synced: number;
  tournaments_errors: number;
  matches_synced: number;
  matches_errors: number;
  error_message: string | null;
  error_details: SyncHistoryError[] | null;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
}

interface SyncJobRow {
  id: string;
  kind: string;
  entity: string | null;
  status: string;
  total_synced: number;
  total_errors: number;
  error_message: string | null;
  error_details: SyncHistoryError[] | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

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
        .select(
          "id, trigger, status, teams_synced, teams_errors, players_synced, players_errors, tournaments_synced, tournaments_errors, matches_synced, matches_errors, error_message, error_details, duration_ms, started_at, completed_at",
        )
        .order("started_at", { ascending: false })
        .limit(MAX_FETCH),
      supabase
        .from("pandascore_sync_jobs")
        .select(
          "id, kind, entity, status, total_synced, total_errors, error_message, error_details, started_at, completed_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(MAX_FETCH),
    ]);

    if (logsResp.error) throw logsResp.error;
    if (jobsResp.error) throw jobsResp.error;

    const logEntries: SyncHistoryEntry[] = (logsResp.data ?? []).map((row) =>
      mapLog(row as SyncLogRow),
    );
    const jobEntries: SyncHistoryEntry[] = (jobsResp.data ?? []).map((row) =>
      mapJob(row as SyncJobRow),
    );

    const merged = [...logEntries, ...jobEntries].sort((a, b) =>
      a.started_at < b.started_at ? 1 : a.started_at > b.started_at ? -1 : 0,
    );

    const total = merged.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paged = merged.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      entries: paged,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error fetching sync history", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function mapLog(row: SyncLogRow): SyncHistoryEntry {
  return {
    id: `log_${row.id}`,
    kind: "incremental",
    trigger: row.trigger,
    status: row.status,
    total_synced:
      row.teams_synced +
      row.players_synced +
      row.tournaments_synced +
      row.matches_synced,
    total_errors:
      row.teams_errors +
      row.players_errors +
      row.tournaments_errors +
      row.matches_errors,
    duration_ms: row.duration_ms,
    started_at: row.started_at,
    completed_at: row.completed_at,
    error_message: row.error_message,
    error_details: row.error_details ?? [],
    per_entity: {
      teams_synced: row.teams_synced,
      teams_errors: row.teams_errors,
      players_synced: row.players_synced,
      players_errors: row.players_errors,
      tournaments_synced: row.tournaments_synced,
      tournaments_errors: row.tournaments_errors,
      matches_synced: row.matches_synced,
      matches_errors: row.matches_errors,
    },
    entity: null,
  };
}

function mapJob(row: SyncJobRow): SyncHistoryEntry {
  // started_at can be null on a job that hasn't started yet (just inserted
  // and not yet claimed). Fall back to created_at for ordering.
  const startedAt = row.started_at ?? row.created_at;

  let durationMs: number | null = null;
  if (row.completed_at && row.started_at) {
    durationMs =
      new Date(row.completed_at).getTime() -
      new Date(row.started_at).getTime();
  }

  return {
    id: `job_${row.id}`,
    kind: "full",
    trigger: "manual",
    status: row.status,
    total_synced: row.total_synced,
    total_errors: row.total_errors,
    duration_ms: durationMs,
    started_at: startedAt,
    completed_at: row.completed_at,
    error_message: row.error_message,
    error_details: row.error_details ?? [],
    per_entity: null,
    entity: row.entity,
  };
}
