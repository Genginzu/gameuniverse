/**
 * POST /api/admin/esport/full-sync
 *
 * Inserts a new full-sync job row in `pandascore_sync_jobs` with
 * status='pending', then immediately invokes the
 * `pandascore-full-sync` Edge Function with the job id so the first
 * chunk starts right away. Subsequent chunks are self-rescheduled by
 * the Edge Function itself.
 *
 * Returns the jobId so the admin UI can poll its progress via
 * GET /api/admin/esport/sync-jobs.
 *
 * Body (optional): { game?: string, entity?: 'teams'|'players'|'tournaments'|'matches' }
 *   - game: filter PandaScore queries by videogame title
 *   - entity: when set, the job's kind is 'entity' and only that entity
 *     is synced. When omitted, kind is 'full'.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const VALID_ENTITIES = ["teams", "players", "tournaments", "matches"] as const;
type Entity = (typeof VALID_ENTITIES)[number];

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const game = typeof body.game === "string" ? body.game : null;
  const rawEntity = typeof body.entity === "string" ? body.entity : null;
  const entity =
    rawEntity && (VALID_ENTITIES as readonly string[]).includes(rawEntity)
      ? (rawEntity as Entity)
      : null;

  const supabase = getSupabaseAdmin();

  // Reject if a non-terminal job already exists. Two parallel full syncs
  // would both upsert the same rows (idempotent) but waste budget and
  // confuse the admin UI.
  const { data: active } = await supabase
    .from("pandascore_sync_jobs")
    .select("id, status")
    .in("status", ["pending", "running"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (active && active.length > 0) {
    return NextResponse.json(
      {
        error: "A sync job is already in progress",
        existingJobId: active[0].id,
        existingStatus: active[0].status,
      },
      { status: 409 },
    );
  }

  const { data: job, error } = await supabase
    .from("pandascore_sync_jobs")
    .insert({
      kind: entity ? "entity" : "full",
      entity,
      game,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !job) {
    logger.error("Failed to insert sync job", { error });
    return NextResponse.json(
      { error: "Failed to create sync job" },
      { status: 500 },
    );
  }

  logger.info("Sync job created", { jobId: job.id, kind: entity ? "entity" : "full", entity, game });

  // Fire-and-forget the first chunk. The Edge Function self-reschedules
  // after each chunk, so we don't need to await this. If the call fails
  // the job stays in `pending` and a manual re-trigger from the admin
  // UI will pick it up.
  triggerFirstChunk(job.id as string).catch((err) => {
    logger.warn("Failed to trigger first chunk", { jobId: job.id, error: err });
  });

  return NextResponse.json({ jobId: job.id }, { status: 201 });
}

async function triggerFirstChunk(jobId: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    logger.warn("triggerFirstChunk: Supabase URL or service key missing");
    return;
  }

  const url = `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/pandascore-full-sync`;

  // Don't await the body — we just want the function to start.
  await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ jobId }),
  });
}
