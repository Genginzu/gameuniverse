import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { PandaScoreListParams } from "@/lib/pandascore/types";
import { logger } from "@/lib/logger";

/**
 * Helpers shared by the cron and admin PandaScore sync routes.
 *
 * Performance notes:
 * - Bulk upserts (BULK_UPSERT_SIZE rows per request) instead of one-by-one.
 * - Preload reference IDs (teams, tournaments) into in-memory maps to avoid
 *   N round-trips to Supabase.
 * - Page caps to bound runtime; PandaScore returns thousands of entities.
 *
 * Error reporting:
 * - SyncErrorCollector captures per-item errors (fetch, upsert, delete) and
 *   caps them at MAX_ERROR_DETAILS to avoid bloating the log row. Admin UI
 *   reads `error_details` JSONB to show what failed and why.
 */

export const BULK_UPSERT_SIZE = 100;

/** Default cap for paginated PandaScore fetches (per_page=100 → 2 000 rows max). */
export const DEFAULT_MAX_PAGES = 20;

/** Stale `running` sync logs older than this are auto-marked failed at sync start. */
export const STALE_SYNC_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/** Maximum per-item error entries kept on a single sync log row. */
export const MAX_ERROR_DETAILS = 50;

/** Phase of the sync at which an error occurred. */
export type SyncErrorPhase = "fetch" | "upsert" | "delete";

/** Single error entry stored in pandascore_sync_logs.error_details (JSONB). */
export interface SyncErrorDetail {
  type: string;
  id: number | null;
  phase: SyncErrorPhase;
  error: string;
}

/**
 * Collects per-item sync errors with a hard cap. Once the cap is reached,
 * subsequent errors are dropped (counted in `dropped`) and only the first
 * MAX_ERROR_DETAILS are persisted. Always logs to `logger` for full visibility
 * in Vercel logs even when entries are dropped.
 */
export class SyncErrorCollector {
  private entries: SyncErrorDetail[] = [];
  private dropped = 0;

  add(detail: SyncErrorDetail): void {
    if (this.entries.length < MAX_ERROR_DETAILS) {
      this.entries.push(detail);
    } else {
      this.dropped++;
    }
    logger.warn("Sync error", { ...detail });
  }

  /** Returns the captured entries plus a synthetic summary entry if any were dropped. */
  toJSON(): SyncErrorDetail[] {
    if (this.dropped === 0) return this.entries;
    return [
      ...this.entries,
      {
        type: "summary",
        id: null,
        phase: "fetch",
        error: `${this.dropped} additional errors omitted (cap: ${MAX_ERROR_DETAILS})`,
      },
    ];
  }

  get count(): number {
    return this.entries.length + this.dropped;
  }
}

/**
 * Fetches all pages of a paginated PandaScore endpoint, stopping when:
 * - the API returns less than `per_page` (last page reached), or
 * - `maxPages` is reached (safety cap).
 *
 * Errors are caught and the partial result returned (sync continues).
 */
export async function fetchAllPages<T>(
  fetcher: (p: PandaScoreListParams) => Promise<T[]>,
  options: {
    game?: string;
    maxPages?: number;
    perPage?: number;
    extra?: Record<string, string | number>;
    onPage?: (info: { page: number; items: number; total: number }) => void;
    label?: string;
    errorCollector?: SyncErrorCollector;
    errorType?: string;
  } = {},
): Promise<T[]> {
  const {
    game,
    maxPages = DEFAULT_MAX_PAGES,
    perPage = 100,
    extra,
    onPage,
    label,
    errorCollector,
    errorType,
  } = options;
  const all: T[] = [];
  let page = 1;

  while (page <= maxPages) {
    const params: PandaScoreListParams = { page, per_page: perPage, ...extra };
    if (game) params["filter[videogame_title]"] = game;

    let batch: T[];
    try {
      batch = await fetcher(params);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn("fetchAllPages stopped early", { label, page, error: msg });
      errorCollector?.add({
        type: errorType ?? label ?? "unknown",
        id: null,
        phase: "fetch",
        error: `Page ${page}: ${msg}`,
      });
      break;
    }

    all.push(...batch);
    onPage?.({ page, items: batch.length, total: all.length });

    if (batch.length < perPage) break;
    page++;
  }

  if (page > maxPages) {
    logger.warn("fetchAllPages reached maxPages cap", { label, maxPages, total: all.length });
  }

  return all;
}

/**
 * Splits an array into chunks of `size` items.
 */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Bulk upsert into a Supabase table by chunks of `BULK_UPSERT_SIZE`.
 * Returns the number of rows successfully written and the number of errors.
 */
export async function bulkUpsert(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
  options: {
    onProgress?: (info: { synced: number; total: number; lastName?: string }) => void;
    nameField?: string;
    errorCollector?: SyncErrorCollector;
    errorType?: string;
  } = {},
): Promise<{ synced: number; errors: number }> {
  if (rows.length === 0) return { synced: 0, errors: 0 };

  const supabase = getSupabaseAdmin();
  let synced = 0;
  let errors = 0;

  for (const batch of chunk(rows, BULK_UPSERT_SIZE)) {
    const { error } = await supabase.from(table).upsert(batch, { onConflict });
    if (error) {
      logger.warn("bulkUpsert error", { table, batchSize: batch.length, error: error.message });
      errors += batch.length;
      // Capture one error entry per failed row so the admin UI can list ids.
      for (const row of batch) {
        options.errorCollector?.add({
          type: options.errorType ?? table,
          id: typeof row.pandascore_id === "number" ? row.pandascore_id : null,
          phase: "upsert",
          error: error.message,
        });
      }
    } else {
      synced += batch.length;
    }
    const last = batch[batch.length - 1];
    const lastName = options.nameField ? (last?.[options.nameField] as string | undefined) : undefined;
    options.onProgress?.({ synced, total: rows.length, lastName });
  }

  return { synced, errors };
}

/**
 * Loads pandascore_id → uuid maps for a given table, in one query.
 * Used to resolve foreign keys (team_id, tournament_id) without N RTTs.
 */
export async function preloadIdMap(
  table: string,
  pandaIds: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (pandaIds.length === 0) return map;

  const supabase = getSupabaseAdmin();
  const uniqueIds = Array.from(new Set(pandaIds));

  // Supabase .in() supports up to ~1000 values per query — chunk for safety.
  for (const batch of chunk(uniqueIds, 500)) {
    const { data, error } = await supabase
      .from(table)
      .select("id, pandascore_id")
      .in("pandascore_id", batch);

    if (error) {
      logger.warn("preloadIdMap error", { table, error: error.message });
      continue;
    }

    for (const row of (data ?? []) as { id: string; pandascore_id: number }[]) {
      map.set(row.pandascore_id, row.id);
    }
  }

  return map;
}

/**
 * Marks any `running` sync logs older than STALE_SYNC_THRESHOLD_MS as failed.
 * Called at the start of a new sync to clean up orphaned entries (e.g. from
 * killed serverless invocations).
 */
export async function cleanupStaleSyncLogs(): Promise<void> {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - STALE_SYNC_THRESHOLD_MS).toISOString();

  const { error } = await supabase
    .from("pandascore_sync_logs")
    .update({
      status: "failed",
      error_message: "Auto-marked as failed (stale running entry)",
      completed_at: new Date().toISOString(),
    })
    .eq("status", "running")
    .lt("started_at", cutoff);

  if (error) {
    logger.warn("cleanupStaleSyncLogs error", { error: error.message });
  }
}
