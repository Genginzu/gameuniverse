import { NextResponse, after } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { getLatestJobsByPlatform } from "@/lib/services/librarySyncJobs";
import { runLibrarySyncJob } from "@/lib/services/library-sync";
import { isSyncablePlatform, type LibrarySyncJob } from "@/types/library-sync";

/**
 * A job is considered "stalled" when its runner stopped updating progress —
 * e.g. the serverless invocation (or `after()` work) that was driving it was
 * torn down (page reload, cold start, timeout). Since library syncs are
 * idempotent and re-runnable, the client's own polling re-drives any stalled
 * job, so progress resumes automatically without the browser having to keep
 * the original request alive.
 */
const STALE_MS = 25_000;

/** Allow re-driven syncs room to run on platforms with a function time budget. */
export const maxDuration = 60;

function isStalled(job: LibrarySyncJob): boolean {
  if (job.status !== "pending" && job.status !== "running") return false;
  const updated = new Date(job.updatedAt).getTime();
  if (Number.isNaN(updated)) return true;
  return Date.now() - updated > STALE_MS;
}

/**
 * GET /api/profile/sync-jobs
 *
 * Returns the most recent library-sync job per platform for the current user.
 * The Connections UI polls this to render live progress that survives
 * navigation (state lives in the DB, not in the client). As a side effect,
 * stalled jobs are re-driven here so an interrupted import (e.g. page reload)
 * continues on its own.
 */
export async function GET() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const admin = getSupabaseAdmin();
    const jobs = await getLatestJobsByPlatform(admin, user.id);

    for (const job of jobs) {
      const platform = job.platform;
      if (!isStalled(job) || !isSyncablePlatform(platform)) continue;
      after(() => runLibrarySyncJob({ admin, jobId: job.id, userId: user.id, platform }));
    }

    return NextResponse.json({ jobs });
  } catch (err) {
    logger.error("Failed to list library sync jobs", { userId: user.id, err });
    return NextResponse.json({ error: "Failed to list sync jobs" }, { status: 500 });
  }
}
