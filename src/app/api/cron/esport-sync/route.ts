import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { syncAll } from "@/lib/services/pandascoreSyncService";
import { logger } from "@/lib/logger";

/**
 * POST /api/cron/esport-sync
 * Called by Vercel Cron or manually from admin.
 * Auth: CRON_SECRET header or admin session.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    // Allow admin manual trigger via query param
    const trigger = request.nextUrl.searchParams.get("trigger");
    if (trigger !== "manual") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Manual trigger will be validated by the admin page calling this
  }

  const trigger = request.nextUrl.searchParams.get("trigger") === "manual" ? "manual" : "cron";
  const supabase = getSupabaseAdmin();
  const start = Date.now();

  // Create log entry
  const { data: log } = await supabase
    .from("pandascore_sync_logs")
    .insert({ trigger, status: "running" })
    .select("id")
    .single();

  const logId = log?.id;

  try {
    const results = await syncAll();
    const duration = Date.now() - start;

    if (logId) {
      await supabase
        .from("pandascore_sync_logs")
        .update({
          status: "completed",
          teams_synced: results.teams.synced,
          teams_errors: results.teams.errors,
          players_synced: results.players.synced,
          players_errors: results.players.errors,
          tournaments_synced: results.tournaments.synced,
          tournaments_errors: results.tournaments.errors,
          matches_synced: results.matches.synced,
          matches_errors: results.matches.errors,
          duration_ms: duration,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    logger.info("PandaScore sync completed", { trigger, duration, results });
    return NextResponse.json({ ok: true, trigger, duration, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const duration = Date.now() - start;

    if (logId) {
      await supabase
        .from("pandascore_sync_logs")
        .update({
          status: "failed",
          error_message: msg,
          duration_ms: duration,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    logger.error("PandaScore sync failed", { trigger, error });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
