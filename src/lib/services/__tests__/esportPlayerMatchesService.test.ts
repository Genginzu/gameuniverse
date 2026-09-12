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
  for (const m of ["select", "order", "limit", "range", "or"]) {
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

function makeMatchRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "match-1",
    pandascore_id: 10,
    name: "T1 vs Gen.G",
    status: "finished",
    begin_at: "2024-06-01T18:00:00Z",
    game: "League of Legends",
    winner_id: "team-A",
    opponent1_id: "team-A",
    opponent1_score: 3,
    opponent2_id: "team-B",
    opponent2_score: 1,
    esport_tournaments: { name: "Worlds", league_name: "LCK" },
    opponent1: { id: "team-A", name: "T1", image_url: "https://t1.png", pandascore_id: 100 },
    opponent2: { id: "team-B", name: "Gen.G", image_url: "https://gg.png", pandascore_id: 200 },
    ...overrides,
  };
}

describe("esportPlayerMatchesService.getPlayerRecentMatches", () => {
  async function load() {
    return import("@/lib/services/esportPlayerMatchesService");
  }

  it("returns empty page when player isn't in the DB", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", { data: [], error: null })
    );
    const { getPlayerRecentMatches } = await load();
    const result = await getPlayerRecentMatches(404);
    expect(result).toEqual({ matches: [], total: 0, page: 1, limit: 10 });
  });

  it("returns empty page when player has no team memberships", async () => {
    mockFrom
      .mockReturnValueOnce(
        buildChain("esport_players", { data: [{ id: "p" }], error: null })
      )
      .mockReturnValueOnce(
        buildChain("esport_player_team_history", { data: [], error: null })
      );
    const { getPlayerRecentMatches } = await load();
    const result = await getPlayerRecentMatches(1);
    expect(result.matches).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("maps matches and returns the correct pagination metadata", async () => {
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
      .mockReturnValueOnce(
        buildChain("esport_matches", {
          data: [makeMatchRow()],
          count: 42,
          error: null,
        })
      );

    const { getPlayerRecentMatches } = await load();
    const result = await getPlayerRecentMatches(1, 2, 5);
    expect(result.total).toBe(42);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]).toMatchObject({
      id: 10,
      league: "LCK",
      tournament: "Worlds",
      winnerId: 100,
      playerTeamId: "team-A",
    });
    expect(result.matches[0].opponents[0]).toEqual({
      id: 100,
      name: "T1",
      imageUrl: "https://t1.png",
      score: 3,
    });
  });

  it("filters out matches outside the player's membership period", async () => {
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
      .mockReturnValueOnce(
        buildChain("esport_matches", {
          data: [
            makeMatchRow({ pandascore_id: 1, begin_at: "2024-06-01T00:00:00Z" }),
            // Before the player joined team-A → must be filtered out
            makeMatchRow({ pandascore_id: 2, begin_at: "2023-06-01T00:00:00Z" }),
          ],
          count: 2,
          error: null,
        })
      );

    const { getPlayerRecentMatches } = await load();
    const result = await getPlayerRecentMatches(1);
    expect(result.matches.map((m) => m.id)).toEqual([1]);
  });

  it("filters out matches without pandascore_id", async () => {
    mockFrom
      .mockReturnValueOnce(
        buildChain("esport_players", { data: [{ id: "p" }], error: null })
      )
      .mockReturnValueOnce(
        buildChain("esport_player_team_history", {
          data: [{ team_id: "team-A", started_at: "2024-01-01T00:00:00Z", ended_at: null }],
          error: null,
        })
      )
      .mockReturnValueOnce(
        buildChain("esport_matches", {
          data: [makeMatchRow({ pandascore_id: null })],
          count: 1,
          error: null,
        })
      );
    const { getPlayerRecentMatches } = await load();
    const result = await getPlayerRecentMatches(1);
    expect(result.matches).toEqual([]);
  });

  it("computes the correct range for page 3, limit 10", async () => {
    mockFrom
      .mockReturnValueOnce(
        buildChain("esport_players", { data: [{ id: "p" }], error: null })
      )
      .mockReturnValueOnce(
        buildChain("esport_player_team_history", {
          data: [{ team_id: "team-A", started_at: "2024-01-01T00:00:00Z", ended_at: null }],
          error: null,
        })
      )
      .mockReturnValueOnce(
        buildChain("esport_matches", { data: [], count: 0, error: null })
      );

    const { getPlayerRecentMatches } = await load();
    await getPlayerRecentMatches(1, 3, 10);
    const range = lastChain.filters.find((f) => f.op === "range");
    // page 3 limit 10 → from=20, to=29
    expect(range).toEqual({ op: "range", col: "20", value: 29 });
  });
});
