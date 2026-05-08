import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { TtlCache } from "./ttlCache";
import { resolvePlayerLocalId } from "./resolvePlayer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

const cache = new TtlCache(5 * 60 * 1000);

export interface PlayerStats {
  wins: number;
  losses: number;
  totalMatches: number;
  /** Win rate as a fraction in [0, 1]. 0 when totalMatches === 0. */
  winRate: number;
  /** Number of distinct teams the player has been on (incl. current). */
  teamsCount: number;
}

interface MembershipForStats {
  team_id: string;
  started_at: string;
  ended_at: string | null;
}

interface MatchForStats {
  status: string;
  begin_at: string | null;
  opponent1_id: string | null;
  opponent2_id: string | null;
  winner_id: string | null;
}

function emptyStats(teamsCount = 0): PlayerStats {
  return { wins: 0, losses: 0, totalMatches: 0, winRate: 0, teamsCount };
}

/**
 * Decide which side (opponent1 or opponent2) the player's team played on.
 * Returns `null` when neither side belongs to the player.
 */
function teamThatPlayed(match: MatchForStats, teamIds: Set<string>): string | null {
  if (match.opponent1_id && teamIds.has(match.opponent1_id)) return match.opponent1_id;
  if (match.opponent2_id && teamIds.has(match.opponent2_id)) return match.opponent2_id;
  return null;
}

/**
 * Did the player actually own the given team at the time of the match?
 * Falls back to "yes" when the match has no `begin_at`.
 */
function attributableTo(
  periods: MembershipForStats[],
  teamPlayed: string,
  matchDate: number | null
): boolean {
  return periods.some((p) => {
    if (p.team_id !== teamPlayed) return false;
    if (matchDate === null) return true;
    const start = new Date(p.started_at).getTime();
    const end = p.ended_at ? new Date(p.ended_at).getTime() : Infinity;
    return matchDate >= start && matchDate <= end;
  });
}

/**
 * Aggregate stats for a player across all their team memberships.
 *
 * For each membership period, we count the player's team's wins and losses
 * over `finished` matches that started inside the period (open intervals on
 * the right when `ended_at IS NULL`).
 *
 * A match is attributed to the player only when their team played it during
 * their actual tenure. Matches before they joined or after they left are
 * excluded.
 */
export async function getPlayerStats(pandascoreId: number): Promise<PlayerStats> {
  const cacheKey = `esport-player-stats:${pandascoreId}`;
  const cached = cache.get<PlayerStats>(cacheKey);
  if (cached) return cached;

  try {
    const playerLocalId = await resolvePlayerLocalId(pandascoreId);
    if (!playerLocalId) {
      const empty = emptyStats();
      cache.set(cacheKey, empty);
      return empty;
    }

    const supabase = getSupabaseAdmin();
    const { data: memberships, error: memErr } = await supabase
      .from("esport_player_team_history" as UntypedFrom)
      .select("team_id, started_at, ended_at")
      .eq("player_id", playerLocalId);
    if (memErr) throw memErr;

    const periods = (memberships as MembershipForStats[] | null) ?? [];
    if (periods.length === 0) {
      const empty = emptyStats();
      cache.set(cacheKey, empty);
      return empty;
    }

    const teamIdSet = new Set(periods.map((p) => p.team_id));
    const teamIds = Array.from(teamIdSet);

    const { data: matches, error: matchErr } = await supabase
      .from("esport_matches" as UntypedFrom)
      .select("status, begin_at, opponent1_id, opponent2_id, winner_id")
      .eq("status", "finished")
      .or(`opponent1_id.in.(${teamIds.join(",")}),opponent2_id.in.(${teamIds.join(",")})`);
    if (matchErr) throw matchErr;

    let wins = 0;
    let losses = 0;
    for (const match of (matches as MatchForStats[] | null) ?? []) {
      const teamPlayed = teamThatPlayed(match, teamIdSet);
      if (!teamPlayed) continue;

      const matchDate = match.begin_at ? new Date(match.begin_at).getTime() : null;
      if (!attributableTo(periods, teamPlayed, matchDate)) continue;

      if (match.winner_id === teamPlayed) wins++;
      else if (match.winner_id) losses++;
      // else: draw / no winner → not counted
    }

    const totalMatches = wins + losses;
    const stats: PlayerStats = {
      wins,
      losses,
      totalMatches,
      winRate: totalMatches > 0 ? wins / totalMatches : 0,
      teamsCount: teamIds.length,
    };

    cache.set(cacheKey, stats);
    return stats;
  } catch (error) {
    logger.error("Failed to fetch player stats", { error, pandascoreId });
    throw error;
  }
}
