import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { createSyncJob } from "@/lib/services/librarySyncJobs";
import { runLibrarySyncJob } from "@/lib/services/library-sync";
import {
  SYNCABLE_PLATFORMS,
  isSyncablePlatform,
  type SyncablePlatform,
} from "@/types/library-sync";

const MAX_USERS_PER_RUN = 50;

interface SyncOutcome {
  playerId: string;
  platform: SyncablePlatform;
  status: "succeeded" | "continuing" | "failed" | "skipped";
  ok: boolean;
  jobId?: string;
  matched?: number;
  total?: number;
  error?: string;
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  return bearer === secret || request.headers.get("x-cron-secret") === secret;
}

export const GET = handler;
export const POST = handler;

async function syncCandidate(
  admin: ReturnType<typeof getSupabaseAdmin>,
  playerId: string,
  platform: SyncablePlatform
): Promise<SyncOutcome> {
  try {
    const { job, alreadyRunning } = await createSyncJob(admin, playerId, platform);
    if (alreadyRunning) {
      return { playerId, platform, status: "skipped", ok: true, jobId: job.id };
    }
    const outcome = await runLibrarySyncJob({ admin, jobId: job.id, userId: playerId, platform });
    return { playerId, platform, jobId: job.id, ok: outcome.status !== "failed", ...outcome };
  } catch (err) {
    const message = err instanceof Error ? err.message : "sync failed";
    logger.error("cron sync-libraries user failed", { playerId, platform, message });
    return { playerId, platform, status: "failed", ok: false, error: message };
  }
}

async function handler(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { data: rows, error } = await admin
    .from("player_linked_platforms")
    .select("player_id, platform")
    .in("platform", [...SYNCABLE_PLATFORMS])
    .order("id", { ascending: true })
    .limit(MAX_USERS_PER_RUN);

  if (error) {
    logger.error("cron sync-libraries select failed", { error });
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const outcomes: SyncOutcome[] = [];
  for (const row of (rows ?? []) as Array<{ player_id: string; platform: string }>) {
    if (!isSyncablePlatform(row.platform)) continue;
    outcomes.push(await syncCandidate(admin, row.player_id, row.platform));
  }

  return NextResponse.json({
    processed: outcomes.length,
    succeeded: outcomes.filter((o) => o.ok && o.status !== "skipped").length,
    failed: outcomes.filter((o) => !o.ok).length,
    skipped: outcomes.filter((o) => o.status === "skipped").length,
    outcomes,
  });
}
