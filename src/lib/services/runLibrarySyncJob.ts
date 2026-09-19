import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import type { LibrarySyncProgress, SyncablePlatform } from "@/types/library-sync";
import { syncSteamLibrary } from "./steamLibrarySync";
import { syncXboxLibrary } from "./xboxLibrarySync";
import { syncPsnLibrary } from "./psnLibrarySync";
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

interface PassResult {
  total: number;
  matched: number;
  imported: number;
  /** True when there is no more work to do for this job. */
  done: boolean;
}

/**
 * Kick off the next pass on a fresh server-side invocation, independent of the
 * browser. Each library-sync "pass" imports a bounded number of missing games
 * (see MAX_IMPORTS_PER_SYNC in the platform services); a big library therefore
 * needs several passes. Rather than relying on the client to keep polling
 * (which is throttled/stopped when the tab is backgrounded or closed), a pass
 * that still has work hands off to the internal continuation endpoint, which
 * schedules the next pass in its own `after()`. The chain runs to completion
 * on the server. Client polling + cron remain as safety nets.
 */
async function triggerContinuation(params: {
  jobId: string;
  userId: string;
  platform: SyncablePlatform;
  steamId?: string | null;
}): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const secret = process.env.CRON_SECRET;
  // Without a base URL or shared secret we can't self-trigger; the client poll
  // / cron safety nets will resume the still-"running" job instead.
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

/**
 * Execute one library-sync pass while streaming progress into the job row, then
 * either finalize the job (converged) or hand off to the next pass.
 *
 * Runs inside a Next.js `after()` callback so it survives the HTTP response.
 * Never throws — failures are recorded on the job.
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
    // Terminal state is written explicitly below; skip flushing it here.
    if (progress.phase === "done") return;
    flush(progress.phase !== undefined);
  };

  try {
    await markJobRunning(admin, jobId);

    // The admin client is intentionally untyped; the sync services expect a
    // typed client but only use table names present in the schema.
    const db = admin as unknown as SupabaseClient<Database>;

    let result: PassResult;
    if (platform === "steam") {
      if (!steamId) throw new Error("Steam account not linked");
      const r = await syncSteamLibrary(db, userId, steamId, onProgress);
      // Steam matches every appid each pass; work remains only while it keeps
      // importing missing games.
      result = { total: r.total, matched: r.matched, imported: r.imported, done: r.imported === 0 };
    } else if (platform === "playstation") {
      const r = await syncPsnLibrary(db, userId, onProgress);
      result = { total: r.total, matched: r.matched, imported: r.imported, done: r.done };
    } else {
      const r = await syncXboxLibrary(db, userId, onProgress);
      result = { total: r.total, matched: r.matched, imported: r.imported, done: r.done };
    }

    await lastFlushPromise;

    // Complete when the platform reports no more work (or everything matched).
    const complete = result.done || result.matched >= result.total;

    if (complete) {
      await markJobSucceeded(admin, jobId, {
        phase: "done",
        total: result.total,
        processed: result.matched,
        matched: result.matched,
        imported: result.imported,
        unmatched: result.total - result.matched,
      });
    } else {
      // More missing games to import: keep the job running, reflect cumulative
      // progress, and hand off to the next pass on a fresh server invocation.
      await updateJobProgress(admin, jobId, {
        phase: "importing",
        total: result.total,
        processed: result.matched,
        matched: result.matched,
        imported: result.imported,
      });
      await triggerContinuation({ jobId, userId, platform, steamId });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Library sync failed";
    logger.error("Library sync job failed", { jobId, platform, message });
    await markJobFailed(admin, jobId, message);
  }
}
