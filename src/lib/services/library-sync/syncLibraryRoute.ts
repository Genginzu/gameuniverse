import { NextResponse, after } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { createSyncJob } from "@/lib/services/librarySyncJobs";
import type { SyncablePlatform } from "@/types/library-sync";
import { runLibrarySyncJob } from "./runLibrarySyncJob";

const PLATFORM_LABELS: Record<SyncablePlatform, string> = {
  steam: "Steam",
  xbox: "Xbox",
  playstation: "PlayStation",
};

export function createSyncLibraryHandler(platform: SyncablePlatform) {
  const label = PLATFORM_LABELS[platform];

  return async function POST() {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      const { data: linked, error } = await supabase
        .from("player_linked_platforms")
        .select("id")
        .eq("player_id", user.id)
        .eq("platform", platform)
        .maybeSingle();

      if (error) throw error;
      if (!linked) {
        return NextResponse.json({ error: `${label} account not linked` }, { status: 400 });
      }

      const admin = getSupabaseAdmin();
      const { job, alreadyRunning } = await createSyncJob(admin, user.id, platform);

      if (!alreadyRunning) {
        after(() => runLibrarySyncJob({ admin, jobId: job.id, userId: user.id, platform }));
      }

      return NextResponse.json({ job, alreadyRunning }, { status: alreadyRunning ? 200 : 202 });
    } catch (err) {
      logger.error(`${label} library sync failed to start`, { userId: user.id, err });
      const message = err instanceof Error ? err.message : `${label} sync failed`;
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
