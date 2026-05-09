/**
 * Applicative lock on pandascore_sync_state to prevent concurrent
 * incremental runs (5-min cron + manual admin button).
 *
 * Strategy: a single row (id=1) has a `incremental_running_since` column.
 * `acquireLock()` does a conditional UPDATE that succeeds only when no
 * lock is held *or* the existing lock is older than LOCK_TTL_MS (auto
 * release after a crashed run). The conditional UPDATE returns the
 * previous `last_incremental_at` so the caller can use it as the `since`
 * cursor for PandaScore Incidents API.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { logger } from "../../_shared/logger.ts";
import { untypedTable } from "../../_shared/untyped-table.ts";

/** Stale lock auto-release threshold. Must be larger than the 400s wall
 *  clock limit to avoid racing a still-running invocation. 6 minutes is
 *  comfortable: cron runs every 5 minutes, so a stuck run is detected
 *  on the next tick. */
const LOCK_TTL_MS = 6 * 60 * 1000;

export interface AcquireLockResult {
  acquired: boolean;
  /** `last_incremental_at` at the moment the lock was acquired, used as
   *  the PandaScore `since` cursor. Null on first run. */
  since: string | null;
  /** When the existing lock was first acquired, if not acquired. */
  heldSince: string | null;
}

export async function acquireLock(
  supabase: SupabaseClient,
): Promise<AcquireLockResult> {
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - LOCK_TTL_MS).toISOString();

  // Conditional update: take the lock if free OR stale.
  const { data, error } = await untypedTable(supabase, "pandascore_sync_state")
    .update({
      incremental_running_since: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", 1)
    .or(`incremental_running_since.is.null,incremental_running_since.lt.${staleCutoff}`)
    .select("last_incremental_at")
    .maybeSingle();

  if (error) {
    logger.error("acquireLock error", { error });
    return { acquired: false, since: null, heldSince: null };
  }

  if (!data) {
    // Lock is held by someone else and not stale: read the holder timestamp.
    const { data: state } = await untypedTable(supabase, "pandascore_sync_state")
      .select("incremental_running_since")
      .eq("id", 1)
      .single();
    return {
      acquired: false,
      since: null,
      heldSince: (state?.incremental_running_since as string | null) ?? null,
    };
  }

  return {
    acquired: true,
    since: (data.last_incremental_at as string | null) ?? null,
    heldSince: null,
  };
}

/**
 * Releases the lock and stamps the new `last_incremental_at` cursor on
 * success. On failure, releases the lock but does NOT advance the cursor
 * so the next run retries the same delta.
 */
export async function releaseLock(
  supabase: SupabaseClient,
  options: { advanceCursorTo: string | null },
): Promise<void> {
  const update: Record<string, unknown> = {
    incremental_running_since: null,
    updated_at: new Date().toISOString(),
  };
  if (options.advanceCursorTo) {
    update.last_incremental_at = options.advanceCursorTo;
  }

  const { error } = await untypedTable(supabase, "pandascore_sync_state")
    .update(update)
    .eq("id", 1);

  if (error) {
    logger.error("releaseLock error", { error });
  }
}
