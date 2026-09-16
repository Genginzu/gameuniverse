import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import type { LibrarySyncProgress, SyncablePlatform } from "@/types/library-sync";
import { syncSteamLibrary } from "./steamLibrarySync";
import { syncXboxLibrary } from "./xboxLibrarySync";
import {
  markJobFailed,
  markJobRunning,
  markJobSucceeded,
  updateJobProgress,
} from "./librarySyncJobs";

/** Minimum delay between throttled progress writes to the job row. */
const PROGRESS_FLUSH_MS = 1000;

interface RunLibrarySyncJobParams {
  /** Service-role client (untyped) used for all job + library writes. */
  admin: SupabaseClient;
  jobId: string;
  userId: string;
  platform: SyncablePlatform;
  /** Required for Steam (the owned-games API is keyed by steamid). */
  steamId?: string | null;
}

/**
 * Execute a library sync end-to-end while streaming progress into the job row.
 *
 * Intended to run inside a Next.js `after()` callback so it survives the HTTP
 * response: the client polls the job row and sees progress even after leaving
 * and returning to the page. Never throws — failures are recorded on the job.
 */
export async function runLibrarySyncJob({
  admin,
  jobId,
  userId,
  platform,
  steamId,
}: RunLibrarySyncJobParams): Promise<void> {
  const accumulated: LibrarySyncProgress = {};
  let lastFlush = 0;
  let lastFlushPromise: Promise<void> = Promise.resolve();

  const flush = (force: boolean) => {
    const now = Date.now();
    if (!force && now - lastFlush < PROGRESS_FLUSH_MS) return;
    lastFlush = now;
    lastFlushPromise = updateJobProgress(admin, jobId, { ...accumulated });
  };

  const onProgress = (progress: LibrarySyncProgress) => {
    Object.assign(accumulated, progress);
    // The terminal "done" state is written by markJobSucceeded below, so we
    // skip flushing it here to avoid racing the final status update.
    if (progress.phase === "done") return;
    flush(progress.phase !== undefined);
  };

  try {
    await markJobRunning(admin, jobId);

    // The admin client is intentionally untyped; the sync services expect a
    // typed client but only use table names present in the schema.
    const db = admin as unknown as SupabaseClient<Database>;

    if (platform === "steam") {
      if (!steamId) throw new Error("Steam account not linked");
      await syncSteamLibrary(db, userId, steamId, onProgress);
    } else {
      await syncXboxLibrary(db, userId, onProgress);
    }

    // Ensure the last throttled intermediate write settled before finalizing.
    await lastFlushPromise;
    await markJobSucceeded(admin, jobId, accumulated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Library sync failed";
    logger.error("Library sync job failed", { jobId, platform, message });
    await markJobFailed(admin, jobId, message);
  }
}
