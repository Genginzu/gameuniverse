/**
 * Incremental sync handlers, one per entity type.
 *
 * Each handler fetches the full PandaScore object for each id (concurrent
 * batches) and hands the items to the shared ingest module (FK resolution,
 * upsert, side effects).
 *
 * Errors are pushed into the shared SyncErrorCollector and counted in the
 * returned `{ synced, errors }`.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {
  getMatchById,
  getPlayerById,
  getTeamById,
  getTournamentById,
} from "../../_shared/pandascore/client.ts";
import {
  fetchInBatches,
  type SyncErrorCollector,
} from "../../_shared/pandascore/helpers.ts";
import {
  ingestMatches,
  ingestPlayers,
  ingestTeams,
  ingestTournaments,
  type IngestDeps,
  type IngestResult,
} from "../../_shared/pandascore/ingest/index.ts";
import { createIngestDeps } from "../../_shared/pandascore/ingest-deps.ts";

export interface SyncResult {
  synced: number;
  errors: number;
}

type IdsSyncer = (
  supabase: SupabaseClient,
  ids: number[],
  errors: SyncErrorCollector,
) => Promise<SyncResult>;

function idSource<T>(
  errorType: string,
  fetcher: (id: number) => Promise<T>,
  ingest: (deps: IngestDeps, items: T[]) => Promise<IngestResult>,
): IdsSyncer {
  return async (supabase, ids, errors) => {
    if (ids.length === 0) return { synced: 0, errors: 0 };
    const items = await fetchInBatches(ids, fetcher, errorType, errors);
    const result = await ingest(createIngestDeps(supabase, errors), items);
    return {
      synced: result.synced,
      errors: result.errors + (ids.length - items.length),
    };
  };
}

export const syncTeamsByIds = idSource("team", getTeamById, ingestTeams);
export const syncTournamentsByIds = idSource(
  "tournament",
  getTournamentById,
  ingestTournaments,
);
export const syncPlayersByIds = idSource("player", getPlayerById, ingestPlayers);
export const syncMatchesByIds = idSource("match", getMatchById, ingestMatches);

/** Bulk delete by pandascore_id. */
export async function deleteByPandaIds(
  supabase: SupabaseClient,
  table: string,
  ids: number[],
  errors: SyncErrorCollector,
  errorType: string,
): Promise<SyncResult> {
  if (ids.length === 0) return { synced: 0, errors: 0 };
  const { error } = await supabase
    .from(table)
    .delete()
    .in("pandascore_id", ids);

  if (error) {
    for (const id of ids) {
      errors.add({ type: errorType, id, phase: "delete", error: error.message });
    }
    return { synced: 0, errors: ids.length };
  }
  return { synced: ids.length, errors: 0 };
}
