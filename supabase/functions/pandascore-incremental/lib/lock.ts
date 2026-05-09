/**
 * Applicative lock on pandascore_sync_state to prevent concurrent
 * incremental runs (5-min cron + manual admin button).
 *
 * The lock is a single row (id=1) with `incremental_running_since`. We
 * never touch the table directly through PostgREST anymore — Supabase
 * managed PostgREST sometimes refuses to refresh its column cache when
 * a column is added, causing 42703 errors for hours. Two SQL RPCs do
 * the work atomically server-side:
 *
 *   - pandascore_acquire_lock(stale_after) → SELECT FOR UPDATE then
 *     conditional UPDATE; returns acquired/since/held_since
 *   - pandascore_release_lock(advance_cursor_to) → clears the lock and
 *     optionally bumps last_incremental_at
 *
 * PostgREST exposes them as POST /rpc/<name> and only needs to know the
 * function names (cached in pg_proc, refreshed independently from the
 * column cache).
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { logger } from "../../_shared/logger.ts";

/** Stale lock auto-release threshold. Larger than the 400s wall clock
 *  budget so we don't race a still-running invocation. 6 minutes lets
 *  a crashed run be detected on the next 5-minute cron tick. */
const STALE_AFTER = "6 minutes";

export interface AcquireLockResult {
  acquired: boolean;
  /** `last_incremental_at` at the moment the lock was acquired, used as
   *  the PandaScore `since` cursor. Null on first run. */
  since: string | null;
  /** When the existing lock was first acquired, if not acquired. */
  heldSince: string | null;
  /** Error message when the RPC call failed (network / auth / SQL). */
  error?: string;
}

interface AcquireLockRow {
  acquired: boolean;
  since: string | null;
  held_since: string | null;
}

export async function acquireLock(
  supabase: SupabaseClient,
): Promise<AcquireLockResult> {
  const { data, error } = await supabase.rpc("pandascore_acquire_lock", {
    stale_after: STALE_AFTER,
  });

  if (error) {
    logger.error("acquireLock error", { error });
    return { acquired: false, since: null, heldSince: null, error: error.message };
  }

  // Postgres TABLE-returning functions yield an array of rows over
  // PostgREST. We expect exactly one row.
  const row = Array.isArray(data) ? (data[0] as AcquireLockRow | undefined) : undefined;
  if (!row) {
    logger.warn("acquireLock returned no rows", { data });
    return { acquired: false, since: null, heldSince: null, error: "no rows" };
  }

  return {
    acquired: row.acquired,
    since: row.since ?? null,
    heldSince: row.held_since ?? null,
  };
}

/**
 * Releases the lock and stamps the new `last_incremental_at` cursor on
 * success. On failure, pass `advanceCursorTo: null` so the next run
 * retries the same delta.
 */
export async function releaseLock(
  supabase: SupabaseClient,
  options: { advanceCursorTo: string | null },
): Promise<void> {
  const { error } = await supabase.rpc("pandascore_release_lock", {
    advance_cursor_to: options.advanceCursorTo,
  });

  if (error) {
    logger.error("releaseLock error", { error });
  }
}
