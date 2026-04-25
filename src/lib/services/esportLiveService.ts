import { logger } from "@/lib/logger";
import { getRunningMatches } from "@/lib/pandascore/client";
import type { PandaScoreMatch, PandaScoreStream } from "@/lib/pandascore/types";

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes for live data

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

export interface LiveStream {
  matchId: number;
  matchName: string;
  game: string;
  gameSlug: string;
  league: string;
  streamUrl: string;
  language: string;
  isMain: boolean;
  opponents: string[];
}

function extractStreams(match: PandaScoreMatch): LiveStream[] {
  if (!match.streams_list?.length) return [];

  const opponents = match.opponents.map((o) => o.opponent.name);

  return match.streams_list.map((stream: PandaScoreStream) => ({
    matchId: match.id,
    matchName: match.name,
    game: match.videogame.name,
    gameSlug: match.videogame.slug,
    league: match.league.name,
    streamUrl: stream.raw_url,
    language: stream.language,
    isMain: stream.main,
    opponents,
  }));
}

export async function getLiveStreams(filters?: {
  game?: string;
}): Promise<LiveStream[]> {
  const gameFilter = filters?.game;
  const cacheKey = `live:${gameFilter ?? "all"}`;

  const cached = getCached<LiveStream[]>(cacheKey);
  if (cached) return cached;

  try {
    const params: Record<string, string | number> = {
      per_page: 50,
      sort: "-begin_at",
    };
    if (gameFilter) params["filter[videogame_title]"] = gameFilter;

    const matches = await getRunningMatches(params);
    const streams = matches.flatMap(extractStreams);

    // Main streams first
    streams.sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0));

    setCache(cacheKey, streams);
    return streams;
  } catch (error) {
    logger.error("Failed to fetch live streams", { error });
    throw error;
  }
}
