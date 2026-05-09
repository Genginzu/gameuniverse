/**
 * Cursor and lifecycle helpers for pandascore_sync_jobs.
 *
 * The cursor is a JSONB column on the job row, shaped like:
 *   {
 *     teams:       { page: <int>, done: <bool> },
 *     tournaments: { page: <int>, done: <bool> },
 *     players:     { page: <int>, done: <bool> },
 *     matches:     { page: <int>, done: <bool> }
 *   }
 *
 * On a fresh job, the cursor is empty `{}` and is initialised on first
 * processing. When all entities have `done: true`, the job is marked
 * `completed`.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { logger } from "../../_shared/logger.ts";
import { untypedTable } from "../../_shared/untyped-table.ts";
import type { SyncErrorDetail } from "../../_shared/pandascore/helpers.ts";

export type SyncEntity = "teams" | "tournaments" | "players" | "matches";

export const SYNC_ENTITIES: SyncEntity[] = [
  "teams",
  "tournaments",
  "players",
  "matches",
];

export interface EntityCursor {
  page: number;
  done: boolean;
}

export type Cursor = Record<SyncEntity, EntityCursor>;

export interface JobRow {
  id: string;
  kind: "full" | "entity";
  entity: SyncEntity | null;
  game: string | null;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  cursor: Partial<Cursor>;
  total_synced: number;
  total_errors: number;
  error_details: SyncErrorDetail[];
}

const EMPTY_ENTITY_CURSOR: EntityCursor = { page: 1, done: false };

export function ensureCursor(partial: Partial<Cursor>): Cursor {
  return {
    teams: partial.teams ?? { ...EMPTY_ENTITY_CURSOR },
    tournaments: partial.tournaments ?? { ...EMPTY_ENTITY_CURSOR },
    players: partial.players ?? { ...EMPTY_ENTITY_CURSOR },
    matches: partial.matches ?? { ...EMPTY_ENTITY_CURSOR },
  };
}

export function isCursorComplete(cursor: Cursor): boolean {
  return SYNC_ENTITIES.every((e) => cursor[e].done);
}

/**
 * Loads the job and atomically transitions it to `running`. Returns null
 * if the job is not in a processable state, so concurrent invocations
 * (e.g. an admin manual trigger overlapping with a self-reschedule)
 * don't process the same chunk twice.
 */
export async function claimJob(
  supabase: SupabaseClient,
  jobId: string,
): Promise<JobRow | null> {
  const nowIso = new Date().toISOString();

  // Atomic transition: set status='running' only if currently 'pending'.
  // Returns the row before the update so we can read the cursor.
  const { data, error } = await untypedTable(supabase, "pandascore_sync_jobs")
    .update({ status: "running", started_at: nowIso, last_chunk_at: nowIso })
    .eq("id", jobId)
    .eq("status", "pending")
    .select("id, kind, entity, game, status, cursor, total_synced, total_errors, error_details")
    .maybeSingle();

  if (error) {
    logger.warn("claimJob: update error", { jobId, error });
    return null;
  }
  if (!data) {
    // Either job not found, or already running/completed/etc.
    return null;
  }
  return data as unknown as JobRow;
}

export interface UpdateJobProgressInput {
  jobId: string;
  cursor: Cursor;
  totalSyncedDelta: number;
  totalErrorsDelta: number;
  errorDetails: SyncErrorDetail[];
}

export async function persistJobProgress(
  supabase: SupabaseClient,
  input: UpdateJobProgressInput,
): Promise<void> {
  const { jobId, cursor, totalSyncedDelta, totalErrorsDelta, errorDetails } =
    input;

  // Fetch current totals so we can increment without a race.
  const { data: current } = await untypedTable(supabase, "pandascore_sync_jobs")
    .select("total_synced, total_errors")
    .eq("id", jobId)
    .single();

  const totalSynced = (current?.total_synced as number ?? 0) + totalSyncedDelta;
  const totalErrors = (current?.total_errors as number ?? 0) + totalErrorsDelta;

  await untypedTable(supabase, "pandascore_sync_jobs")
    .update({
      cursor,
      total_synced: totalSynced,
      total_errors: totalErrors,
      error_details: errorDetails,
      last_chunk_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

export async function markJobPending(
  supabase: SupabaseClient,
  jobId: string,
): Promise<void> {
  await untypedTable(supabase, "pandascore_sync_jobs")
    .update({ status: "pending" })
    .eq("id", jobId);
}

export async function markJobCompleted(
  supabase: SupabaseClient,
  jobId: string,
): Promise<void> {
  await untypedTable(supabase, "pandascore_sync_jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

export async function markJobFailed(
  supabase: SupabaseClient,
  jobId: string,
  errorMessage: string,
): Promise<void> {
  await untypedTable(supabase, "pandascore_sync_jobs")
    .update({
      status: "failed",
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}
