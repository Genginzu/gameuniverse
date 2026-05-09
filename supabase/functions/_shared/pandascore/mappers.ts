/**
 * Mappers from PandaScore objects to Supabase rows.
 *
 * These are pure functions extracted from the inline `.map()` blocks in
 * src/lib/services/pandascoreSyncService.ts and the cron route. Keeping
 * them together makes the Edge Function handlers easier to read and tests
 * trivial to add later.
 */

import type {
  PandaScoreMatch,
  PandaScorePlayer,
  PandaScoreTeam,
  PandaScoreTournament,
} from "./types.ts";

export function mapTeam(t: PandaScoreTeam): Record<string, unknown> {
  return {
    pandascore_id: t.id,
    name: t.name,
    slug: t.slug,
    acronym: t.acronym,
    image_url: t.image_url,
    location: t.location,
    game: t.current_videogame?.name ?? null,
  };
}

export function mapTournament(t: PandaScoreTournament): Record<string, unknown> {
  return {
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
  };
}

export function mapPlayer(
  p: PandaScorePlayer,
  teamMap: Map<number, string>,
): Record<string, unknown> {
  return {
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
  };
}

export function mapMatch(
  m: PandaScoreMatch,
  tournamentMap: Map<number, string>,
  teamMap: Map<number, string>,
): Record<string, unknown> {
  const scores =
    m.results?.reduce(
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
    opponent1_id: m.opponents[0]?.opponent?.id
      ? teamMap.get(m.opponents[0].opponent.id) ?? null
      : null,
    opponent2_id: m.opponents[1]?.opponent?.id
      ? teamMap.get(m.opponents[1].opponent.id) ?? null
      : null,
    scores,
    winner_id: m.winner_id ? teamMap.get(m.winner_id) ?? null : null,
    game: m.videogame.name,
    streams: m.streams_list ?? null,
  };
}
