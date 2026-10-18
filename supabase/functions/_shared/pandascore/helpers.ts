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

import { logger } from "../logger.ts";
import type { PandaScoreListParams } from "./types.ts";

export {
  MAX_ERROR_DETAILS,
  SyncErrorCollector,
  type SyncErrorDetail,
  type SyncErrorPhase,
} from "./sync-error-collector.ts";
import type { SyncErrorCollector } from "./sync-error-collector.ts";

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
