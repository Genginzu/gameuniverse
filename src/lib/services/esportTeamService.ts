import { logger } from "@/lib/logger";
import { getTeams, getTeamById } from "@/lib/pandascore/client";
import type { PandaScoreTeam } from "@/lib/pandascore/types";

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

export interface EsportTeamSummary {
  id: number;
  name: string;
  slug: string;
  acronym: string | null;
  imageUrl: string | null;
  location: string | null;
  game: string | null;
}

export interface EsportTeamDetail extends EsportTeamSummary {
  players: Array<{
    id: number;
    name: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    role: string | null;
    nationality: string | null;
  }>;
}

function mapTeamSummary(t: PandaScoreTeam): EsportTeamSummary {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    acronym: t.acronym,
    imageUrl: t.image_url,
    location: t.location,
    game: t.current_videogame?.name ?? null,
  };
}

export async function getTeamsList(filters?: {
  search?: string;
  per_page?: number;
}): Promise<EsportTeamSummary[]> {
  const search = filters?.search;
  const perPage = filters?.per_page ?? 25;
  const cacheKey = `teams:${search ?? "all"}:${perPage}`;

  const cached = getCached<EsportTeamSummary[]>(cacheKey);
  if (cached) return cached;

  try {
    const params: Record<string, string | number> = {
      per_page: perPage,
      sort: "name",
    };
    if (search) params["search[name]"] = search;

    const teams = await getTeams(params);
    const mapped = teams.map(mapTeamSummary);
    setCache(cacheKey, mapped);
    return mapped;
  } catch (error) {
    logger.error("Failed to fetch esport teams", { error });
    throw error;
  }
}

export async function getTeamDetail(id: number): Promise<EsportTeamDetail> {
  const cacheKey = `team:${id}`;

  const cached = getCached<EsportTeamDetail>(cacheKey);
  if (cached) return cached;

  try {
    const team = await getTeamById(id);
    const detail: EsportTeamDetail = {
      ...mapTeamSummary(team),
      players: (team as unknown as Record<string, unknown>).players
        ? ((team as unknown as Record<string, unknown>).players as Array<Record<string, unknown>>).map(
            (p) => ({
              id: p.id as number,
              name: p.name as string,
              firstName: (p.first_name as string) ?? null,
              lastName: (p.last_name as string) ?? null,
              imageUrl: (p.image_url as string) ?? null,
              role: (p.role as string) ?? null,
              nationality: (p.nationality as string) ?? null,
            })
          )
        : [],
    };
    setCache(cacheKey, detail);
    return detail;
  } catch (error) {
    logger.error("Failed to fetch esport team detail", { error, id });
    throw error;
  }
}
