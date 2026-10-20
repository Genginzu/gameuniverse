/**
 * Persistence adapter for pandascore_sync_logs (incremental run kind).
 *
 * One row is inserted per incremental run for audit. The row is updated
 * at completion with per-entity counts and error details. Status
 * transitions come from the shared sync-run module so both run kinds
 * stamp the same columns.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { logger } from "../../_shared/logger.ts";
import { untypedTable } from "../../_shared/untyped-table.ts";
import type { SyncErrorCollector } from "../../_shared/pandascore/helpers.ts";
import { completedPatch, failedPatch } from "../../_shared/pandascore/sync-run/index.ts";

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

function countColumns(counts: SyncCounts): Record<string, number> {
  const columns: Record<string, number> = {};
  for (const [entity, value] of Object.entries(counts)) {
    columns[`${entity}_synced`] = value.synced;
    columns[`${entity}_errors`] = value.errors;
  }
  return columns;
}

export async function completeLogEntry(
  supabase: SupabaseClient,
  logId: string,
  options: { counts: SyncCounts; durationMs: number; errors: SyncErrorCollector },
): Promise<void> {
  await untypedTable(supabase, "pandascore_sync_logs")
    .update({
      ...completedPatch(new Date()),
      ...countColumns(options.counts),
      duration_ms: options.durationMs,
      error_details: options.errors.toJSON(),
    })
    .eq("id", logId);
}

export async function failLogEntry(
  supabase: SupabaseClient,
  logId: string,
  options: { errorMessage: string; durationMs: number; errors: SyncErrorCollector },
): Promise<void> {
  await untypedTable(supabase, "pandascore_sync_logs")
    .update({
      ...failedPatch(options.errorMessage, new Date()),
      duration_ms: options.durationMs,
      error_details: options.errors.toJSON(),
    })
    .eq("id", logId);
}
