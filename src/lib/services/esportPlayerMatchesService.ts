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

interface MatchRow {
  id: string;
  pandascore_id: number | null;
  name: string;
  status: string;
  begin_at: string | null;
  game: string;
  winner_id: string | null;
  opponent1_id: string | null;
  opponent1_score: number | null;
  opponent2_id: string | null;
  opponent2_score: number | null;
  esport_tournaments: { name: string | null; league_name: string | null } | null;
  opponent1: { id: string; name: string; image_url: string | null; pandascore_id: number | null } | null;
  opponent2: { id: string; name: string; image_url: string | null; pandascore_id: number | null } | null;
}

function teamPublicId(team: { id: string; pandascore_id: number | null } | null): number | null {
  if (!team || team.pandascore_id === null || team.pandascore_id === undefined) return null;
  return team.pandascore_id;
}

function mapMatch(row: MatchRow): PlayerMatch | null {
  // We rely on PandaScore numeric IDs for stable links. A row without one
  // (rare admin-created entry) is filtered out from public listings.
  const matchId = row.pandascore_id;
  if (matchId === null || matchId === undefined) return null;

  const o1Id = teamPublicId(row.opponent1);
  const o2Id = teamPublicId(row.opponent2);

  const o1 =
    row.opponent1 && o1Id !== null
      ? {
          id: o1Id,
          name: row.opponent1.name,
          imageUrl: row.opponent1.image_url,
          score: row.opponent1_score ?? 0,
        }
      : null;
  const o2 =
    row.opponent2 && o2Id !== null
      ? {
          id: o2Id,
          name: row.opponent2.name,
          imageUrl: row.opponent2.image_url,
          score: row.opponent2_score ?? 0,
        }
      : null;

  let winnerPublicId: number | null = null;
  if (row.winner_id && row.opponent1?.id === row.winner_id) winnerPublicId = o1?.id ?? null;
  else if (row.winner_id && row.opponent2?.id === row.winner_id) winnerPublicId = o2?.id ?? null;

  return {
    id: matchId,
    name: row.name,
    status: row.status,
    beginAt: row.begin_at,
    game: row.game ?? "",
    gameSlug: (row.game ?? "").toLowerCase().replace(/\s+/g, "-"),
    league: row.esport_tournaments?.league_name ?? "",
    tournament: row.esport_tournaments?.name ?? "",
    opponents: [o1, o2].filter((o): o is NonNullable<typeof o> => o !== null),
    winnerId: winnerPublicId,
  };
}

/**
 * Recent matches involving a given player, fetched from the local DB.
 * Resolves the player's team first, then returns matches where that team
 * appears as opponent1 or opponent2.
 *
 * @param playerId PandaScore numeric ID (preferred) or local UUID.
 * @param perPage Maximum number of matches to return (default 5).
 */
export async function getPlayerRecentMatches(
  playerId: number | string,
  perPage = 5
): Promise<PlayerMatch[]> {
  const cacheKey = `esport-player-matches:${playerId}:${perPage}`;
  const cached = getCached<PlayerMatch[]>(cacheKey);
  if (cached) return cached;

  try {
    const supabase = getSupabaseAdmin();
    const numericId = typeof playerId === "number" ? playerId : parseInt(playerId, 10);
    const isNumeric = !isNaN(numericId);

    // 1. Resolve the player's team_id
    const { data: playerData, error: playerError } = await (isNumeric
      ? supabase
          .from("esport_players" as UntypedFrom)
          .select("team_id")
          .eq("pandascore_id", numericId)
          .limit(1)
      : supabase
          .from("esport_players" as UntypedFrom)
          .select("team_id")
          .eq("id", playerId)
          .limit(1));

    if (playerError) throw playerError;
    const teamId = (playerData as { team_id: string | null }[] | null)?.[0]?.team_id;
    if (!teamId) {
      setCache(cacheKey, []);
      return [];
    }

    // 2. Fetch recent matches where the team is one of the opponents
    const { data: matchData, error: matchError } = await supabase
      .from("esport_matches" as UntypedFrom)
      .select(
        `id, pandascore_id, name, status, begin_at, game, winner_id,
         opponent1_id, opponent1_score, opponent2_id, opponent2_score,
         esport_tournaments(name, league_name),
         opponent1:esport_teams!esport_matches_opponent1_id_fkey(id, name, image_url, pandascore_id),
         opponent2:esport_teams!esport_matches_opponent2_id_fkey(id, name, image_url, pandascore_id)`
      )
      .or(`opponent1_id.eq.${teamId},opponent2_id.eq.${teamId}`)
      .order("begin_at", { ascending: false, nullsFirst: false })
      .limit(perPage);

    if (matchError) throw matchError;

    const mapped = (matchData as MatchRow[] | null ?? [])
      .map(mapMatch)
      .filter((m): m is PlayerMatch => m !== null);
    setCache(cacheKey, mapped);
    return mapped;
  } catch (error) {
    logger.error("Failed to fetch player recent matches from DB", { error, playerId });
    throw error;
  }
}
