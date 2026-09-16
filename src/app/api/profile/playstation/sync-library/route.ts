import { NextResponse, after } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { createSyncJob } from "@/lib/services/librarySyncJobs";
import { runLibrarySyncJob } from "@/lib/services/runLibrarySyncJob";

/** Give the after() sync work room to run on platforms with a time budget. */
export const maxDuration = 60;

/**
 * POST /api/profile/playstation/sync-library
 *
 * Creates a background library-sync job for the linked PlayStation account and
 * runs it after the response via `after()`. The client polls
 * GET /api/profile/sync-jobs to observe progress, which survives navigation.
 */
export async function POST() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data: linked, error } = await supabase
      .from("player_linked_platforms")
      .select("external_id")
      .eq("player_id", user.id)
      .eq("platform", "playstation")
      .maybeSingle();

    if (error) throw error;
    if (!linked) {
      return NextResponse.json({ error: "PlayStation account not linked" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { job, alreadyRunning } = await createSyncJob(admin, user.id, "playstation");

    if (!alreadyRunning) {
      after(() =>
        runLibrarySyncJob({ admin, jobId: job.id, userId: user.id, platform: "playstation" })
      );
    }

    return NextResponse.json({ job, alreadyRunning }, { status: alreadyRunning ? 200 : 202 });
  } catch (err) {
    logger.error("PlayStation library sync failed to start", { userId: user.id, err });
    const message = err instanceof Error ? err.message : "PlayStation sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
