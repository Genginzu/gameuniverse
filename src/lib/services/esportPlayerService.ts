import { logger } from "@/lib/logger";
import { getPlayers, getPlayerById } from "@/lib/pandascore/client";
import type { PandaScorePlayer } from "@/lib/pandascore/types";

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

export interface EsportPlayerSummary {
  id: number;
  name: string;
  slug: string;
  firstName: string | null;
  lastName: string | null;
  nationality: string | null;
  imageUrl: string | null;
  role: string | null;
  teamName: string | null;
  game: string | null;
}

export interface EsportPlayerDetail extends EsportPlayerSummary {
  teamImageUrl: string | null;
}

function mapPlayerSummary(p: PandaScorePlayer): EsportPlayerSummary {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    firstName: p.first_name,
    lastName: p.last_name,
    nationality: p.nationality,
    imageUrl: p.image_url,
    role: p.role,
    teamName: p.current_team?.name ?? null,
    game: p.current_videogame?.name ?? null,
  };
}

export async function getPlayersList(filters?: {
  search?: string;
  per_page?: number;
}): Promise<EsportPlayerSummary[]> {
  const search = filters?.search;
  const perPage = filters?.per_page ?? 25;
  const cacheKey = `esport-players:${search ?? "all"}:${perPage}`;

  const cached = getCached<EsportPlayerSummary[]>(cacheKey);
  if (cached) return cached;

  try {
    const params: Record<string, string | number> = {
      per_page: perPage,
      sort: "name",
    };
    if (search) params["search[name]"] = search;

    const players = await getPlayers(params);
    const mapped = players.map(mapPlayerSummary);
    setCache(cacheKey, mapped);
    return mapped;
  } catch (error) {
    logger.error("Failed to fetch esport players", { error });
    throw error;
  }
}

export async function getPlayerDetail(id: number): Promise<EsportPlayerDetail> {
  const cacheKey = `esport-player:${id}`;

  const cached = getCached<EsportPlayerDetail>(cacheKey);
  if (cached) return cached;

  try {
    const player = await getPlayerById(id);
    const detail: EsportPlayerDetail = {
      ...mapPlayerSummary(player),
      teamImageUrl: player.current_team?.image_url ?? null,
    };
    setCache(cacheKey, detail);
    return detail;
  } catch (error) {
    logger.error("Failed to fetch esport player detail", { error, id });
    throw error;
  }
}
