/**
 * Cursor and lifecycle helpers for pandascore_sync_jobs.
 *
 * The cursor is a JSONB column on the job row. Each sync entity has its
 * own page counter and `done` flag, so we can paginate to exhaustion on
 * each PandaScore endpoint independently. Entities that map to two
 * PandaScore endpoints (matches → past + running, tournaments → upcoming
 * + running) get split into two cursor keys to avoid the "short page on
 * one endpoint accidentally marks the whole logical entity done" trap
 * the previous design had.
 *
 * Shape:
 *   {
 *     teams:                 { page, done },
 *     tournaments_upcoming:  { page, done },
 *     tournaments_running:   { page, done },
 *     players:               { page, done },
 *     matches_past:          { page, done },
 *     matches_running:       { page, done }
 *   }
 *
 * Order in SYNC_ENTITIES is significant: dependents (players, matches)
 * must come after their FK targets (teams, tournaments) so the upserts
 * can resolve foreign keys without preloading the whole DB.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { logger } from "../../_shared/logger.ts";
import { untypedTable } from "../../_shared/untyped-table.ts";
import type { SyncErrorDetail } from "../../_shared/pandascore/helpers.ts";

export type SyncEntity =
  | "teams"
  | "tournaments_upcoming"
  | "tournaments_running"
  | "players"
  | "matches_past"
  | "matches_running";

export const SYNC_ENTITIES: SyncEntity[] = [
  "teams",
  "tournaments_upcoming",
  "tournaments_running",
  "players",
  "matches_past",
  "matches_running",
];

export interface EntityCursor {
  page: number;
  done: boolean;
}

export type Cursor = Record<SyncEntity, EntityCursor>;

export interface JobRow {
  id: string;
  kind: "full" | "entity";
  /** Legacy column from the previous schema. The new code keeps it for
   *  backwards compat with `kind='entity'` jobs but the cursor refonte
   *  works on full syncs only. */
  entity: string | null;
  game: string | null;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  cursor: Partial<Cursor>;
  total_synced: number;
  total_errors: number;
  error_details: SyncErrorDetail[];
}

const EMPTY_ENTITY_CURSOR: EntityCursor = { page: 1, done: false };

/**
 * Migrates a legacy cursor (with the old keys: `tournaments`, `matches`)
 * into the new shape. Old jobs with `tournaments.done = true` are mapped
 * to upcoming-only-done so the running tournaments can still be picked
 * up later. Same for matches → matches_past. Conservative: when in doubt,
 * we'd rather re-sync a few extra pages than skip data.
 */
function migrateLegacyCursor(partial: Record<string, unknown>): Partial<Cursor> {
  const out: Partial<Cursor> = {};

  // Keep every key that already matches the new shape.
  for (const key of SYNC_ENTITIES) {
    const v = partial[key];
    if (isEntityCursor(v)) out[key] = v;
  }

  // Legacy `tournaments` → tournaments_upcoming. Legacy `matches` →
  // matches_past. The "running" half stays at default {page:1, done:false}
  // so a legacy completed job re-runs the running endpoints, which is
  // cheap (1-2 pages each) and ensures freshness.
  if (!out.tournaments_upcoming && isEntityCursor(partial.tournaments)) {
    out.tournaments_upcoming = partial.tournaments;
  }
  if (!out.matches_past && isEntityCursor(partial.matches)) {
    out.matches_past = partial.matches;
  }

  return out;
}

function isEntityCursor(v: unknown): v is EntityCursor {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as EntityCursor).page === "number" &&
    typeof (v as EntityCursor).done === "boolean"
  );
}

export function ensureCursor(partial: Partial<Cursor> | Record<string, unknown>): Cursor {
  const migrated = migrateLegacyCursor(partial as Record<string, unknown>);
  const result = {} as Cursor;
  for (const e of SYNC_ENTITIES) {
    result[e] = migrated[e] ?? { ...EMPTY_ENTITY_CURSOR };
  }
  return result;
}

export function isCursorComplete(cursor: Cursor): boolean {
  return SYNC_ENTITIES.every((e) => cursor[e].done);
}

/**
 * Returns the next entity that still has work to do. Order in
 * SYNC_ENTITIES is preserved so we always finish all FK targets before
 * touching the dependents. No alternation — each entity is fully
 * exhausted before moving on.
 */
export function pickNextEntity(cursor: Cursor): SyncEntity | null {
  for (const e of SYNC_ENTITIES) {
    if (!cursor[e].done) return e;
  }
  return null;
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
  if (!data) return null;
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
    .update({ status: "completed", completed_at: new Date().toISOString() })
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
