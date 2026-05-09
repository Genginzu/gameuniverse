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
  // PandaScore returns scores as `[{team_id, score}, ...]`. Our table
  // stores them per slot (opponent1_score, opponent2_score) so we look
  // up each side's PandaScore team id and pull the matching score.
  const opp1PandaId = m.opponents[0]?.opponent?.id ?? null;
  const opp2PandaId = m.opponents[1]?.opponent?.id ?? null;
  const findScore = (pandaId: number | null): number | null => {
    if (pandaId === null) return null;
    const r = m.results?.find((x) => x.team_id === pandaId);
    return r?.score ?? null;
  };

  return {
    pandascore_id: m.id,
    name: m.name,
    status: m.status,
    match_type: m.match_type,
    number_of_games: m.number_of_games,
    begin_at: m.begin_at,
    end_at: m.end_at,
    tournament_id: tournamentMap.get(m.tournament_id) ?? null,
    opponent1_id: opp1PandaId ? teamMap.get(opp1PandaId) ?? null : null,
    opponent1_score: findScore(opp1PandaId),
    opponent2_id: opp2PandaId ? teamMap.get(opp2PandaId) ?? null : null,
    opponent2_score: findScore(opp2PandaId),
    winner_id: m.winner_id ? teamMap.get(m.winner_id) ?? null : null,
    game: m.videogame.name,
    streams: m.streams_list ?? null,
  };
}
