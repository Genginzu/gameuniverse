import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

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

/**
 * A match currently running, exposed to the public live page.
 * Streams come from `esport_matches.streams`, populated by the PandaScore
 * sync (`streams_list`).
 */
export interface LiveStream {
  language: string;
  main: boolean;
  rawUrl: string;
}

export interface LiveMatch {
  id: number;
  name: string;
  beginAt: string | null;
  game: string;
  gameSlug: string;
  league: string;
  tournament: string;
  opponents: Array<{ id: number | null; name: string; imageUrl: string | null; score: number }>;
  streams: LiveStream[];
}

interface RawStream {
  language?: string | null;
  main?: boolean | null;
  raw_url?: string | null;
}

interface LiveMatchRow {
  id: string;
  pandascore_id: number | null;
  name: string;
  begin_at: string | null;
  game: string | null;
  opponent1_score: number | null;
  opponent2_score: number | null;
  streams: RawStream[] | null;
  esport_tournaments: { name: string | null; league_name: string | null } | null;
  opponent1: { id: string; name: string; image_url: string | null; pandascore_id: number | null } | null;
  opponent2: { id: string; name: string; image_url: string | null; pandascore_id: number | null } | null;
}

function gameSlugFor(game: string | null): string {
  return (game ?? "").toLowerCase().replace(/\s+/g, "-");
}

function mapStreams(raw: RawStream[] | null): LiveStream[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .filter((s) => typeof s?.raw_url === "string" && s.raw_url.length > 0)
    .map((s) => ({
      language: s.language ?? "",
      main: Boolean(s.main),
      rawUrl: s.raw_url as string,
    }))
    // Main streams first, then by language for stability
    .sort((a, b) => Number(b.main) - Number(a.main) || a.language.localeCompare(b.language));
}

function mapLiveMatch(row: LiveMatchRow): LiveMatch | null {
  if (row.pandascore_id === null || row.pandascore_id === undefined) return null;

  const opponents: LiveMatch["opponents"] = [];
  if (row.opponent1) {
    opponents.push({
      id: row.opponent1.pandascore_id,
      name: row.opponent1.name,
      imageUrl: row.opponent1.image_url,
      score: row.opponent1_score ?? 0,
    });
  }
  if (row.opponent2) {
    opponents.push({
      id: row.opponent2.pandascore_id,
      name: row.opponent2.name,
      imageUrl: row.opponent2.image_url,
      score: row.opponent2_score ?? 0,
    });
  }

  return {
    id: row.pandascore_id,
    name: row.name,
    beginAt: row.begin_at,
    game: row.game ?? "",
    gameSlug: gameSlugFor(row.game),
    league: row.esport_tournaments?.league_name ?? "",
    tournament: row.esport_tournaments?.name ?? "",
    opponents,
    streams: mapStreams(row.streams),
  };
}

/**
 * Fetch matches currently running (`status = 'running'`) from the local DB.
 *
 * @param filters.game Case-insensitive exact match on the videogame name.
 */
export async function getLiveMatches(filters?: { game?: string }): Promise<LiveMatch[]> {
  const gameFilter = filters?.game;
  const cacheKey = `live:${gameFilter ?? "all"}`;

  const cached = getCached<LiveMatch[]>(cacheKey);
  if (cached) return cached;

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("esport_matches" as UntypedFrom)
      .select(
        `id, pandascore_id, name, begin_at, game,
         opponent1_score, opponent2_score, streams,
         esport_tournaments(name, league_name),
         opponent1:esport_teams!esport_matches_opponent1_id_fkey(id, name, image_url, pandascore_id),
         opponent2:esport_teams!esport_matches_opponent2_id_fkey(id, name, image_url, pandascore_id)`
      )
      .eq("status", "running")
      .order("begin_at", { ascending: true, nullsFirst: false })
      .limit(50);

    if (gameFilter) {
      query = query.eq("game", gameFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    const matches = ((data as LiveMatchRow[] | null) ?? [])
      .map(mapLiveMatch)
      .filter((m): m is LiveMatch => m !== null);

    setCache(cacheKey, matches);
    return matches;
  } catch (error) {
    logger.error("Failed to fetch live matches from DB", { error });
    throw error;
  }
}
