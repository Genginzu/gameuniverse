import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { TtlCache } from "./ttlCache";
import { resolvePlayerLocalId } from "./resolvePlayer";
import {
  attributableTo,
  computeActivity,
  computeCurrentStreak,
  computeGameBreakdown,
  computeOpponents,
  countTitles,
  teamThatPlayed,
  type ActivityWindow,
  type CurrentStreak,
  type GameRecord,
  type MatchWithOpponentNames,
  type MembershipPeriod,
  type OpponentRecord,
  type TournamentForStats,
} from "./playerStatsCalc";

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
  /** Tournaments where the player's team won, restricted to their tenure. */
  titles: number;
  /** Current streak (W/L) from the most recent decided matches. */
  currentStreak: CurrentStreak;
  /** Activity over the last 30 days. */
  activity30d: ActivityWindow;
  /** Best opponent (highest win rate). `null` when too few matches recorded. */
  bestOpponent: OpponentRecord | null;
  /** Worst opponent (lowest win rate). `null` when too few matches recorded. */
  worstOpponent: OpponentRecord | null;
  /** Per-game breakdown sorted by match count desc. */
  gameBreakdown: GameRecord[];
}

function emptyStats(teamsCount = 0): PlayerStats {
  return {
    wins: 0,
    losses: 0,
    totalMatches: 0,
    winRate: 0,
    teamsCount,
    titles: 0,
    currentStreak: { type: null, length: 0 },
    activity30d: { days: 30, matches: 0, wins: 0, losses: 0 },
    bestOpponent: null,
    worstOpponent: null,
    gameBreakdown: [],
  };
}

const MATCH_SELECT = `status, begin_at, game,
  opponent1_id, opponent2_id, winner_id,
  opponent1:esport_teams!esport_matches_opponent1_id_fkey(name),
  opponent2:esport_teams!esport_matches_opponent2_id_fkey(name)`;

interface MatchRow {
  status: string;
  begin_at: string | null;
  game: string | null;
  opponent1_id: string | null;
  opponent2_id: string | null;
  winner_id: string | null;
  opponent1: { name: string | null } | null;
  opponent2: { name: string | null } | null;
}

function flattenRow(row: MatchRow): MatchWithOpponentNames {
  return {
    status: row.status,
    begin_at: row.begin_at,
    game: row.game,
    opponent1_id: row.opponent1_id,
    opponent2_id: row.opponent2_id,
    winner_id: row.winner_id,
    opponent1_name: row.opponent1?.name ?? null,
    opponent2_name: row.opponent2?.name ?? null,
  };
}

interface AttributedMatch {
  outcome: "win" | "loss" | "draw";
  matchTimeMs: number;
  game: string | null;
  opponentName: string;
}

function buildAttributedMatches(
  rows: MatchWithOpponentNames[],
  periods: MembershipPeriod[],
  teamIdSet: Set<string>
): AttributedMatch[] {
  const result: AttributedMatch[] = [];
  for (const row of rows) {
    const teamPlayed = teamThatPlayed(row, teamIdSet);
    if (!teamPlayed) continue;

    const matchDate = row.begin_at ? new Date(row.begin_at).getTime() : null;
    if (!attributableTo(periods, teamPlayed, matchDate)) continue;

    let outcome: "win" | "loss" | "draw";
    if (row.winner_id === teamPlayed) outcome = "win";
    else if (row.winner_id) outcome = "loss";
    else outcome = "draw";

    const opponentName =
      row.opponent1_id === teamPlayed
        ? row.opponent2_name ?? ""
        : row.opponent1_name ?? "";

    result.push({
      outcome,
      matchTimeMs: matchDate ?? 0,
      game: row.game,
      opponentName,
    });
  }
  return result;
}

/**
 * Aggregate stats for a player across all their team memberships.
 *
 * Returns wins/losses/win-rate, count of distinct teams, titles won,
 * current W/L streak, last-30-days activity, best/worst opponent, and
 * per-game breakdown.
 *
 * All metrics are derived from data already in the local DB (matches and
 * tournaments synced from PandaScore fixtures). No external API call is
 * made here.
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

    const periods = (memberships as MembershipPeriod[] | null) ?? [];
    if (periods.length === 0) {
      const empty = emptyStats();
      cache.set(cacheKey, empty);
      return empty;
    }

    const teamIdSet = new Set(periods.map((p) => p.team_id));
    const teamIds = Array.from(teamIdSet);

    // Fetch finished matches and tournaments in parallel — both keyed by team.
    const [matchRes, tournamentRes] = await Promise.all([
      supabase
        .from("esport_matches" as UntypedFrom)
        .select(MATCH_SELECT)
        .eq("status", "finished")
        .or(`opponent1_id.in.(${teamIds.join(",")}),opponent2_id.in.(${teamIds.join(",")})`)
        .order("begin_at", { ascending: false, nullsFirst: false }),
      supabase
        .from("esport_tournaments" as UntypedFrom)
        .select("begin_at, end_at, winner_id")
        .in("winner_id", teamIds),
    ]);
    if (matchRes.error) throw matchRes.error;
    if (tournamentRes.error) throw tournamentRes.error;

    const matchRows = ((matchRes.data as MatchRow[] | null) ?? []).map(flattenRow);
    const attributed = buildAttributedMatches(matchRows, periods, teamIdSet);

    const wins = attributed.filter((a) => a.outcome === "win").length;
    const losses = attributed.filter((a) => a.outcome === "loss").length;
    const totalMatches = wins + losses;

    // Matches are already ordered most-recent-first from the DB.
    const decidedOutcomes = attributed
      .filter((a): a is AttributedMatch & { outcome: "win" | "loss" } => a.outcome !== "draw")
      .map((a) => a.outcome);

    const stats: PlayerStats = {
      wins,
      losses,
      totalMatches,
      winRate: totalMatches > 0 ? wins / totalMatches : 0,
      teamsCount: teamIds.length,
      titles: countTitles((tournamentRes.data as TournamentForStats[] | null) ?? [], periods),
      currentStreak: computeCurrentStreak(decidedOutcomes),
      activity30d: computeActivity(attributed, Date.now()),
      ...(() => {
        const opp = computeOpponents(
          attributed.map((a) => ({ opponentName: a.opponentName, outcome: a.outcome }))
        );
        return { bestOpponent: opp.best, worstOpponent: opp.worst };
      })(),
      gameBreakdown: computeGameBreakdown(
        attributed.map((a) => ({ game: a.game, outcome: a.outcome }))
      ),
    };

    cache.set(cacheKey, stats);
    return stats;
  } catch (error) {
    logger.error("Failed to fetch player stats", { error, pandascoreId });
    throw error;
  }
}
