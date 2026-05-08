/**
 * Pure helpers used by `playerStats` to derive a richer set of player
 * statistics from the matches & tournaments already in our DB.
 *
 * Everything here is pure (no DB access) so it can be unit-tested in
 * isolation with simple in-memory fixtures.
 */

export interface MembershipPeriod {
  team_id: string;
  started_at: string;
  ended_at: string | null;
}

export interface MatchForStats {
  status: string;
  begin_at: string | null;
  game: string | null;
  opponent1_id: string | null;
  opponent2_id: string | null;
  winner_id: string | null;
}

export interface MatchWithOpponentNames extends MatchForStats {
  opponent1_name: string | null;
  opponent2_name: string | null;
}

export interface TournamentForStats {
  begin_at: string | null;
  end_at: string | null;
  winner_id: string | null;
}

export interface OpponentRecord {
  name: string;
  matches: number;
  wins: number;
  losses: number;
  /** Win rate against this opponent in [0, 1]. */
  winRate: number;
}

export interface GameRecord {
  game: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface ActivityWindow {
  /** Number of days the window covers, e.g. 30. */
  days: number;
  /** Matches played in the last `days` days. */
  matches: number;
  wins: number;
  losses: number;
}

export interface CurrentStreak {
  /** "win" or "loss". `null` when no decided match in history. */
  type: "win" | "loss" | null;
  /** Length of the current streak. 0 when type is null. */
  length: number;
}

const MIN_OPPONENT_MATCHES = 3;

/**
 * Did the player own `teamId` at `matchDate`? When the match has no date,
 * we attribute it as long as a membership for the same team exists.
 */
export function attributableTo(
  periods: MembershipPeriod[],
  teamId: string,
  matchDate: number | null
): boolean {
  return periods.some((p) => {
    if (p.team_id !== teamId) return false;
    if (matchDate === null) return true;
    const start = new Date(p.started_at).getTime();
    const end = p.ended_at ? new Date(p.ended_at).getTime() : Infinity;
    return matchDate >= start && matchDate <= end;
  });
}

/**
 * Pick the player's team for a given match (the side belonging to one of
 * their teams). Returns null when neither side does.
 */
export function teamThatPlayed(match: MatchForStats, teamIds: Set<string>): string | null {
  if (match.opponent1_id && teamIds.has(match.opponent1_id)) return match.opponent1_id;
  if (match.opponent2_id && teamIds.has(match.opponent2_id)) return match.opponent2_id;
  return null;
}

/**
 * Number of tournaments where one of the player's teams was the declared
 * winner, restricted to tournaments whose end date falls inside any of
 * the player's membership periods for that team.
 */
export function countTitles(
  tournaments: TournamentForStats[],
  periods: MembershipPeriod[]
): number {
  let titles = 0;
  for (const t of tournaments) {
    if (!t.winner_id) continue;
    // Use end_at when available (it's when the title was actually awarded),
    // fall back to begin_at, or null for legacy data.
    const dateStr = t.end_at ?? t.begin_at;
    const date = dateStr ? new Date(dateStr).getTime() : null;
    if (attributableTo(periods, t.winner_id, date)) {
      titles++;
    }
  }
  return titles;
}

/**
 * Compute the player's current win/loss streak from finished matches the
 * player participated in, ordered most-recent-first.
 *
 * Draws (no winner) and unattributed matches are ignored. The streak ends
 * as soon as a match flips its outcome.
 */
export function computeCurrentStreak(
  decidedOutcomes: Array<"win" | "loss">
): CurrentStreak {
  if (decidedOutcomes.length === 0) return { type: null, length: 0 };
  const head = decidedOutcomes[0];
  let length = 0;
  for (const outcome of decidedOutcomes) {
    if (outcome === head) length++;
    else break;
  }
  return { type: head, length };
}

/**
 * Stats over the last `days` calendar days (default 30).
 */
export function computeActivity(
  matches: Array<{ outcome: "win" | "loss" | "draw"; matchTimeMs: number }>,
  now: number,
  days = 30
): ActivityWindow {
  const since = now - days * 24 * 60 * 60 * 1000;
  let total = 0;
  let wins = 0;
  let losses = 0;
  for (const m of matches) {
    if (m.matchTimeMs < since) continue;
    total++;
    if (m.outcome === "win") wins++;
    else if (m.outcome === "loss") losses++;
  }
  return { days, matches: total, wins, losses };
}

/**
 * Aggregate the player's record against every opponent they faced. Only
 * opponents with at least MIN_OPPONENT_MATCHES recorded matches are kept,
 * to avoid noisy "100% win rate (1 game)" entries.
 */
export function computeOpponents(
  records: Array<{ opponentName: string; outcome: "win" | "loss" | "draw" }>
): { best: OpponentRecord | null; worst: OpponentRecord | null; all: OpponentRecord[] } {
  const map = new Map<string, { matches: number; wins: number; losses: number }>();
  for (const r of records) {
    if (!r.opponentName) continue;
    const cur = map.get(r.opponentName) ?? { matches: 0, wins: 0, losses: 0 };
    cur.matches++;
    if (r.outcome === "win") cur.wins++;
    else if (r.outcome === "loss") cur.losses++;
    map.set(r.opponentName, cur);
  }

  const all: OpponentRecord[] = [];
  for (const [name, agg] of map) {
    if (agg.matches < MIN_OPPONENT_MATCHES) continue;
    const decided = agg.wins + agg.losses;
    all.push({
      name,
      matches: agg.matches,
      wins: agg.wins,
      losses: agg.losses,
      winRate: decided > 0 ? agg.wins / decided : 0,
    });
  }

  if (all.length === 0) return { best: null, worst: null, all };

  // Best = highest win rate, ties broken by more matches. Worst = lowest.
  const sortedBest = [...all].sort(
    (a, b) => b.winRate - a.winRate || b.matches - a.matches
  );
  const sortedWorst = [...all].sort(
    (a, b) => a.winRate - b.winRate || b.matches - a.matches
  );
  return { best: sortedBest[0], worst: sortedWorst[0], all };
}

/**
 * Aggregate the player's record per game (LoL, CS, etc.).
 */
export function computeGameBreakdown(
  records: Array<{ game: string | null; outcome: "win" | "loss" | "draw" }>
): GameRecord[] {
  const map = new Map<string, { matches: number; wins: number; losses: number }>();
  for (const r of records) {
    const key = r.game ?? "";
    if (!key) continue;
    const cur = map.get(key) ?? { matches: 0, wins: 0, losses: 0 };
    cur.matches++;
    if (r.outcome === "win") cur.wins++;
    else if (r.outcome === "loss") cur.losses++;
    map.set(key, cur);
  }
  const result: GameRecord[] = [];
  for (const [game, agg] of map) {
    const decided = agg.wins + agg.losses;
    result.push({
      game,
      matches: agg.matches,
      wins: agg.wins,
      losses: agg.losses,
      winRate: decided > 0 ? agg.wins / decided : 0,
    });
  }
  // Sort by match count desc so the most-played game is first.
  result.sort((a, b) => b.matches - a.matches);
  return result;
}
