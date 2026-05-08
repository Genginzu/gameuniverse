import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

const CACHE_TTL_MS = 5 * 60 * 1000;

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

/** Public-facing summary used on the listing page. */
export interface EsportPlayerSummary {
  /** PandaScore numeric ID. Players without a pandascore_id are filtered out. */
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

/** Detail page payload, including the team's image. */
export interface EsportPlayerDetail extends EsportPlayerSummary {
  teamImageUrl: string | null;
}

interface PlayerRow {
  id: string;
  pandascore_id: number | null;
  name: string;
  slug: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  image_url: string | null;
  role: string | null;
  game: string | null;
  esport_teams: { name: string | null; image_url: string | null } | null;
}

function mapPlayerSummary(row: PlayerRow): EsportPlayerSummary | null {
  if (row.pandascore_id === null || row.pandascore_id === undefined) return null;
  return {
    id: row.pandascore_id,
    name: row.name,
    slug: row.slug,
    firstName: row.first_name,
    lastName: row.last_name,
    nationality: row.nationality,
    imageUrl: row.image_url,
    role: row.role,
    teamName: row.esport_teams?.name ?? null,
    game: row.game,
  };
}

/**
 * Fetch the public list of esport players from the local DB (synced from
 * PandaScore by the admin sync workflow).
 *
 * @param filters.search Case-insensitive partial match on the player's name.
 * @param filters.per_page Maximum number of results (default 100).
 */
export async function getPlayersList(filters?: {
  search?: string;
  per_page?: number;
}): Promise<EsportPlayerSummary[]> {
  const search = filters?.search?.trim();
  const perPage = filters?.per_page ?? 100;
  const cacheKey = `esport-players:${search ?? "all"}:${perPage}`;

  const cached = getCached<EsportPlayerSummary[]>(cacheKey);
  if (cached) return cached;

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("esport_players" as UntypedFrom)
      .select("id, pandascore_id, name, slug, first_name, last_name, nationality, image_url, role, game, esport_teams(name, image_url)")
      .order("name", { ascending: true })
      .limit(perPage);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const mapped = (data as PlayerRow[] | null ?? [])
      .map(mapPlayerSummary)
      .filter((p): p is EsportPlayerSummary => p !== null);
    setCache(cacheKey, mapped);
    return mapped;
  } catch (error) {
    logger.error("Failed to fetch esport players from DB", { error });
    throw error;
  }
}

/**
 * Fetch a single esport player by PandaScore numeric ID (preferred) or by
 * local UUID. Returns the team's image alongside basic info.
 */
export async function getPlayerDetail(id: number | string): Promise<EsportPlayerDetail | null> {
  const cacheKey = `esport-player:${id}`;
  const cached = getCached<EsportPlayerDetail>(cacheKey);
  if (cached) return cached;

  try {
    const supabase = getSupabaseAdmin();
    const numericId = typeof id === "number" ? id : parseInt(id, 10);
    const isNumeric = !isNaN(numericId);

    const query = supabase
      .from("esport_players" as UntypedFrom)
      .select(
        "id, pandascore_id, name, slug, first_name, last_name, nationality, image_url, role, game, esport_teams(name, image_url)"
      )
      .limit(1);

    const { data, error } = isNumeric
      ? await query.eq("pandascore_id", numericId)
      : await query.eq("id", id);

    if (error) throw error;
    const rows = (data as PlayerRow[] | null) ?? [];
    if (rows.length === 0) return null;

    const summary = mapPlayerSummary(rows[0]);
    if (!summary) return null;
    const detail: EsportPlayerDetail = {
      ...summary,
      teamImageUrl: rows[0].esport_teams?.image_url ?? null,
    };
    setCache(cacheKey, detail);
    return detail;
  } catch (error) {
    logger.error("Failed to fetch esport player detail from DB", { error, id });
    throw error;
  }
}
