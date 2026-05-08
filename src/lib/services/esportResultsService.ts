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
  /** Public ID (PandaScore) of the winning team, when known. */
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
  /** Public ID (PandaScore) of the winning team, when known. */
  winnerId: number | null;
}

interface TournamentRow {
  id: string;
  pandascore_id: number | null;
  name: string;
  slug: string;
  begin_at: string | null;
  end_at: string | null;
  game: string | null;
  league_name: string | null;
  league_image_url: string | null;
  prizepool: string | null;
  tier: string | null;
  winner_id: string | null;
  winner_team: { pandascore_id: number | null } | null;
}

interface MatchRow {
  id: string;
  pandascore_id: number | null;
  name: string;
  status: string;
  begin_at: string | null;
  game: string | null;
  winner_id: string | null;
  opponent1_score: number | null;
  opponent2_score: number | null;
  esport_tournaments: { name: string | null; league_name: string | null } | null;
  opponent1: { id: string; name: string; image_url: string | null; pandascore_id: number | null } | null;
  opponent2: { id: string; name: string; image_url: string | null; pandascore_id: number | null } | null;
}

function gameSlugFor(game: string | null): string {
  return (game ?? "").toLowerCase().replace(/\s+/g, "-");
}

function mapTournament(row: TournamentRow): ResultTournament | null {
  if (row.pandascore_id === null || row.pandascore_id === undefined) return null;
  const game = row.game ?? "";
  return {
    id: row.pandascore_id,
    name: row.name,
    slug: row.slug,
    beginAt: row.begin_at,
    endAt: row.end_at,
    game,
    gameSlug: gameSlugFor(row.game),
    league: row.league_name ?? "",
    leagueImageUrl: row.league_image_url,
    prizepool: row.prizepool,
    tier: row.tier ?? "unranked",
    winnerId: row.winner_team?.pandascore_id ?? null,
  };
}

function mapMatch(row: MatchRow): ResultMatch | null {
  if (row.pandascore_id === null || row.pandascore_id === undefined) return null;
  const opponents: Array<{ name: string; imageUrl: string | null; score: number }> = [];
  if (row.opponent1) {
    opponents.push({
      name: row.opponent1.name,
      imageUrl: row.opponent1.image_url,
      score: row.opponent1_score ?? 0,
    });
  }
  if (row.opponent2) {
    opponents.push({
      name: row.opponent2.name,
      imageUrl: row.opponent2.image_url,
      score: row.opponent2_score ?? 0,
    });
  }

  let winnerPublicId: number | null = null;
  if (row.winner_id && row.opponent1?.id === row.winner_id) {
    winnerPublicId = row.opponent1?.pandascore_id ?? null;
  } else if (row.winner_id && row.opponent2?.id === row.winner_id) {
    winnerPublicId = row.opponent2?.pandascore_id ?? null;
  }

  return {
    id: row.pandascore_id,
    name: row.name,
    status: row.status,
    beginAt: row.begin_at,
    game: row.game ?? "",
    gameSlug: gameSlugFor(row.game),
    league: row.esport_tournaments?.league_name ?? "",
    tournament: row.esport_tournaments?.name ?? "",
    opponents,
    winnerId: winnerPublicId,
  };
}

/**
 * Fetch recent past tournaments and finished matches from the local DB.
 *
 * @param filters.game Case-insensitive exact match on the videogame name.
 * @param filters.per_page Per-list limit (default 20 each).
 */
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
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    let tournamentQuery = supabase
      .from("esport_tournaments" as UntypedFrom)
      .select(
        "id, pandascore_id, name, slug, begin_at, end_at, game, league_name, league_image_url, prizepool, tier, winner_id, winner_team:esport_teams!esport_tournaments_winner_id_fkey(pandascore_id)"
      )
      .lt("end_at", now)
      .not("end_at", "is", null)
      .order("end_at", { ascending: false })
      .limit(perPage);

    let matchQuery = supabase
      .from("esport_matches" as UntypedFrom)
      .select(
        `id, pandascore_id, name, status, begin_at, game, winner_id,
         opponent1_score, opponent2_score,
         esport_tournaments(name, league_name),
         opponent1:esport_teams!esport_matches_opponent1_id_fkey(id, name, image_url, pandascore_id),
         opponent2:esport_teams!esport_matches_opponent2_id_fkey(id, name, image_url, pandascore_id)`
      )
      .eq("status", "finished")
      .order("begin_at", { ascending: false, nullsFirst: false })
      .limit(perPage);

    if (gameFilter) {
      tournamentQuery = tournamentQuery.eq("game", gameFilter);
      matchQuery = matchQuery.eq("game", gameFilter);
    }

    const [tournamentRes, matchRes] = await Promise.all([tournamentQuery, matchQuery]);
    if (tournamentRes.error) throw tournamentRes.error;
    if (matchRes.error) throw matchRes.error;

    const tournaments = ((tournamentRes.data as TournamentRow[] | null) ?? [])
      .map(mapTournament)
      .filter((t): t is ResultTournament => t !== null);
    const matches = ((matchRes.data as MatchRow[] | null) ?? [])
      .map(mapMatch)
      .filter((m): m is ResultMatch => m !== null);

    const result = { tournaments, matches };
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    logger.error("Failed to fetch esport results from DB", { error });
    throw error;
  }
}
