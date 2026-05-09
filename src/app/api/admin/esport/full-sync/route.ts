/**
 * POST /api/admin/esport/full-sync
 *
 * Inserts a new full-sync job row in `pandascore_sync_jobs` with
 * status='pending'. A Database Webhook on this table picks it up and
 * triggers the `pandascore-full-sync` Edge Function, which processes
 * the job in chunks (≤350s each) and self-reschedules until completion.
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
  return NextResponse.json({ jobId: job.id }, { status: 201 });
}
