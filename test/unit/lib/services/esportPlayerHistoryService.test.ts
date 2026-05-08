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
  for (const m of ["select", "order", "limit", "range", "not", "or", "is"]) {
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
    // 1st call → resolvePlayerLocalId; 2nd call → history query
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
    // First call: 2 (player + history). Second call: 0 (cache hit on full response).
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
    expect(await getPlayerStats(404)).toEqual({
      wins: 0,
      losses: 0,
      totalMatches: 0,
      winRate: 0,
      teamsCount: 0,
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
    expect(await getPlayerStats(1)).toMatchObject({ wins: 0, losses: 0, teamsCount: 0 });
  });

  it("computes wins, losses and win rate over matches in the membership period", async () => {
    mockFrom
      .mockReturnValueOnce(
        buildChain("esport_players", { data: [{ id: "p" }], error: null })
      )
      .mockReturnValueOnce(
        buildChain("esport_player_team_history", {
          data: [
            {
              team_id: "team-A",
              started_at: "2024-01-01T00:00:00Z",
              ended_at: null,
            },
          ],
          error: null,
        })
      )
      .mockReturnValueOnce(
        buildChain("esport_matches", {
          data: [
            // win in period
            {
              status: "finished",
              begin_at: "2024-06-01T00:00:00Z",
              opponent1_id: "team-A",
              opponent2_id: "team-B",
              winner_id: "team-A",
            },
            // loss in period
            {
              status: "finished",
              begin_at: "2024-06-02T00:00:00Z",
              opponent1_id: "team-B",
              opponent2_id: "team-A",
              winner_id: "team-B",
            },
            // before player joined → excluded
            {
              status: "finished",
              begin_at: "2023-01-01T00:00:00Z",
              opponent1_id: "team-A",
              opponent2_id: "team-B",
              winner_id: "team-A",
            },
            // draw / no winner → not counted
            {
              status: "finished",
              begin_at: "2024-07-01T00:00:00Z",
              opponent1_id: "team-A",
              opponent2_id: "team-B",
              winner_id: null,
            },
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
  });
});
