import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getAdditions,
  getChanges,
  getDeletions,
  getTeamById,
  getPlayerById,
  getTournamentById,
  getMatchById,
  type PandaScoreIncident,
} from "@/lib/pandascore/client";
import type { PandaScoreListParams } from "@/lib/pandascore/types";
import { syncAll } from "@/lib/services/pandascoreSyncService";
import {
  bulkUpsert,
  cleanupStaleSyncLogs,
  preloadIdMap,
  SyncErrorCollector,
} from "@/lib/services/pandascore-sync-helpers";
import { resolvePredictionsForMatch } from "@/lib/services/esportPredictionService";
import { reconcilePlayerTeamHistory } from "@/lib/services/esport/playerTeamHistory";
import { logger } from "@/lib/logger";

const ENTITY_TYPES = ["team", "player", "tournament", "match"] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

const TABLE_MAP: Record<EntityType, string> = {
  team: "esport_teams",
  player: "esport_players",
  tournament: "esport_tournaments",
  match: "esport_matches",
};

/**
 * Hard cap on the number of incidents processed per run, per category. Keeps
 * the cron under maxDuration even when PandaScore returns thousands of changes
 * (e.g. after a long downtime). The cron runs daily, so the next invocation
 * will pick up the rest via /additions, /changes since the new completed_at.
 */
const MAX_INCIDENTS_PER_TYPE = 300;

/** How many PandaScore detail fetches to run concurrently. */
const FETCH_CONCURRENCY = 8;

/**
 * Maximum pages of incidents to fetch per category. PandaScore returns 100 per
 * page, so 30 pages = 3 000 incidents per call (additions, changes, deletions).
 */
const INCIDENTS_MAX_PAGES = 30;

/**
 * GET/POST /api/cron/esport-sync
 * Incremental sync: uses PandaScore Incidents API to only fetch what changed
 * since the last successful sync. Falls back to full sync on first run.
 * GET is used by Vercel Cron, POST for manual triggers.
 */
export const maxDuration = 300;

export const GET = handler;
export const POST = handler;

