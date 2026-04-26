import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getTeams,
  getPlayers,
  getRunningTournaments,
  getUpcomingTournaments,
  getPastMatches,
  getRunningMatches,
} from "@/lib/pandascore/client";
import type { PandaScoreListParams } from "@/lib/pandascore/types";
import { logger } from "@/lib/logger";

type SyncResult = { synced: number; errors: number };

function buildParams(game?: string, page = 1): PandaScoreListParams {
  const params: PandaScoreListParams = { page, per_page: 100 };
  if (game) params["filter[videogame_title]"] = game;
  return params;
}

async function fetchAllPages<T>(
  fetcher: (p: PandaScoreListParams) => Promise<T[]>,
  game?: string,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const batch = await fetcher(buildParams(game, page));
    all.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return all;
}

async function resolveId(table: string, pandaId?: number | null) {
  if (!pandaId) return null;
  const { data } = await getSupabaseAdmin()
    .from(table)
    .select("id")
    .eq("pandascore_id", pandaId)
    .single();
  return data?.id ?? null;
}

export async function syncTeams(game?: string): Promise<SyncResult> {
  const supabase = getSupabaseAdmin();
  const teams = await fetchAllPages(getTeams, game);
  let synced = 0;
  let errors = 0;

  for (const team of teams) {
    const { error } = await supabase.from("esport_teams").upsert(
      {
        pandascore_id: team.id,
        name: team.name,
        slug: team.slug,
        acronym: team.acronym,
        image_url: team.image_url,
        location: team.location,
        game: team.current_videogame?.name ?? null,
      },
      { onConflict: "pandascore_id" }
    );
    if (error) {
      logger.error("syncTeams upsert error", { teamId: team.id, error });
      errors++;
    } else {
      synced++;
    }
  }

  return { synced, errors };
}

export async function syncPlayers(game?: string): Promise<SyncResult> {
  const supabase = getSupabaseAdmin();
  const players = await fetchAllPages(getPlayers, game);
  let synced = 0;
  let errors = 0;

  for (const player of players) {
    const teamId = await resolveId("esport_teams", player.current_team?.id);

    const { error } = await supabase.from("esport_players").upsert(
      {
        pandascore_id: player.id,
        name: player.name,
        slug: player.slug,
        first_name: player.first_name,
        last_name: player.last_name,
        nationality: player.nationality,
        image_url: player.image_url,
        role: player.role,
        team_id: teamId,
        game: player.current_videogame?.name ?? null,
      },
      { onConflict: "pandascore_id" }
    );
    if (error) {
      logger.error("syncPlayers upsert error", { playerId: player.id, error });
      errors++;
    } else {
      synced++;
    }
  }

  return { synced, errors };
}

export async function syncTournaments(game?: string): Promise<SyncResult> {
  const supabase = getSupabaseAdmin();
  const [running, upcoming] = await Promise.all([
    fetchAllPages(getRunningTournaments, game),
    fetchAllPages(getUpcomingTournaments, game),
  ]);
  const tournaments = [...running, ...upcoming];
  let synced = 0;
  let errors = 0;

  for (const t of tournaments) {
    const { error } = await supabase.from("esport_tournaments").upsert(
      {
        pandascore_id: t.id,
        name: t.name,
        slug: t.slug,
        begin_at: t.begin_at,
        end_at: t.end_at,
        prizepool: t.prizepool,
        tier: t.tier,
        league_name: t.league.name,
        league_image_url: t.league.image_url,
        serie_name: t.serie.name,
        game: t.videogame.name,
      },
      { onConflict: "pandascore_id" }
    );
    if (error) {
      logger.error("syncTournaments upsert error", { tournamentId: t.id, error });
      errors++;
    } else {
      synced++;
    }
  }

  return { synced, errors };
}

export async function syncMatches(game?: string): Promise<SyncResult> {
  const supabase = getSupabaseAdmin();
  const [past, running] = await Promise.all([
    fetchAllPages(getPastMatches, game),
    fetchAllPages(getRunningMatches, game),
  ]);
  const matches = [...past, ...running];
  let synced = 0;
  let errors = 0;

  for (const m of matches) {
    const [tournamentId, opponent1Id, opponent2Id, winnerId] = await Promise.all([
      resolveId("esport_tournaments", m.tournament_id),
      resolveId("esport_teams", m.opponents[0]?.opponent?.id),
      resolveId("esport_teams", m.opponents[1]?.opponent?.id),
      resolveId("esport_teams", m.winner_id),
    ]);

    const scores = m.results?.reduce(
      (acc, r) => ({ ...acc, [String(r.team_id)]: r.score }),
      {} as Record<string, number>
    ) ?? null;

    const { error } = await supabase.from("esport_matches").upsert(
      {
        pandascore_id: m.id,
        name: m.name,
        status: m.status,
        match_type: m.match_type,
        number_of_games: m.number_of_games,
        begin_at: m.begin_at,
        end_at: m.end_at,
        tournament_id: tournamentId,
        opponent1_id: opponent1Id,
        opponent2_id: opponent2Id,
        scores,
        winner_id: winnerId,
        game: m.videogame.name,
      },
      { onConflict: "pandascore_id" }
    );
    if (error) {
      logger.error("syncMatches upsert error", { matchId: m.id, error });
      errors++;
    } else {
      synced++;
    }
  }

  return { synced, errors };
}

export async function syncAll(game?: string) {
  const teams = await syncTeams(game);
  const players = await syncPlayers(game);
  const tournaments = await syncTournaments(game);
  const matches = await syncMatches(game);
  return { teams, players, tournaments, matches };
}
