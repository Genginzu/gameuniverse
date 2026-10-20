import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import type {
  LibrarySyncJob,
  LibrarySyncPhase,
  LibrarySyncProgress,
} from "@/types/library-sync";

/**
 * Persistence helpers for background library-sync jobs.
 *
 * All writes use the service-role (admin) client — an untyped
 * `SupabaseClient` — so `.from(TABLE)` needs no generated Database type.
 * Every query is explicitly scoped to a `user_id` to stay safe despite the
 * RLS bypass.
 */

const TABLE = "player_library_sync_jobs";

/** Postgres unique-violation error code (active-job partial index). */
const UNIQUE_VIOLATION = "23505";

interface JobRow {
  id: string;
  platform: string;
  status: LibrarySyncJob["status"];
  phase: LibrarySyncPhase;
  total: number;
  processed: number;
  matched: number;
  imported: number;
  unmatched: number;
  private_profile: boolean;
  current_item: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
  created_at: string;
}

const SELECT_COLS =
  "id, platform, status, phase, total, processed, matched, imported, unmatched, private_profile, current_item, error_message, started_at, completed_at, updated_at, created_at";

function mapRow(row: JobRow): LibrarySyncJob {
  return {
    id: row.id,
    platform: row.platform,
    status: row.status,
    phase: row.phase,
    total: row.total ?? 0,
    processed: row.processed ?? 0,
    matched: row.matched ?? 0,
    imported: row.imported ?? 0,
    unmatched: row.unmatched ?? 0,
    privateProfile: row.private_profile ?? false,
    currentItem: row.current_item ?? null,
    errorMessage: row.error_message ?? null,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

export interface CreateJobResult {
  job: LibrarySyncJob;
  /** True when an active job already existed (returned instead of a new one). */
  alreadyRunning: boolean;
}

/**
 * A pending/running job whose runner hasn't updated progress within this window
 * is considered dead (interrupted invocation) and can be reclaimed so a new run
 * isn't permanently blocked by the active-job unique index.
 */
const STALE_JOB_MS = 90_000;

function isStale(job: LibrarySyncJob): boolean {
  const updated = new Date(job.updatedAt).getTime();
  if (Number.isNaN(updated)) return true;
  return Date.now() - updated > STALE_JOB_MS;
}

async function insertJob(
  admin: SupabaseClient,
  userId: string,
  platform: string
): Promise<LibrarySyncJob | null> {
  const insert = await admin
    .from(TABLE)
    .insert({ user_id: userId, platform, status: "pending", phase: "starting" })
    .select(SELECT_COLS)
    .single();
  if (insert.error) {
    if (insert.error.code === UNIQUE_VIOLATION) return null;
    throw insert.error;
  }
  return mapRow(insert.data as JobRow);
}

/**
 * Create a pending job for (user, platform). If an active job already exists it
 * is returned with `alreadyRunning: true` — unless it is stale (its runner
 * died), in which case it is failed and replaced so the sync can be relaunched.
 */
export async function createSyncJob(
  admin: SupabaseClient,
  userId: string,
  platform: string
): Promise<CreateJobResult> {
  const created = await insertJob(admin, userId, platform);
  if (created) return { job: created, alreadyRunning: false };

  // Active-job conflict: inspect the existing job.
  const existing = await getActiveJob(admin, userId, platform);
  if (!existing) {
    // Raced away between insert and lookup — try once more.
    const retry = await insertJob(admin, userId, platform);
    if (retry) return { job: retry, alreadyRunning: false };
    throw new Error("Failed to create library sync job");
  }

  if (!isStale(existing)) {
    return { job: existing, alreadyRunning: true };
  }

  // Reclaim the stalled job so its slot frees up, then create a fresh one.
  await markJobFailed(admin, existing.id, "Superseded: previous run stalled");
  const replacement = await insertJob(admin, userId, platform);
  if (replacement) return { job: replacement, alreadyRunning: false };

  // Still blocked (concurrent relaunch) — return the reclaimed one as active.
  const current = await getActiveJob(admin, userId, platform);
  if (current) return { job: current, alreadyRunning: true };
  throw new Error("Failed to create library sync job");
}

/** Return the current active (pending/running) job, if any. */
export async function getActiveJob(
  admin: SupabaseClient,
  userId: string,
  platform: string
): Promise<LibrarySyncJob | null> {
  const { data, error } = await admin
    .from(TABLE)
    .select(SELECT_COLS)
    .eq("user_id", userId)
    .eq("platform", platform)
    .in("status", ["pending", "running"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as JobRow) : null;
}

/** Flip a job to running and stamp `started_at`. */
export async function markJobRunning(admin: SupabaseClient, jobId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await admin
    .from(TABLE)
    .update({ status: "running", phase: "fetching", started_at: now, updated_at: now })
    .eq("id", jobId);
  if (error) throw error;
}

/** Persist an incremental progress update. Best-effort (errors are logged). */
export async function updateJobProgress(
  admin: SupabaseClient,
  jobId: string,
  progress: LibrarySyncProgress
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (progress.phase !== undefined) patch.phase = progress.phase;
  if (progress.total !== undefined) patch.total = progress.total;
  if (progress.processed !== undefined) patch.processed = progress.processed;
  if (progress.matched !== undefined) patch.matched = progress.matched;
  if (progress.imported !== undefined) patch.imported = progress.imported;
  if (progress.unmatched !== undefined) patch.unmatched = progress.unmatched;
  if (progress.privateProfile !== undefined) patch.private_profile = progress.privateProfile;
  if (progress.currentItem !== undefined) patch.current_item = progress.currentItem;

  const { error } = await admin.from(TABLE).update(patch).eq("id", jobId);
  if (error) logger.error("Failed to update library sync job progress", { jobId, error });
}

/** Finalize a job as succeeded with the final counts. */
export async function markJobSucceeded(
  admin: SupabaseClient,
  jobId: string,
  final: LibrarySyncProgress
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await admin
    .from(TABLE)
    .update({
      status: "succeeded",
      phase: "done",
      total: final.total ?? 0,
      processed: final.processed ?? 0,
      matched: final.matched ?? 0,
      imported: final.imported ?? 0,
      unmatched: final.unmatched ?? 0,
      private_profile: final.privateProfile ?? false,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", jobId);
  if (error) logger.error("Failed to mark library sync job succeeded", { jobId, error });
}

/** Finalize a job as failed with an error message. */
export async function markJobFailed(
  admin: SupabaseClient,
  jobId: string,
  message: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await admin
    .from(TABLE)
    .update({
      status: "failed",
      phase: "failed",
      error_message: message.slice(0, 500),
      completed_at: now,
      updated_at: now,
    })
    .eq("id", jobId);
  if (error) logger.error("Failed to mark library sync job failed", { jobId, error });
}

/**
 * Return the most recent job per platform for a user (one row per platform).
 * Reads a bounded window ordered by recency and keeps the first per platform.
 */
export async function getLatestJobsByPlatform(
  admin: SupabaseClient,
  userId: string
): Promise<LibrarySyncJob[]> {
  const { data, error } = await admin
    .from(TABLE)
    .select(SELECT_COLS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const latest = new Map<string, LibrarySyncJob>();
  for (const row of (data ?? []) as JobRow[]) {
    if (!latest.has(row.platform)) latest.set(row.platform, mapRow(row));
  }
  return Array.from(latest.values());
}


/**
 * Stamp `player_linked_platforms.last_library_sync_at` when a job ends (any
 * outcome) so the sync-libraries cron rotates to the least recently synced
 * accounts. Best-effort (errors are logged).
 */
export async function stampLastLibrarySync(
  admin: SupabaseClient,
  userId: string,
  platform: string
): Promise<void> {
  const { error } = await admin
    .from("player_linked_platforms")
    .update({ last_library_sync_at: new Date().toISOString() })
    .eq("player_id", userId)
    .eq("platform", platform);
  if (error) logger.error("Failed to stamp last library sync", { userId, platform, error });
}
