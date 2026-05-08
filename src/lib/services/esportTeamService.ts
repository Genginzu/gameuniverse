import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

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

/** Public-facing summary used on the listing page. */
export interface EsportTeamSummary {
  /** PandaScore numeric ID — teams without one are filtered out. */
  id: number;
  name: string;
  slug: string;
  acronym: string | null;
  imageUrl: string | null;
  location: string | null;
  game: string | null;
}

/** Detail page payload, including the team's roster. */
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

interface TeamRow {
  id: string;
  pandascore_id: number | null;
  name: string;
  slug: string;
  acronym: string | null;
  image_url: string | null;
  location: string | null;
  game: string | null;
}

interface PlayerRosterRow {
  id: string;
  pandascore_id: number | null;
  name: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  role: string | null;
  nationality: string | null;
}

function mapTeamSummary(row: TeamRow): EsportTeamSummary | null {
  if (row.pandascore_id === null || row.pandascore_id === undefined) return null;
  return {
    id: row.pandascore_id,
    name: row.name,
    slug: row.slug,
    acronym: row.acronym,
    imageUrl: row.image_url,
    location: row.location,
    game: row.game,
  };
}

/**
 * Fetch the public list of esport teams from the local DB.
 *
 * @param filters.search Case-insensitive partial match on the team's name.
 * @param filters.per_page Maximum number of results (default 100).
 */
export async function getTeamsList(filters?: {
  search?: string;
  per_page?: number;
}): Promise<EsportTeamSummary[]> {
  const search = filters?.search?.trim();
  const perPage = filters?.per_page ?? 100;
  const cacheKey = `teams:${search ?? "all"}:${perPage}`;

  const cached = getCached<EsportTeamSummary[]>(cacheKey);
  if (cached) return cached;

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("esport_teams" as UntypedFrom)
      .select("id, pandascore_id, name, slug, acronym, image_url, location, game")
      .order("name", { ascending: true })
      .limit(perPage);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const mapped = ((data as TeamRow[] | null) ?? [])
      .map(mapTeamSummary)
      .filter((t): t is EsportTeamSummary => t !== null);
    setCache(cacheKey, mapped);
    return mapped;
  } catch (error) {
    logger.error("Failed to fetch esport teams from DB", { error });
    throw error;
  }
}

/**
 * Fetch a single esport team by PandaScore numeric ID, including the roster
 * of players currently associated with the team via `team_id`.
 */
export async function getTeamDetail(id: number): Promise<EsportTeamDetail | null> {
  const cacheKey = `team:${id}`;
  const cached = getCached<EsportTeamDetail>(cacheKey);
  if (cached) return cached;

  try {
    const supabase = getSupabaseAdmin();

    const { data: teamRows, error: teamError } = await supabase
      .from("esport_teams" as UntypedFrom)
      .select("id, pandascore_id, name, slug, acronym, image_url, location, game")
      .eq("pandascore_id", id)
      .limit(1);

    if (teamError) throw teamError;
    const teams = (teamRows as TeamRow[] | null) ?? [];
    if (teams.length === 0) return null;

    const teamRow = teams[0];
    const summary = mapTeamSummary(teamRow);
    if (!summary) return null;

    const { data: playerRows, error: playerError } = await supabase
      .from("esport_players" as UntypedFrom)
      .select("id, pandascore_id, name, first_name, last_name, image_url, role, nationality")
      .eq("team_id", teamRow.id)
      .order("name", { ascending: true });

    if (playerError) throw playerError;

    const players = ((playerRows as PlayerRosterRow[] | null) ?? [])
      .filter((p) => p.pandascore_id !== null && p.pandascore_id !== undefined)
      .map((p) => ({
        id: p.pandascore_id as number,
        name: p.name,
        firstName: p.first_name,
        lastName: p.last_name,
        imageUrl: p.image_url,
        role: p.role,
        nationality: p.nationality,
      }));

    const detail: EsportTeamDetail = { ...summary, players };
    setCache(cacheKey, detail);
    return detail;
  } catch (error) {
    logger.error("Failed to fetch esport team detail from DB", { error, id });
    throw error;
  }
}
