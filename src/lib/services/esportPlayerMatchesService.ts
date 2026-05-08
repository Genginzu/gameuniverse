import { logger } from "@/lib/logger";
import { getMatches } from "@/lib/pandascore/client";
import type { PandaScoreMatch, PandaScoreOpponent, PandaScoreTeam } from "@/lib/pandascore/types";

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

export interface PlayerMatch {
  id: number;
  name: string;
  status: string;
  beginAt: string | null;
  game: string;
  gameSlug: string;
  league: string;
  tournament: string;
  opponents: Array<{ id: number; name: string; imageUrl: string | null; score: number }>;
  winnerId: number | null;
}

function opponentName(o: PandaScoreOpponent): string {
  return o.type === "Team" ? (o.opponent as PandaScoreTeam).name : o.opponent.name;
}

function opponentImage(o: PandaScoreOpponent): string | null {
  return o.type === "Team" ? (o.opponent as PandaScoreTeam).image_url : null;
}

function mapMatch(m: PandaScoreMatch): PlayerMatch {
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
      id: o.opponent.id,
      name: opponentName(o),
      imageUrl: opponentImage(o),
      score: scores.get(o.opponent.id) ?? 0,
    })),
    winnerId: m.winner_id,
  };
}

/**
 * Recent matches involving a given player.
 * Uses PandaScore filter[player_id] and sorts by `-begin_at` (most recent first).
 */
export async function getPlayerRecentMatches(
  playerId: number,
  perPage = 5
): Promise<PlayerMatch[]> {
  const cacheKey = `esport-player-matches:${playerId}:${perPage}`;
  const cached = getCached<PlayerMatch[]>(cacheKey);
  if (cached) return cached;

  try {
    const matches = await getMatches({
      "filter[player_id]": playerId,
      per_page: perPage,
      sort: "-begin_at",
    });
    const mapped = matches.map(mapMatch);
    setCache(cacheKey, mapped);
    return mapped;
  } catch (error) {
    logger.error("Failed to fetch player recent matches", { error, playerId });
    throw error;
  }
}
