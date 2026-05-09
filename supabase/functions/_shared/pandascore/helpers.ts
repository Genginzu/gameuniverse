/**
 * Shared helpers for PandaScore Edge Functions — Deno port of
 * src/lib/services/pandascore-sync-helpers.ts.
 *
 * Differences vs the Vercel version:
 *   - Uses Deno-style imports
 *   - Drops `cleanupStaleSyncLogs` (replaced by the lock on
 *     pandascore_sync_state for the incremental flow, and by
 *     last_chunk_at staleness checks for the full-sync flow)
 *   - The `SyncErrorCollector` is identical (no DB or runtime deps)
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { logger } from "../logger.ts";
import { untypedTable } from "../untyped-table.ts";
import type { PandaScoreListParams } from "./types.ts";

export const BULK_UPSERT_SIZE = 100;

/** Maximum per-item error entries kept on a single sync log/job row. */
export const MAX_ERROR_DETAILS = 50;

export type SyncErrorPhase = "fetch" | "upsert" | "delete";

export interface SyncErrorDetail {
  type: string;
  id: number | null;
  phase: SyncErrorPhase;
  error: string;
}

/**
 * Captures per-item sync errors with a hard cap. Logs each entry via
 * `logger.warn` for full visibility even when the cap is reached.
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

/** Splits an array into chunks of `size` items. */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Result of a single page fetch. `failed=true` lets the caller distinguish
 * a legitimate short page (< perPage items, end of dataset) from a fetch
 * error (which also returns 0 items but should NOT mark the entity as done).
 */
export interface PageFetchResult<T> {
  items: T[];
  failed: boolean;
}

/**
 * Fetches a single page from a paginated PandaScore endpoint. Used by the
 * full-sync flow which paginates one page at a time across multiple Edge
 * Function invocations (chunked, self-rescheduling).
 */
export async function fetchOnePage<T>(
  fetcher: (p: PandaScoreListParams) => Promise<T[]>,
  options: {
    page: number;
    perPage?: number;
    game?: string;
    extra?: Record<string, string | number>;
    label?: string;
    errorCollector?: SyncErrorCollector;
    errorType?: string;
  },
): Promise<PageFetchResult<T>> {
  const {
    page,
    perPage = 100,
    game,
    extra,
    label,
    errorCollector,
    errorType,
  } = options;

  const params: PandaScoreListParams = { page, per_page: perPage, ...extra };
  if (game) params["filter[videogame_title]"] = game;

  try {
    const items = await fetcher(params);
    return { items, failed: false };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn("fetchOnePage failed", { label, page, error: msg });
    errorCollector?.add({
      type: errorType ?? label ?? "unknown",
      id: null,
      phase: "fetch",
      error: `Page ${page}: ${msg}`,
    });
    return { items: [], failed: true };
  }
}

/**
 * Fetches all pages of a paginated PandaScore endpoint. Used by the
 * incremental flow which fetches the entire delta (typically a few dozen
 * incidents at most) in a single Edge Function invocation.
 */
export async function fetchAllPages<T>(
  fetcher: (p: PandaScoreListParams) => Promise<T[]>,
  options: {
    maxPages: number;
    perPage?: number;
    extra?: Record<string, string | number>;
    label?: string;
    errorCollector?: SyncErrorCollector;
    errorType?: string;
  },
): Promise<T[]> {
  const { maxPages, perPage = 100, extra, label, errorCollector, errorType } =
    options;
  const all: T[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const result = await fetchOnePage(fetcher, {
      page,
      perPage,
      extra,
      label,
      errorCollector,
      errorType,
    });
    all.push(...result.items);
    // For the incremental flow, treat a fetch error like end-of-data: stop
    // paginating but return what we have. The caller decides what to do
    // with the partial result via the errorCollector counts.
    if (result.failed || result.items.length < perPage) return all;
  }

  logger.warn("fetchAllPages reached max pages", { label, maxPages, total: all.length });
  return all;
}

/**
 * Bulk-upserts rows into a Supabase table by chunks of `BULK_UPSERT_SIZE`.
 * Returns the number of rows successfully written and the number of errors.
 */
export async function bulkUpsert(
  supabase: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
  options: {
    errorCollector?: SyncErrorCollector;
    errorType?: string;
  } = {},
): Promise<{ synced: number; errors: number }> {
  if (rows.length === 0) return { synced: 0, errors: 0 };

  let synced = 0;
  let errors = 0;

  for (const batch of chunk(rows, BULK_UPSERT_SIZE)) {
    const { error } = await untypedTable(supabase, table).upsert(batch, {
      onConflict,
    });
    if (error) {
      logger.warn("bulkUpsert error", {
        table,
        batchSize: batch.length,
        error: error.message,
      });
      errors += batch.length;
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
  }

  return { synced, errors };
}

/**
 * Loads pandascore_id → uuid maps for a given table, in one query (chunked
 * by 500 to stay under PostgREST .in() limits).
 */
export async function preloadIdMap(
  supabase: SupabaseClient,
  table: string,
  pandaIds: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (pandaIds.length === 0) return map;

  const uniqueIds = Array.from(new Set(pandaIds));

  for (const batch of chunk(uniqueIds, 500)) {
    const { data, error } = await untypedTable(supabase, table)
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
 * Concurrently fetches a list of PandaScore objects by id with bounded
 * concurrency. Failed fetches are logged and the partial result returned.
 */
export async function fetchInBatches<T>(
  ids: number[],
  fetcher: (id: number) => Promise<T>,
  type: string,
  errors: SyncErrorCollector,
  concurrency = 8,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map((id) => fetcher(id)));
    for (let j = 0; j < settled.length; j++) {
      const r = settled[j];
      const id = batch[j];
      if (r.status === "fulfilled") {
        results.push(r.value);
      } else {
        const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
        errors.add({ type, id, phase: "fetch", error: msg });
      }
    }
  }
  return results;
}
