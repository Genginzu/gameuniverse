import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import {
  markJobFailed,
  markJobRunning,
  markJobSucceeded,
  stampLastLibrarySync,
  updateJobProgress,
} from "@/lib/services/librarySyncJobs";
import type {
  LibrarySyncJobOutcome,
  LibrarySyncProgress,
  SyncablePlatform,
} from "@/types/library-sync";
import { syncPlatformLibrary } from "./syncPlatformLibrary";

const PROGRESS_FLUSH_MS = 1000;

export interface RunLibrarySyncJobParams {
  admin: SupabaseClient;
  jobId: string;
  userId: string;
  platform: SyncablePlatform;
}

type ContinuationParams = Omit<RunLibrarySyncJobParams, "admin">;

async function triggerContinuation(params: ContinuationParams): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const secret = process.env.CRON_SECRET;
  if (!baseUrl || !secret) return;

  try {
    await fetch(`${baseUrl}/api/internal/library-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cron-secret": secret },
      body: JSON.stringify(params),
      cache: "no-store",
    });
  } catch (err) {
    logger.warn("Failed to trigger library sync continuation", { jobId: params.jobId, err });
  }
}

function createProgressStream(admin: SupabaseClient, jobId: string) {
  const accumulated: LibrarySyncProgress = {};
  let lastFlush = 0;
  let pendingFlush: Promise<void> = Promise.resolve();

  const onProgress = (progress: LibrarySyncProgress) => {
    Object.assign(accumulated, progress);
    if (progress.phase === "done") return;
    const now = Date.now();
    if (progress.phase === undefined && now - lastFlush < PROGRESS_FLUSH_MS) return;
    lastFlush = now;
    pendingFlush = updateJobProgress(admin, jobId, { ...accumulated });
  };

  return { onProgress, settle: () => pendingFlush };
}

export async function runLibrarySyncJob({
  admin,
  jobId,
  userId,
  platform,
}: RunLibrarySyncJobParams): Promise<LibrarySyncJobOutcome> {
  const progress = createProgressStream(admin, jobId);

  try {
    await markJobRunning(admin, jobId);
    const db = admin as unknown as SupabaseClient<Database>;
    const result = await syncPlatformLibrary(db, userId, platform, {
      onProgress: progress.onProgress,
    });
    await progress.settle();

    const counts = {
      total: result.total,
      processed: result.matched,
      matched: result.matched,
      imported: result.imported,
    };

    if (result.done || result.matched >= result.total) {
      await markJobSucceeded(admin, jobId, {
        ...counts,
        phase: "done",
        unmatched: result.unmatched,
        privateProfile: result.privateProfile,
      });
      await stampLastLibrarySync(admin, userId, platform);
      return { status: "succeeded", total: result.total, matched: result.matched };
    }

    await updateJobProgress(admin, jobId, { ...counts, phase: "importing" });
    await triggerContinuation({ jobId, userId, platform });
    return { status: "continuing", total: result.total, matched: result.matched };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Library sync failed";
    logger.error("Library sync job failed", { jobId, platform, message });
    await markJobFailed(admin, jobId, message);
    await stampLastLibrarySync(admin, userId, platform);
    return { status: "failed", total: 0, matched: 0, error: message };
  }
}
