import {
  getTeams,
  getPlayers,
  getRunningTournaments,
  getUpcomingTournaments,
  getPastMatches,
  getRunningMatches,
} from "@/lib/pandascore/client";
import {
  bulkUpsert,
  fetchAllPages,
  preloadIdMap,
  DEFAULT_MAX_PAGES,
} from "./pandascore-sync-helpers";

type SyncResult = { synced: number; errors: number };

export async function syncTeams(game?: string): Promise<SyncResult> {
  const teams = await fetchAllPages(getTeams, { game, maxPages: DEFAULT_MAX_PAGES, label: "teams" });
  const rows = teams.map((t) => ({
    pandascore_id: t.id,
    name: t.name,
    slug: t.slug,
    acronym: t.acronym,
    image_url: t.image_url,
    location: t.location,
    game: t.current_videogame?.name ?? null,
  }));
  return bulkUpsert("esport_teams", rows, "pandascore_id");
}

export async function syncPlayers(game?: string): Promise<SyncResult> {
  const players = await fetchAllPages(getPlayers, { game, maxPages: DEFAULT_MAX_PAGES, label: "players" });

  // Resolve all team references in one query
  const teamPandaIds = players
    .map((p) => p.current_team?.id)
    .filter((id): id is number => typeof id === "number");
  const teamMap = await preloadIdMap("esport_teams", teamPandaIds);

  const rows = players.map((p) => ({
    pandascore_id: p.id,
    name: p.name,
    slug: p.slug,
    first_name: p.first_name,
    last_name: p.last_name,
    nationality: p.nationality,
    image_url: p.image_url,
    role: p.role,
    team_id: p.current_team?.id ? teamMap.get(p.current_team.id) ?? null : null,
    game: p.current_videogame?.name ?? null,
  }));
  return bulkUpsert("esport_players", rows, "pandascore_id");
}

export async function syncTournaments(game?: string): Promise<SyncResult> {
  const [running, upcoming] = await Promise.all([
    fetchAllPages(getRunningTournaments, { game, maxPages: DEFAULT_MAX_PAGES, label: "tournaments-running" }),
    fetchAllPages(getUpcomingTournaments, { game, maxPages: DEFAULT_MAX_PAGES, label: "tournaments-upcoming" }),
  ]);
  const tournaments = [...running, ...upcoming];

  const rows = tournaments.map((t) => ({
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
  }));
  return bulkUpsert("esport_tournaments", rows, "pandascore_id");
}

export async function syncMatches(game?: string): Promise<SyncResult> {
  const [past, running] = await Promise.all([
    fetchAllPages(getPastMatches, { game, maxPages: DEFAULT_MAX_PAGES, label: "matches-past" }),
    fetchAllPages(getRunningMatches, { game, maxPages: DEFAULT_MAX_PAGES, label: "matches-running" }),
  ]);
  const matches = [...past, ...running];

  // Collect all panda IDs we need to resolve, in two single queries
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

  const rows = matches.map((m) => {
    const scores = m.results?.reduce(
      (acc, r) => ({ ...acc, [String(r.team_id)]: r.score }),
      {} as Record<string, number>,
    ) ?? null;

    return {
      pandascore_id: m.id,
      name: m.name,
      status: m.status,
      match_type: m.match_type,
      number_of_games: m.number_of_games,
      begin_at: m.begin_at,
      end_at: m.end_at,
      tournament_id: tournamentMap.get(m.tournament_id) ?? null,
      opponent1_id: m.opponents[0]?.opponent?.id ? teamMap.get(m.opponents[0].opponent.id) ?? null : null,
      opponent2_id: m.opponents[1]?.opponent?.id ? teamMap.get(m.opponents[1].opponent.id) ?? null : null,
      scores,
      winner_id: m.winner_id ? teamMap.get(m.winner_id) ?? null : null,
      game: m.videogame.name,
      streams: m.streams_list ?? null,
    };
  });

  return bulkUpsert("esport_matches", rows, "pandascore_id");
}

export async function syncAll(game?: string) {
  const teams = await syncTeams(game);
  const players = await syncPlayers(game);
  const tournaments = await syncTournaments(game);
  const matches = await syncMatches(game);
  return { teams, players, tournaments, matches };
}
