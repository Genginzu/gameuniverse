/**
 * Incremental sync handlers, one per entity type.
 *
 * Each handler:
 *   1. fetches the full PandaScore object for each id (concurrent batches),
 *   2. resolves any FK pandascore_id → local uuid via preloadIdMap,
 *   3. bulk-upserts the rows into the matching esport_* table.
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
  bulkUpsert,
  fetchInBatches,
  preloadIdMap,
  type SyncErrorCollector,
} from "../../_shared/pandascore/helpers.ts";
import {
  mapMatch,
  mapPlayer,
  mapTeam,
  mapTournament,
} from "../../_shared/pandascore/mappers.ts";
import {
  reconcilePlayerTeamHistory,
  resolvePredictionsForMatch,
} from "../../_shared/pandascore/vercel-callbacks.ts";

export interface SyncResult {
  synced: number;
  errors: number;
}

export async function syncTeamsByIds(
  supabase: SupabaseClient,
  ids: number[],
  errors: SyncErrorCollector,
): Promise<SyncResult> {
  if (ids.length === 0) return { synced: 0, errors: 0 };
  const teams = await fetchInBatches(ids, getTeamById, "team", errors);
  const rows = teams.map(mapTeam);
  const result = await bulkUpsert(supabase, "esport_teams", rows, "pandascore_id", {
    errorCollector: errors,
    errorType: "team",
  });
  return {
    synced: result.synced,
    errors: result.errors + (ids.length - teams.length),
  };
}

export async function syncTournamentsByIds(
  supabase: SupabaseClient,
  ids: number[],
  errors: SyncErrorCollector,
): Promise<SyncResult> {
  if (ids.length === 0) return { synced: 0, errors: 0 };
  const tournaments = await fetchInBatches(
    ids,
    getTournamentById,
    "tournament",
    errors,
  );
  const rows = tournaments.map(mapTournament);
  const result = await bulkUpsert(
    supabase,
    "esport_tournaments",
    rows,
    "pandascore_id",
    { errorCollector: errors, errorType: "tournament" },
  );
  return {
    synced: result.synced,
    errors: result.errors + (ids.length - tournaments.length),
  };
}

export async function syncPlayersByIds(
  supabase: SupabaseClient,
  ids: number[],
  errors: SyncErrorCollector,
): Promise<SyncResult> {
  if (ids.length === 0) return { synced: 0, errors: 0 };
  const players = await fetchInBatches(ids, getPlayerById, "player", errors);

  const teamPandaIds = players
    .map((p) => p.current_team?.id)
    .filter((id): id is number => typeof id === "number");
  const teamMap = await preloadIdMap(supabase, "esport_teams", teamPandaIds);

  const rows = players.map((p) => mapPlayer(p, teamMap));
  const result = await bulkUpsert(
    supabase,
    "esport_players",
    rows,
    "pandascore_id",
    { errorCollector: errors, errorType: "player" },
  );

  // Reconcile team history via Vercel callback (best-effort).
  const playerLocalMap = await preloadIdMap(
    supabase,
    "esport_players",
    players.map((p) => p.id),
  );
  const historyInputs = players
    .map((p) => {
      const playerLocalId = playerLocalMap.get(p.id);
      if (!playerLocalId) return null;
      const newTeamLocalId = p.current_team?.id
        ? teamMap.get(p.current_team.id) ?? null
        : null;
      return { playerLocalId, newTeamLocalId };
    })
    .filter(
      (x): x is { playerLocalId: string; newTeamLocalId: string | null } =>
        x !== null,
    );
  await reconcilePlayerTeamHistory(historyInputs);

  return {
    synced: result.synced,
    errors: result.errors + (ids.length - players.length),
  };
}

export async function syncMatchesByIds(
  supabase: SupabaseClient,
  ids: number[],
  errors: SyncErrorCollector,
): Promise<SyncResult> {
  if (ids.length === 0) return { synced: 0, errors: 0 };
  const matches = await fetchInBatches(ids, getMatchById, "match", errors);

  const tournamentPandaIds = matches
    .map((m) => m.tournament_id)
    .filter((id): id is number => typeof id === "number");
  const teamPandaIds = matches
    .flatMap((m) => [
      m.opponents[0]?.opponent?.id,
      m.opponents[1]?.opponent?.id,
      m.winner_id,
    ])
    .filter((id): id is number => typeof id === "number");

  const [tournamentMap, teamMap] = await Promise.all([
    preloadIdMap(supabase, "esport_tournaments", tournamentPandaIds),
    preloadIdMap(supabase, "esport_teams", teamPandaIds),
  ]);

  const rows = matches.map((m) => mapMatch(m, tournamentMap, teamMap));
  const result = await bulkUpsert(
    supabase,
    "esport_matches",
    rows,
    "pandascore_id",
    { errorCollector: errors, errorType: "match" },
  );

  // Best-effort prediction settlement for matches that just finished.
  const finished = matches.filter(
    (m) => m.status === "finished" && m.winner_id !== null,
  );
  for (const m of finished) {
    if (m.winner_id !== null) {
      await resolvePredictionsForMatch(m.id, m.winner_id);
    }
  }

  return {
    synced: result.synced,
    errors: result.errors + (ids.length - matches.length),
  };
}

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
