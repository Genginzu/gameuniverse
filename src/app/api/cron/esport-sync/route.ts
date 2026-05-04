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
 * GET/POST /api/cron/esport-sync
 * Incremental sync: uses PandaScore Incidents API to only fetch what changed
 * since the last successful sync. Falls back to full sync on first run.
 * GET is used by Vercel Cron, POST for manual triggers.
 */
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
      results = await incrementalSync(since);
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
          completed_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    logger.info("PandaScore sync completed", { trigger, duration, since: since ?? "full", results });
    return NextResponse.json({ ok: true, trigger, incremental: !!since, duration, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (logId) {
      await supabase
        .from("pandascore_sync_logs")
        .update({ status: "failed", error_message: msg, duration_ms: Date.now() - start, completed_at: new Date().toISOString() })
        .eq("id", logId);
    }
    logger.error("PandaScore sync failed", { trigger, error });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

type SyncResult = { synced: number; errors: number };
type AllResults = { teams: SyncResult; players: SyncResult; tournaments: SyncResult; matches: SyncResult };

async function incrementalSync(since: string): Promise<AllResults> {
  const results: AllResults = {
    teams: { synced: 0, errors: 0 },
    players: { synced: 0, errors: 0 },
    tournaments: { synced: 0, errors: 0 },
    matches: { synced: 0, errors: 0 },
  };

  const params: PandaScoreListParams = {
    since,
    per_page: 100,
    page: 1,
    type: ENTITY_TYPES.join(",") as unknown as string,
  };

  // Fetch all additions + changes (paginated)
  const upserts = await fetchAllIncidents(
    async (p) => {
      const [additions, changes] = await Promise.all([getAdditions(p), getChanges(p)]);
      return [...additions, ...changes];
    },
    params
  );

  // Fetch deletions
  const deletions = await fetchAllIncidents((p) => getDeletions(p), params);

  // Process upserts: fetch full object from PandaScore and upsert locally
  for (const incident of upserts) {
    const entityType = incident.type as EntityType;
    if (!ENTITY_TYPES.includes(entityType)) continue;
    const key = entityType === "match" ? "matches" : `${entityType}s` as keyof AllResults;

    try {
      await upsertFromIncident(entityType, incident.id);
      results[key].synced++;
    } catch {
      results[key].errors++;
    }
  }

  // Process deletions
  const supabase = getSupabaseAdmin();
  for (const incident of deletions) {
    const entityType = incident.type as EntityType;
    if (!ENTITY_TYPES.includes(entityType)) continue;
    const table = TABLE_MAP[entityType];
    const key = entityType === "match" ? "matches" : `${entityType}s` as keyof AllResults;

    const { error } = await supabase.from(table).delete().eq("pandascore_id", incident.id);
    if (error) {
      results[key].errors++;
    } else {
      results[key].synced++;
    }
  }

  return results;
}

async function fetchAllIncidents(
  fetcher: (p: PandaScoreListParams) => Promise<PandaScoreIncident[]>,
  baseParams: PandaScoreListParams
): Promise<PandaScoreIncident[]> {
  const all: PandaScoreIncident[] = [];
  let page = 1;
  while (true) {
    const batch = await fetcher({ ...baseParams, page });
    all.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return all;
}

async function upsertFromIncident(entityType: EntityType, pandascoreId: number): Promise<void> {
  const supabase = getSupabaseAdmin();

  if (entityType === "team") {
    const t = await getTeamById(pandascoreId);
    await supabase.from("esport_teams").upsert(
      { pandascore_id: t.id, name: t.name, slug: t.slug, acronym: t.acronym, image_url: t.image_url, location: t.location, game: t.current_videogame?.name ?? null },
      { onConflict: "pandascore_id" }
    );
  } else if (entityType === "player") {
    const p = await getPlayerById(pandascoreId);
    const teamId = p.current_team?.id ? await resolveId("esport_teams", p.current_team.id) : null;
    await supabase.from("esport_players").upsert(
      { pandascore_id: p.id, name: p.name, slug: p.slug, first_name: p.first_name, last_name: p.last_name, nationality: p.nationality, image_url: p.image_url, role: p.role, team_id: teamId, game: p.current_videogame?.name ?? null },
      { onConflict: "pandascore_id" }
    );
  } else if (entityType === "tournament") {
    const t = await getTournamentById(pandascoreId);
    await supabase.from("esport_tournaments").upsert(
      { pandascore_id: t.id, name: t.name, slug: t.slug, begin_at: t.begin_at, end_at: t.end_at, prizepool: t.prizepool, tier: t.tier, league_name: t.league.name, league_image_url: t.league.image_url, serie_name: t.serie.name, game: t.videogame.name },
      { onConflict: "pandascore_id" }
    );
  } else if (entityType === "match") {
    const m = await getMatchById(pandascoreId);
    const [tournamentId, opp1, opp2, winnerId] = await Promise.all([
      resolveId("esport_tournaments", m.tournament_id),
      resolveId("esport_teams", m.opponents[0]?.opponent?.id),
      resolveId("esport_teams", m.opponents[1]?.opponent?.id),
      resolveId("esport_teams", m.winner_id),
    ]);
    await supabase.from("esport_matches").upsert(
      { pandascore_id: m.id, name: m.name, status: m.status, match_type: m.match_type, number_of_games: m.number_of_games, begin_at: m.begin_at, end_at: m.end_at, tournament_id: tournamentId, opponent1_id: opp1, opponent2_id: opp2, opponent1_score: m.results?.[0]?.score ?? null, opponent2_score: m.results?.[1]?.score ?? null, winner_id: winnerId, game: m.videogame.name },
      { onConflict: "pandascore_id" }
    );
  }
}

async function resolveId(table: string, pandaId?: number | null) {
  if (!pandaId) return null;
  const { data } = await getSupabaseAdmin().from(table).select("id").eq("pandascore_id", pandaId).single();
  return data?.id ?? null;
}
