/**
 * Lifecycle helpers for pandascore_sync_logs rows.
 *
 * One row is inserted per incremental run for audit. The row is updated
 * at completion with per-entity counts and error details. Same shape as
 * the legacy Vercel cron, so the existing admin UI keeps working.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { logger } from "../../_shared/logger.ts";
import { untypedTable } from "../../_shared/untyped-table.ts";
import type { SyncErrorDetail } from "../../_shared/pandascore/helpers.ts";

export interface SyncCounts {
  teams: { synced: number; errors: number };
  players: { synced: number; errors: number };
  tournaments: { synced: number; errors: number };
  matches: { synced: number; errors: number };
}

export async function createLogEntry(
  supabase: SupabaseClient,
  trigger: "cron" | "manual",
): Promise<string | null> {
  const { data, error } = await untypedTable(supabase, "pandascore_sync_logs")
    .insert({ trigger, status: "running" })
    .select("id")
    .single();

  if (error) {
    logger.warn("Failed to insert sync log row", { error });
    return null;
  }
  return data?.id as string | null;
}

export async function completeLogEntry(
  supabase: SupabaseClient,
  logId: string,
  options: {
    counts: SyncCounts;
    durationMs: number;
    errorDetails: SyncErrorDetail[];
  },
): Promise<void> {
  const { counts, durationMs, errorDetails } = options;
  await untypedTable(supabase, "pandascore_sync_logs")
    .update({
      status: "completed",
      teams_synced: counts.teams.synced,
      teams_errors: counts.teams.errors,
      players_synced: counts.players.synced,
      players_errors: counts.players.errors,
      tournaments_synced: counts.tournaments.synced,
      tournaments_errors: counts.tournaments.errors,
      matches_synced: counts.matches.synced,
      matches_errors: counts.matches.errors,
      duration_ms: durationMs,
      error_details: errorDetails,
      completed_at: new Date().toISOString(),
    })
    .eq("id", logId);
}

export async function failLogEntry(
  supabase: SupabaseClient,
  logId: string,
  options: {
    errorMessage: string;
    durationMs: number;
    errorDetails: SyncErrorDetail[];
  },
): Promise<void> {
  await untypedTable(supabase, "pandascore_sync_logs")
    .update({
      status: "failed",
      error_message: options.errorMessage,
      duration_ms: options.durationMs,
      error_details: options.errorDetails,
      completed_at: new Date().toISOString(),
    })
    .eq("id", logId);
}
