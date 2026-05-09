/**
 * GET /api/admin/esport/sync-jobs
 *
 * Lists recent PandaScore sync jobs for admin polling. Returns the
 * latest 10 by default, ordered by creation time desc. The admin UI
 * polls this endpoint via SWR while a job is pending/running so it
 * can show progress (cursor + counts).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)),
  );

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("pandascore_sync_jobs")
    .select(
      "id, kind, entity, game, status, cursor, total_synced, total_errors, error_message, error_details, started_at, completed_at, last_chunk_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("Failed to list sync jobs", { error });
    return NextResponse.json(
      { error: "Failed to list sync jobs" },
      { status: 500 },
    );
  }

  return NextResponse.json({ jobs: data ?? [] });
}
