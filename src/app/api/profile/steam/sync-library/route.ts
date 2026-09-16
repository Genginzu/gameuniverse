import { NextResponse, after } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { createSyncJob } from "@/lib/services/librarySyncJobs";
import { runLibrarySyncJob } from "@/lib/services/runLibrarySyncJob";

/** Give the after() sync work room to run on platforms with a time budget. */
export const maxDuration = 60;

/**
 * POST /api/profile/steam/sync-library
 *
 * Creates a background library-sync job and runs it after the response via
 * `after()`. The client polls GET /api/profile/sync-jobs to observe progress,
 * which survives navigating away and back.
 *
 * Returns 202 with the freshly created job, or 200 with the already-running
 * job when a sync is already in progress for this user + platform.
 */
export async function POST() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: linked, error } = await supabase
      .from("player_linked_platforms")
      .select("external_id")
      .eq("player_id", user.id)
      .eq("platform", "steam")
      .maybeSingle();

    if (error) throw error;
    if (!linked?.external_id) {
      return NextResponse.json({ error: "Steam account not linked" }, { status: 400 });
    }

    const steamId = linked.external_id;
    const admin = getSupabaseAdmin();
    const { job, alreadyRunning } = await createSyncJob(admin, user.id, "steam");

    if (!alreadyRunning) {
      after(() =>
        runLibrarySyncJob({ admin, jobId: job.id, userId: user.id, platform: "steam", steamId })
      );
    }

    return NextResponse.json({ job, alreadyRunning }, { status: alreadyRunning ? 200 : 202 });
  } catch (err) {
    logger.error("Steam library sync failed to start", { userId: user.id, err });
    const message = err instanceof Error ? err.message : "Steam sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
