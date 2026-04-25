import { logger } from "@/lib/logger";
import { getUpcomingTournaments, getRunningTournaments } from "@/lib/pandascore/client";
import type { PandaScoreTournament } from "@/lib/pandascore/types";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

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

export interface CalendarTournament {
  id: number;
  name: string;
  slug: string;
  beginAt: string | null;
  endAt: string | null;
  game: string;
  gameSlug: string;
  league: string;
  leagueImageUrl: string | null;
  serie: string;
  prizepool: string | null;
  tier: string;
  status: "upcoming" | "running";
}

function mapTournament(
  t: PandaScoreTournament,
  status: "upcoming" | "running"
): CalendarTournament {
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
    serie: t.serie.full_name,
    prizepool: t.prizepool,
    tier: t.tier,
    status,
  };
}

/** Fetch upcoming + running tournaments, merged and sorted by begin_at */
export async function getCalendarTournaments(filters?: {
  game?: string;
  per_page?: number;
}): Promise<CalendarTournament[]> {
  const gameFilter = filters?.game;
  const perPage = filters?.per_page ?? 50;
  const cacheKey = `calendar:${gameFilter ?? "all"}:${perPage}`;

  const cached = getCached<CalendarTournament[]>(cacheKey);
  if (cached) return cached;

  try {
    const params: Record<string, string | number> = {
      per_page: perPage,
      sort: "begin_at",
    };
    if (gameFilter) params["filter[videogame_title]"] = gameFilter;

    const [upcoming, running] = await Promise.all([
      getUpcomingTournaments(params),
      getRunningTournaments(params),
    ]);

    const tournaments = [
      ...running.map((t) => mapTournament(t, "running")),
      ...upcoming.map((t) => mapTournament(t, "upcoming")),
    ];

    setCache(cacheKey, tournaments);
    return tournaments;
  } catch (error) {
    logger.error("Failed to fetch calendar tournaments", { error });
    throw error;
  }
}

/** Get the list of videogame names present in the current calendar */
export async function getCalendarGames(): Promise<string[]> {
  const tournaments = await getCalendarTournaments({ per_page: 100 });
  const games = [...new Set(tournaments.map((t) => t.game))];
  return games.sort();
}
