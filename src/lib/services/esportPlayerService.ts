import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { TtlCache } from "./esport/ttlCache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

const cache = new TtlCache(5 * 60 * 1000);
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

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

/** Paginated listing response. */
export interface EsportPlayerListing {
  players: EsportPlayerSummary[];
  total: number;
  page: number;
  limit: number;
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
 * Fetch a paginated, optionally filtered list of esport players from the DB.
 * Total count is computed via `count: 'exact'` in the same query.
 *
 * @param filters.search Case-insensitive partial match on the player's name.
 * @param filters.game Case-insensitive exact match on the player's game.
 * @param filters.page 1-based page index (default 1).
 * @param filters.limit Page size (default 25, capped at 100).
 */
export async function getPlayersList(filters?: {
  search?: string;
  game?: string;
  page?: number;
  limit?: number;
}): Promise<EsportPlayerListing> {
  const search = filters?.search?.trim();
  const game = filters?.game?.trim();
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, filters?.limit ?? DEFAULT_PAGE_SIZE));

  const cacheKey = `esport-players:${search ?? ""}:${game ?? ""}:${page}:${limit}`;
  const cached = cache.get<EsportPlayerListing>(cacheKey);
  if (cached) return cached;

  try {
    const supabase = getSupabaseAdmin();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("esport_players" as UntypedFrom)
      .select(
        "id, pandascore_id, name, slug, first_name, last_name, nationality, image_url, role, game, esport_teams(name, image_url)",
        { count: "exact" }
      )
      // Players with an image first, then alphabetical by name. Postgres
      // sorts NULLs last by default with ASC, but image_url is a TEXT column
      // where missing values can be NULL; we make the intent explicit so the
      // ordering is deterministic regardless of the storage representation.
      .order("image_url", { ascending: false, nullsFirst: false })
      .order("name", { ascending: true })
      .range(from, to);

    if (search) query = query.ilike("name", `%${search}%`);
    if (game) query = query.eq("game", game);

    const { data, count, error } = await query;
    if (error) throw error;

    const players = ((data as PlayerRow[] | null) ?? [])
      .map(mapPlayerSummary)
      .filter((p): p is EsportPlayerSummary => p !== null);

    const result: EsportPlayerListing = {
      players,
      total: count ?? 0,
      page,
      limit,
    };
    cache.set(cacheKey, result);
    return result;
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
  const cached = cache.get<EsportPlayerDetail>(cacheKey);
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
    cache.set(cacheKey, detail);
    return detail;
  } catch (error) {
    logger.error("Failed to fetch esport player detail from DB", { error, id });
    throw error;
  }
}

/**
 * Get the distinct list of games represented in the players table.
 * Used to populate the filter chips on the listing page.
 */
export async function getPlayersGames(): Promise<string[]> {
  const cacheKey = "esport-players:games";
  const cached = cache.get<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const supabase = getSupabaseAdmin();
    // PostgREST has no DISTINCT, so we pull the column and dedupe in memory.
    // The dataset is small (a few thousand rows max) and cached for 5 minutes.
    const { data, error } = await supabase
      .from("esport_players" as UntypedFrom)
      .select("game")
      .not("game", "is", null);

    if (error) throw error;

    const games = Array.from(
      new Set(
        ((data as { game: string | null }[] | null) ?? [])
          .map((r) => r.game)
          .filter((g): g is string => typeof g === "string" && g.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    cache.set(cacheKey, games);
    return games;
  } catch (error) {
    logger.error("Failed to fetch player games from DB", { error });
    throw error;
  }
}
