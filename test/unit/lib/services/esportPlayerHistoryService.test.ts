import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

type ChainResult = { data: unknown; error: unknown; count?: number };
type Chain = {
  table: string;
  filters: Array<{ op: string; col: string; value: unknown }>;
  result: ChainResult;
};

let lastChain: Chain;

function buildChain(table: string, result: ChainResult) {
  lastChain = { table, filters: [], result };
  const proxy: Record<string, unknown> = {};
  for (const m of ["select", "order", "limit", "range", "not", "or", "is", "in"]) {
    proxy[m] = (...args: unknown[]) => {
      lastChain.filters.push({ op: m, col: String(args[0] ?? ""), value: args[1] });
      return proxy;
    };
  }
  proxy.eq = (col: string, value: unknown) => {
    lastChain.filters.push({ op: "eq", col, value });
    return proxy;
  };
  proxy.then = (onFulfilled: (v: ChainResult) => unknown) =>
    Promise.resolve(result).then(onFulfilled);
  return proxy;
}

const mockFrom = vi.fn();
vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from: (t: string) => mockFrom(t) }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("esportPlayerHistoryService.getPlayerTeamHistory", () => {
  async function load() {
    return import("@/lib/services/esportPlayerHistoryService");
  }

  it("returns memberships sorted by started_at desc, with isCurrent flag", async () => {
    mockFrom
      .mockReturnValueOnce(
        buildChain("esport_players", { data: [{ id: "uuid-player" }], error: null })
      )
      .mockReturnValueOnce(
        buildChain("esport_player_team_history", {
          data: [
            {
              id: "m1",
              started_at: "2024-01-01T00:00:00Z",
              ended_at: null,
              esport_teams: { name: "T1", image_url: "https://t1.png", pandascore_id: 100 },
            },
            {
              id: "m2",
              started_at: "2022-01-01T00:00:00Z",
              ended_at: "2023-12-31T00:00:00Z",
              esport_teams: { name: "Damwon", image_url: null, pandascore_id: 50 },
            },
          ],
          error: null,
        })
      );

    const { getPlayerTeamHistory } = await load();
    const history = await getPlayerTeamHistory(1);

    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({
      teamName: "T1",
      teamId: 100,
      isCurrent: true,
      endedAt: null,
    });
    expect(history[1]).toMatchObject({
      teamName: "Damwon",
      isCurrent: false,
    });
  });

  it("returns an empty array when the player isn't in the DB", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", { data: [], error: null })
    );
    const { getPlayerTeamHistory } = await load();
    expect(await getPlayerTeamHistory(999)).toEqual([]);
  });

  it("caches results for identical pandascoreId", async () => {
    mockFrom.mockReturnValue(
      buildChain("esport_players", { data: [{ id: "u" }], error: null })
    );
    const { getPlayerTeamHistory } = await load();
    await getPlayerTeamHistory(7);
    await getPlayerTeamHistory(7);
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });
});

describe("esportPlayerHistoryService.getPlayerStats", () => {
  async function load() {
    return import("@/lib/services/esportPlayerHistoryService");
  }

  it("returns zero stats when player isn't found", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", { data: [], error: null })
    );
    const { getPlayerStats } = await load();
    const stats = await getPlayerStats(404);
    expect(stats).toMatchObject({
      wins: 0,
      losses: 0,
      totalMatches: 0,
      winRate: 0,
      teamsCount: 0,
      titles: 0,
      currentStreak: { type: null, length: 0 },
      activity30d: { days: 30, matches: 0, wins: 0, losses: 0 },
      bestOpponent: null,
      worstOpponent: null,
      gameBreakdown: [],
    });
  });

  it("returns zero stats when player has no memberships", async () => {
    mockFrom
      .mockReturnValueOnce(
        buildChain("esport_players", { data: [{ id: "p" }], error: null })
      )
      .mockReturnValueOnce(
        buildChain("esport_player_team_history", { data: [], error: null })
      );
    const { getPlayerStats } = await load();
    const stats = await getPlayerStats(1);
    expect(stats).toMatchObject({ wins: 0, losses: 0, teamsCount: 0, titles: 0 });
  });

  it("computes wins/losses, titles, streak and game breakdown over the membership period", async () => {
    mockFrom
      .mockReturnValueOnce(
        buildChain("esport_players", { data: [{ id: "p" }], error: null })
      )
      .mockReturnValueOnce(
        buildChain("esport_player_team_history", {
          data: [
            { team_id: "team-A", started_at: "2024-01-01T00:00:00Z", ended_at: null },
          ],
          error: null,
        })
      )
      // Matches query (most-recent-first; service ORDER BYs begin_at desc)
      .mockReturnValueOnce(
        buildChain("esport_matches", {
          data: [
            // recent win
            {
              status: "finished",
              begin_at: "2024-06-02T00:00:00Z",
              game: "LoL",
              opponent1_id: "team-A",
              opponent2_id: "team-B",
              winner_id: "team-A",
              opponent1: { name: "T1" },
              opponent2: { name: "Gen.G" },
            },
            // earlier loss
            {
              status: "finished",
              begin_at: "2024-06-01T00:00:00Z",
              game: "LoL",
              opponent1_id: "team-B",
              opponent2_id: "team-A",
              winner_id: "team-B",
              opponent1: { name: "Gen.G" },
              opponent2: { name: "T1" },
            },
            // outside the membership period — must be filtered
            {
              status: "finished",
              begin_at: "2023-01-01T00:00:00Z",
              game: "LoL",
              opponent1_id: "team-A",
              opponent2_id: "team-B",
              winner_id: "team-A",
              opponent1: { name: "T1" },
              opponent2: { name: "Gen.G" },
            },
          ],
          error: null,
        })
      )
      // Tournaments query: 1 title in the period, 1 outside
      .mockReturnValueOnce(
        buildChain("esport_tournaments", {
          data: [
            { begin_at: "2024-04-01T00:00:00Z", end_at: "2024-05-01T00:00:00Z", winner_id: "team-A" },
            { begin_at: "2023-01-01T00:00:00Z", end_at: "2023-02-01T00:00:00Z", winner_id: "team-A" },
          ],
          error: null,
        })
      );

    const { getPlayerStats } = await load();
    const stats = await getPlayerStats(1);

    expect(stats.wins).toBe(1);
    expect(stats.losses).toBe(1);
    expect(stats.totalMatches).toBe(2);
    expect(stats.winRate).toBe(0.5);
    expect(stats.teamsCount).toBe(1);
    expect(stats.titles).toBe(1);
    // Most recent decided match is a win → streak is 1 win
    expect(stats.currentStreak).toEqual({ type: "win", length: 1 });
    // gameBreakdown contains LoL with 1W 1L
    expect(stats.gameBreakdown).toEqual([
      { game: "LoL", matches: 2, wins: 1, losses: 1, winRate: 0.5 },
    ]);
  });
});
