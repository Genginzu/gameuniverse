import { logger } from "@/lib/logger";
import { getPastTournaments, getPastMatches } from "@/lib/pandascore/client";
import type {
  PandaScoreTournament,
  PandaScoreMatch,
  PandaScoreOpponent,
  PandaScoreTeam,
} from "@/lib/pandascore/types";

const CACHE_TTL_MS = 15 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export interface ResultTournament {
  id: number;
  name: string;
  slug: string;
  beginAt: string | null;
  endAt: string | null;
  game: string;
  gameSlug: string;
  league: string;
  leagueImageUrl: string | null;
  prizepool: string | null;
  tier: string;
  winnerId: number | null;
}

export interface ResultMatch {
  id: number;
  name: string;
  status: string;
  beginAt: string | null;
  game: string;
  gameSlug: string;
  league: string;
  tournament: string;
  opponents: Array<{ name: string; imageUrl: string | null; score: number }>;
  winnerId: number | null;
}

function mapResultTournament(t: PandaScoreTournament): ResultTournament {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    beginAt: t.begin_at,
    endAt: t.end_at,
    game: t.videogame.name,
    gameSlug: t.videogame.slug,
    league: t.league.name,
    leagueImageUrl: t.league.image_url,
    prizepool: t.prizepool,
    tier: t.tier,
    winnerId: t.winner_id,
  };
}

function opponentName(o: PandaScoreOpponent): string {
  return o.type === "Team" ? (o.opponent as PandaScoreTeam).name : o.opponent.name;
}

function opponentImage(o: PandaScoreOpponent): string | null {
  return o.type === "Team" ? (o.opponent as PandaScoreTeam).image_url : null;
}

function mapResultMatch(m: PandaScoreMatch): ResultMatch {
  const scores = new Map(m.results.map((r) => [r.team_id, r.score]));
  return {
    id: m.id,
    name: m.name,
    status: m.status,
    beginAt: m.begin_at,
    game: m.videogame.name,
    gameSlug: m.videogame.slug,
    league: m.league.name,
    tournament: m.tournament.name,
    opponents: m.opponents.map((o) => ({
      name: opponentName(o),
      imageUrl: opponentImage(o),
      score: scores.get(o.opponent.id) ?? 0,
    })),
    winnerId: m.winner_id,
  };
}

export async function getRecentResults(filters?: {
  game?: string;
  per_page?: number;
}): Promise<{ tournaments: ResultTournament[]; matches: ResultMatch[] }> {
  const gameFilter = filters?.game;
  const perPage = filters?.per_page ?? 20;
  const cacheKey = `results:${gameFilter ?? "all"}:${perPage}`;

  const cached = getCached<{ tournaments: ResultTournament[]; matches: ResultMatch[] }>(cacheKey);
  if (cached) return cached;

  try {
    const params: Record<string, string | number> = {
      per_page: perPage,
      sort: "-begin_at",
    };
    if (gameFilter) params["filter[videogame_title]"] = gameFilter;

    const [tournaments, matches] = await Promise.all([
      getPastTournaments(params),
      getPastMatches({ ...params, "filter[status]": "finished" }),
    ]);

    const result = {
      tournaments: tournaments.map(mapResultTournament),
      matches: matches.map(mapResultMatch),
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    logger.error("Failed to fetch esport results", { error });
    throw error;
  }
}
