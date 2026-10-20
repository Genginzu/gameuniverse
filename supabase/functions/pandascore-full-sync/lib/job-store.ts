/**
 * Persistence adapter for pandascore_sync_jobs (full-sync run kind).
 *
 * Cursor shape, entity scoping and status transitions live in the
 * runtime-agnostic sync-run module; this file only maps them onto the
 * job row. Progress counters are incremented server-side by the
 * increment_pandascore_job_progress RPC so overlapping invocations
 * never lose counts.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { logger } from "../../_shared/logger.ts";
import { untypedTable } from "../../_shared/untyped-table.ts";
import type { SyncErrorCollector } from "../../_shared/pandascore/helpers.ts";
import {
  completedPatch,
  failedPatch,
  pendingPatch,
  runningPatch,
  type Cursor,
  type SyncRunStatus,
} from "../../_shared/pandascore/sync-run/index.ts";

export interface JobRow {
  id: string;
  kind: "full" | "entity";
  entity: string | null;
  game: string | null;
  status: SyncRunStatus;
  cursor: unknown;
  total_synced: number;
  total_errors: number;
  error_details: unknown;
}

export async function claimJob(
  supabase: SupabaseClient,
  jobId: string,
): Promise<JobRow | null> {
  const { data, error } = await untypedTable(supabase, "pandascore_sync_jobs")
    .update(runningPatch(new Date()))
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

export interface JobProgressInput {
  jobId: string;
  cursor: Cursor;
  syncedDelta: number;
  errorsDelta: number;
  errors: SyncErrorCollector;
}

export async function persistJobProgress(
  supabase: SupabaseClient,
  input: JobProgressInput,
): Promise<void> {
  const { error } = await supabase.rpc("increment_pandascore_job_progress", {
    p_job_id: input.jobId,
    p_synced_delta: input.syncedDelta,
    p_errors_delta: input.errorsDelta,
    p_cursor: input.cursor,
    p_error_details: input.errors.toJSON(),
  });
  if (error) {
    logger.error("persistJobProgress: rpc error", { jobId: input.jobId, error });
    throw new Error(`Failed to persist job progress: ${error.message}`);
  }
}

async function updateJob(
  supabase: SupabaseClient,
  jobId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await untypedTable(supabase, "pandascore_sync_jobs").update(patch).eq("id", jobId);
}

export function markJobPending(supabase: SupabaseClient, jobId: string): Promise<void> {
  return updateJob(supabase, jobId, pendingPatch());
}

export function markJobCompleted(supabase: SupabaseClient, jobId: string): Promise<void> {
  return updateJob(supabase, jobId, completedPatch(new Date()));
}

export function markJobFailed(
  supabase: SupabaseClient,
  jobId: string,
  errorMessage: string,
): Promise<void> {
  return updateJob(supabase, jobId, failedPatch(errorMessage, new Date()));
}