async function handler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const trigger = request.nextUrl.searchParams.get("trigger") === "manual" ? "manual" : "cron";

  if (trigger === "cron" && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const start = Date.now();
  const errors = new SyncErrorCollector();

  // Best-effort cleanup of orphan running logs before starting (e.g. from
  // killed serverless invocations that never marked themselves completed).
  await cleanupStaleSyncLogs();

  // Create log entry
  const { data: log } = await supabase
    .from("pandascore_sync_logs")
    .insert({ trigger, status: "running" })
    .select("id")
    .single();
  const logId = log?.id;

  try {
    // Find last successful sync time
    const { data: lastSync } = await supabase
      .from("pandascore_sync_logs")
      .select("completed_at")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    const since = lastSync?.completed_at as string | null;

    let results;
    if (!since) {
      // First run: full sync
      logger.info("PandaScore cron: no previous sync, running full sync");
      results = await syncAll();
    } else {
      // Incremental sync via Incidents API
      logger.info("PandaScore cron: incremental sync since", { since });
      results = await incrementalSync(since, errors);

      // Fallback: if incremental returned nothing and tables are empty, do full sync
      const totalSynced = results.teams.synced + results.players.synced + results.tournaments.synced + results.matches.synced;
      if (totalSynced === 0) {
        const { count } = await supabase.from("esport_teams").select("id", { count: "exact", head: true });
        if (!count || count === 0) {
          logger.info("PandaScore cron: tables empty after incremental, falling back to full sync");
          results = await syncAll();
        }
      }
    }

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
          error_details: errors.toJSON(),
          completed_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    logger.info("PandaScore sync completed", { trigger, duration, since: since ?? "full", results, errorCount: errors.count });
    return NextResponse.json({ ok: true, trigger, incremental: !!since, duration, results, errors: errors.count });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (logId) {
      await supabase
        .from("pandascore_sync_logs")
        .update({
          status: "failed",
          error_message: msg,
          duration_ms: Date.now() - start,
          error_details: errors.toJSON(),
          completed_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }
    logger.error("PandaScore sync failed", { trigger, error });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

type SyncResult = { synced: number; errors: number };
type AllResults = { teams: SyncResult; players: SyncResult; tournaments: SyncResult; matches: SyncResult };

/**
 * Incremental sync via the PandaScore Incidents API. Groups incidents by type,
 * deduplicates (same id can appear in additions and changes), caps per-type
 * volume, fetches details with bounded concurrency, then bulk upserts with
 * preloaded FK maps. Designed to stay well under the 5 min serverless timeout.
 */
async function incrementalSync(since: string, errors: SyncErrorCollector): Promise<AllResults> {
  const results: AllResults = {
    teams: { synced: 0, errors: 0 },
    players: { synced: 0, errors: 0 },
    tournaments: { synced: 0, errors: 0 },
    matches: { synced: 0, errors: 0 },
  };

  const baseParams: PandaScoreListParams = {
    since,
    per_page: 100,
    type: ENTITY_TYPES.join(",") as unknown as string,
  };

  // Fetch additions, changes, deletions in parallel.
  const [additions, changes, deletions] = await Promise.all([
    fetchAllIncidents(getAdditions, baseParams, "additions", errors),
    fetchAllIncidents(getChanges, baseParams, "changes", errors),
    fetchAllIncidents(getDeletions, baseParams, "deletions", errors),
  ]);

  logger.info("PandaScore incremental incidents fetched", {
    additions: additions.length,
    changes: changes.length,
    deletions: deletions.length,
  });

  // Group upsert ids by entity type, deduplicating across additions/changes.
  const upsertIdsByType = new Map<EntityType, Set<number>>();
  for (const t of ENTITY_TYPES) upsertIdsByType.set(t, new Set());

  for (const incident of [...additions, ...changes]) {
    const type = incident.type as EntityType;
    if (ENTITY_TYPES.includes(type)) {
      upsertIdsByType.get(type)!.add(incident.id);
    }
  }

  // Sync in dependency order: teams → tournaments (independent) → players → matches
  results.teams = await syncTeamsIncremental(takeIds(upsertIdsByType, "team"), errors);
  results.tournaments = await syncTournamentsIncremental(takeIds(upsertIdsByType, "tournament"), errors);
  results.players = await syncPlayersIncremental(takeIds(upsertIdsByType, "player"), errors);
  results.matches = await syncMatchesIncremental(takeIds(upsertIdsByType, "match"), errors);

  // Apply deletions. Group by table for one delete query per table.
  const deletionsByType = new Map<EntityType, number[]>();
  for (const incident of deletions) {
    const type = incident.type as EntityType;
    if (ENTITY_TYPES.includes(type)) {
      const arr = deletionsByType.get(type) ?? [];
      arr.push(incident.id);
      deletionsByType.set(type, arr);
    }
  }

  const supabase = getSupabaseAdmin();
  for (const [type, ids] of deletionsByType) {
    if (ids.length === 0) continue;
    const table = TABLE_MAP[type];
    const key = entityKey(type);
    const { error } = await supabase.from(table).delete().in("pandascore_id", ids);
    if (error) {
      logger.warn("Bulk delete error", { table, count: ids.length, error: error.message });
      results[key].errors += ids.length;
      for (const id of ids) {
        errors.add({ type, id, phase: "delete", error: error.message });
      }
    } else {
      results[key].synced += ids.length;
    }
  }

  return results;
}

function takeIds(map: Map<EntityType, Set<number>>, type: EntityType): number[] {
  const all = Array.from(map.get(type) ?? []);
  if (all.length > MAX_INCIDENTS_PER_TYPE) {
    logger.warn("Capping incidents for type", { type, total: all.length, cap: MAX_INCIDENTS_PER_TYPE });
    return all.slice(0, MAX_INCIDENTS_PER_TYPE);
  }
  return all;
}

function entityKey(type: EntityType): keyof AllResults {
  return type === "match" ? "matches" : (`${type}s` as keyof AllResults);
}

// -- Per-type incremental sync helpers --

async function syncTeamsIncremental(ids: number[], errors: SyncErrorCollector): Promise<SyncResult> {
  if (ids.length === 0) return { synced: 0, errors: 0 };
  const teams = await fetchInBatches(ids, getTeamById, "team", errors);
  const rows = teams.map((t) => ({
    pandascore_id: t.id, name: t.name, slug: t.slug,
    acronym: t.acronym, image_url: t.image_url, location: t.location,
    game: t.current_videogame?.name ?? null,
  }));
  const result = await bulkUpsert("esport_teams", rows, "pandascore_id", { errorCollector: errors, errorType: "team" });
  return { ...result, errors: result.errors + (ids.length - teams.length) };
}

async function syncTournamentsIncremental(ids: number[], errors: SyncErrorCollector): Promise<SyncResult> {
  if (ids.length === 0) return { synced: 0, errors: 0 };
  const tournaments = await fetchInBatches(ids, getTournamentById, "tournament", errors);
  const rows = tournaments.map((t) => ({
    pandascore_id: t.id, name: t.name, slug: t.slug,
    begin_at: t.begin_at, end_at: t.end_at, prizepool: t.prizepool,
    tier: t.tier, league_name: t.league.name,
    league_image_url: t.league.image_url,
    serie_name: t.serie.name, game: t.videogame.name,
  }));
  const result = await bulkUpsert("esport_tournaments", rows, "pandascore_id", { errorCollector: errors, errorType: "tournament" });
  return { ...result, errors: result.errors + (ids.length - tournaments.length) };
}

async function syncPlayersIncremental(ids: number[], errors: SyncErrorCollector): Promise<SyncResult> {
  if (ids.length === 0) return { synced: 0, errors: 0 };
  const players = await fetchInBatches(ids, getPlayerById, "player", errors);

  // Preload teams referenced by these players in one query.
  const teamPandaIds = players
    .map((p) => p.current_team?.id)
    .filter((id): id is number => typeof id === "number");
  const teamMap = await preloadIdMap("esport_teams", teamPandaIds);

  const rows = players.map((p) => ({
    pandascore_id: p.id, name: p.name, slug: p.slug,
    first_name: p.first_name, last_name: p.last_name,
    nationality: p.nationality, image_url: p.image_url,
    role: p.role,
    team_id: p.current_team?.id ? teamMap.get(p.current_team.id) ?? null : null,
    game: p.current_videogame?.name ?? null,
  }));
  const result = await bulkUpsert("esport_players", rows, "pandascore_id", { errorCollector: errors, errorType: "player" });

  // Reconcile the team history table for the players we just upserted.
  const playerLocalMap = await preloadIdMap("esport_players", players.map((p) => p.id));
  const historyInputs = players
    .map((p) => {
      const playerLocalId = playerLocalMap.get(p.id);
      if (!playerLocalId) return null;
      const newTeamLocalId = p.current_team?.id ? teamMap.get(p.current_team.id) ?? null : null;
      return { playerLocalId, newTeamLocalId };
    })
    .filter((x): x is { playerLocalId: string; newTeamLocalId: string | null } => x !== null);
  await reconcilePlayerTeamHistory(historyInputs);

  return { ...result, errors: result.errors + (ids.length - players.length) };
}

async function syncMatchesIncremental(ids: number[], errors: SyncErrorCollector): Promise<SyncResult> {
  if (ids.length === 0) return { synced: 0, errors: 0 };
  const matches = await fetchInBatches(ids, getMatchById, "match", errors);

  // Preload tournament and team FKs in two queries.
  const tournamentPandaIds = matches.map((m) => m.tournament_id).filter((id): id is number => typeof id === "number");
  const teamPandaIds = matches.flatMap((m) => [
    m.opponents[0]?.opponent?.id,
    m.opponents[1]?.opponent?.id,
    m.winner_id,
  ]).filter((id): id is number => typeof id === "number");

  const [tournamentMap, teamMap] = await Promise.all([
    preloadIdMap("esport_tournaments", tournamentPandaIds),
    preloadIdMap("esport_teams", teamPandaIds),
  ]);

  const rows = matches.map((m) => ({
    pandascore_id: m.id, name: m.name, status: m.status,
    match_type: m.match_type, number_of_games: m.number_of_games,
    begin_at: m.begin_at, end_at: m.end_at,
    tournament_id: tournamentMap.get(m.tournament_id) ?? null,
    opponent1_id: m.opponents[0]?.opponent?.id ? teamMap.get(m.opponents[0].opponent.id) ?? null : null,
    opponent2_id: m.opponents[1]?.opponent?.id ? teamMap.get(m.opponents[1].opponent.id) ?? null : null,
    opponent1_score: m.results?.[0]?.score ?? null,
    opponent2_score: m.results?.[1]?.score ?? null,
    winner_id: m.winner_id ? teamMap.get(m.winner_id) ?? null : null,
    game: m.videogame.name,
    streams: m.streams_list ?? null,
  }));
  const result = await bulkUpsert("esport_matches", rows, "pandascore_id", { errorCollector: errors, errorType: "match" });

  // Resolve predictions for newly finished matches with a winner.
  const finished = matches.filter((m) => m.status === "finished" && m.winner_id);
  for (const m of finished) {
    try {
      await resolvePredictionsForMatch(m.id, m.winner_id!);
    } catch (err) {
      logger.warn("Failed to resolve predictions for match", { matchId: m.id, err });
    }
  }

  return { ...result, errors: result.errors + (ids.length - matches.length) };
}

// -- Utilities --

/**
 * Fetches a list of PandaScore objects by id with bounded concurrency.
 * Skips items that fail (partial result) and records the failure in the
 * error collector.
 */
async function fetchInBatches<T>(
  ids: number[],
  fetcher: (id: number) => Promise<T>,
  type: string,
  errors: SyncErrorCollector,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < ids.length; i += FETCH_CONCURRENCY) {
    const batch = ids.slice(i, i + FETCH_CONCURRENCY);
    const settled = await Promise.allSettled(batch.map((id) => fetcher(id)));
    for (let j = 0; j < settled.length; j++) {
      const r = settled[j];
      const id = batch[j];
      if (r.status === "fulfilled") {
        results.push(r.value);
      } else {
        const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
        errors.add({ type, id, phase: "fetch", error: msg });
      }
    }
  }
  return results;
}

async function fetchAllIncidents(
  fetcher: (p: PandaScoreListParams) => Promise<PandaScoreIncident[]>,
  baseParams: PandaScoreListParams,
  label: string,
  errors: SyncErrorCollector,
): Promise<PandaScoreIncident[]> {
  const all: PandaScoreIncident[] = [];
  let page = 1;
  while (page <= INCIDENTS_MAX_PAGES) {
    let batch: PandaScoreIncident[];
    try {
      batch = await fetcher({ ...baseParams, page });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn("fetchAllIncidents stopped early", { label, page, error: msg });
      errors.add({
        type: "incidents",
        id: null,
        phase: "fetch",
        error: `${label} page ${page}: ${msg}`,
      });
      break;
    }
    all.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  if (page > INCIDENTS_MAX_PAGES) {
    logger.warn("fetchAllIncidents reached max pages", { label, total: all.length });
  }
  return all;
}
