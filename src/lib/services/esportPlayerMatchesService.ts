import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { TtlCache } from "./esport/ttlCache";
import { resolvePlayerLocalId } from "./esport/resolvePlayer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

const cache = new TtlCache(5 * 60 * 1000);
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

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
  /** Local team UUID (DB) the player was on for this match. Used to highlight the player's side. */
  playerTeamId: string | null;
}

export interface PlayerMatchesPage {
  matches: PlayerMatch[];
  total: number;
  page: number;
  limit: number;
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

interface MembershipPeriod {
  team_id: string;
  started_at: string;
  ended_at: string | null;
}

function teamPublicId(team: { pandascore_id: number | null } | null): number | null {
  if (!team || team.pandascore_id === null || team.pandascore_id === undefined) return null;
  return team.pandascore_id;
}

/**
 * Pick the team the player was on for this match, restricted to the
 * membership period that covers the match date. Returns the local team UUID
 * or null when no membership covers it.
 */
function playerTeamForMatch(row: MatchRow, periods: MembershipPeriod[]): string | null {
  const candidates = [row.opponent1?.id, row.opponent2?.id].filter(
    (id): id is string => typeof id === "string"
  );
  if (candidates.length === 0) return null;
  const matchDate = row.begin_at ? new Date(row.begin_at).getTime() : null;

  for (const teamId of candidates) {
    const cover = periods.find((p) => {
      if (p.team_id !== teamId) return false;
      if (matchDate === null) return true;
      const start = new Date(p.started_at).getTime();
      const end = p.ended_at ? new Date(p.ended_at).getTime() : Infinity;
      return matchDate >= start && matchDate <= end;
    });
    if (cover) return teamId;
  }
  return null;
}

function mapMatch(row: MatchRow, playerTeamId: string): PlayerMatch | null {
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
    playerTeamId,
  };
}

const MATCH_SELECT = `id, pandascore_id, name, status, begin_at, game, winner_id,
  opponent1_id, opponent1_score, opponent2_id, opponent2_score,
  esport_tournaments(name, league_name),
  opponent1:esport_teams!esport_matches_opponent1_id_fkey(id, name, image_url, pandascore_id),
  opponent2:esport_teams!esport_matches_opponent2_id_fkey(id, name, image_url, pandascore_id)`;

/**
 * Paginated list of matches the player participated in, attributed via the
 * team membership periods (`esport_player_team_history`). A match is
 * included when one of its opponents is a team the player was on **at the
 * time of the match**.
 *
 * @param pandascoreId Player's PandaScore numeric ID.
 * @param page 1-based page index (default 1).
 * @param limit Page size (default 10, capped at 50).
 */
export async function getPlayerRecentMatches(
  pandascoreId: number,
  page = 1,
  limit = DEFAULT_PAGE_SIZE
): Promise<PlayerMatchesPage> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, limit));
  const cacheKey = `esport-player-matches:${pandascoreId}:${safePage}:${safeLimit}`;
  const cached = cache.get<PlayerMatchesPage>(cacheKey);
  if (cached) return cached;

  try {
    const playerLocalId = await resolvePlayerLocalId(pandascoreId);
    if (!playerLocalId) {
      const empty: PlayerMatchesPage = { matches: [], total: 0, page: safePage, limit: safeLimit };
      cache.set(cacheKey, empty);
      return empty;
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch all team memberships in one query.
    const { data: memberships, error: memErr } = await supabase
      .from("esport_player_team_history" as UntypedFrom)
      .select("team_id, started_at, ended_at")
      .eq("player_id", playerLocalId);
    if (memErr) throw memErr;

    const periods = (memberships as MembershipPeriod[] | null) ?? [];
    if (periods.length === 0) {
      const empty: PlayerMatchesPage = { matches: [], total: 0, page: safePage, limit: safeLimit };
      cache.set(cacheKey, empty);
      return empty;
    }

    const teamIds = Array.from(new Set(periods.map((p) => p.team_id)));
    const from = (safePage - 1) * safeLimit;
    const to = from + safeLimit - 1;

    // 2. Fetch matches where any of the player's teams played, paginated.
    const { data, count, error } = await supabase
      .from("esport_matches" as UntypedFrom)
      .select(MATCH_SELECT, { count: "exact" })
      .or(`opponent1_id.in.(${teamIds.join(",")}),opponent2_id.in.(${teamIds.join(",")})`)
      .order("begin_at", { ascending: false, nullsFirst: false })
      .range(from, to);
    if (error) throw error;

    const rows = (data as MatchRow[] | null) ?? [];

    // 3. Filter rows that don't intersect any membership period for this team
    //    (e.g. the player's old team played a match before the player joined).
    const mapped: PlayerMatch[] = [];
    for (const row of rows) {
      const playerTeamId = playerTeamForMatch(row, periods);
      if (!playerTeamId) continue;
      const m = mapMatch(row, playerTeamId);
      if (m) mapped.push(m);
    }

    const result: PlayerMatchesPage = {
      matches: mapped,
      total: count ?? mapped.length,
      page: safePage,
      limit: safeLimit,
    };
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    logger.error("Failed to fetch player matches from DB", { error, pandascoreId });
    throw error;
  }
}
