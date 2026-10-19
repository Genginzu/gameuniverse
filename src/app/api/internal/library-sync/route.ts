import { NextRequest, NextResponse, after } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { runLibrarySyncJob } from "@/lib/services/runLibrarySyncJob";
import { isSyncablePlatform } from "@/types/library-sync";
import { bearerToken, safeEqual } from "@/lib/utils/safeEqual";

/** Give the after() sync pass room to run. */
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (
    safeEqual(bearerToken(request.headers.get("authorization")), secret) ||
    safeEqual(request.headers.get("x-cron-secret"), secret)
  );
}

/**
 * POST /api/internal/library-sync
 *
 * Runs one library-sync pass for an existing job, then (if work remains) the
 * pass itself re-triggers this endpoint. This server-to-server chain drives a
 * multi-pass import to completion independently of the browser — closing or
 * backgrounding the tab no longer stops the import.
 *
 * Authenticated with CRON_SECRET (same as the cron routes); never called
 * directly by clients.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { jobId?: string; userId?: string; platform?: string; steamId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { jobId, userId, platform, steamId } = body;
  if (!jobId || !userId || !platform || !isSyncablePlatform(platform)) {
    return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  after(() =>
    runLibrarySyncJob({ admin, jobId, userId, platform, steamId: steamId ?? null })
  );

  logger.info("Library sync continuation scheduled", { jobId, platform });
  return NextResponse.json({ ok: true }, { status: 202 });
}
