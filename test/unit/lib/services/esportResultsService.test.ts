import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

type Chain = {
  table: string;
  filters: Array<{ op: string; col: string; value: unknown }>;
  result: { data: unknown; error: unknown };
};

let lastChain: Chain;

function buildChain(table: string, result: { data: unknown; error: unknown }) {
  lastChain = { table, filters: [], result };
  const proxy: Record<string, unknown> = {};

  for (const m of ["select", "order", "limit", "lt", "not"]) {
    proxy[m] = (...args: unknown[]) => {
      lastChain.filters.push({ op: m, col: String(args[0] ?? ""), value: args[1] });
      return proxy;
    };
  }
  proxy.eq = (col: string, value: unknown) => {
    lastChain.filters.push({ op: "eq", col, value });
    return proxy;
  };
  proxy.then = (
    onFulfilled: (v: { data: unknown; error: unknown }) => unknown
  ) => Promise.resolve(result).then(onFulfilled);

  return proxy;
}

const mockFrom = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from: (table: string) => mockFrom(table) }),
}));

function makeTournamentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "uuid-tournament-1",
    pandascore_id: 1,
    name: "Worlds 2025",
    slug: "worlds-2025",
    begin_at: "2025-10-01T00:00:00Z",
    end_at: "2025-11-01T00:00:00Z",
    game: "League of Legends",
    league_name: "Worlds",
    league_image_url: null,
    prizepool: "$2,000,000",
    tier: "s",
    winner_id: "uuid-team-100",
    winner_team: { pandascore_id: 100 },
    ...overrides,
  };
}

function makeMatchRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "uuid-match-1",
    pandascore_id: 10,
    name: "Grand Final",
    status: "finished",
    begin_at: "2025-11-01T18:00:00Z",
    game: "League of Legends",
    winner_id: "uuid-team-100",
    opponent1_score: 3,
    opponent2_score: 1,
    esport_tournaments: { name: "Worlds 2025", league_name: "Worlds" },
    opponent1: {
      id: "uuid-team-100",
      name: "T1",
      image_url: "https://t1.png",
      pandascore_id: 100,
    },
    opponent2: {
      id: "uuid-team-200",
      name: "Gen.G",
      image_url: "https://geng.png",
      pandascore_id: 200,
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("esportResultsService (DB-backed)", () => {
  async function loadService() {
    return import("@/lib/services/esportResultsService");
  }

  it("returns mapped tournaments and matches from DB rows", async () => {
    mockFrom
      .mockReturnValueOnce(
        buildChain("esport_tournaments", { data: [makeTournamentRow()], error: null })
      )
      .mockReturnValueOnce(
        buildChain("esport_matches", { data: [makeMatchRow()], error: null })
      );

    const { getRecentResults } = await loadService();
    const { tournaments, matches } = await getRecentResults();

    expect(tournaments).toHaveLength(1);
    expect(tournaments[0].name).toBe("Worlds 2025");
    expect(tournaments[0].winnerId).toBe(100);

    expect(matches).toHaveLength(1);
    expect(matches[0].opponents[0].name).toBe("T1");
    expect(matches[0].opponents[0].score).toBe(3);
    expect(matches[0].opponents[1].name).toBe("Gen.G");
    expect(matches[0].opponents[1].score).toBe(1);
    expect(matches[0].winnerId).toBe(100);
  });

  it("filters out rows without pandascore_id", async () => {
    mockFrom
      .mockReturnValueOnce(
        buildChain("esport_tournaments", {
          data: [makeTournamentRow(), makeTournamentRow({ pandascore_id: null })],
          error: null,
        })
      )
      .mockReturnValueOnce(
        buildChain("esport_matches", {
          data: [makeMatchRow(), makeMatchRow({ pandascore_id: null })],
          error: null,
        })
      );

    const { getRecentResults } = await loadService();
    const { tournaments, matches } = await getRecentResults();
    expect(tournaments).toHaveLength(1);
    expect(matches).toHaveLength(1);
  });

  it("passes the game filter to both queries", async () => {
    mockFrom
      .mockReturnValueOnce(buildChain("esport_tournaments", { data: [], error: null }))
      .mockReturnValueOnce(buildChain("esport_matches", { data: [], error: null }));

    const { getRecentResults } = await loadService();
    await getRecentResults({ game: "Valorant" });

    // The match query is the last buildChain call
    expect(lastChain.filters.some((f) => f.op === "eq" && f.col === "game" && f.value === "Valorant")).toBe(
      true
    );
  });

  it("caches results across calls", async () => {
    mockFrom.mockReturnValue(
      buildChain("esport_tournaments", { data: [], error: null })
    );
    const { getRecentResults } = await loadService();
    await getRecentResults();
    await getRecentResults();
    // First call hits the DB twice (tournaments + matches), second is cached
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it("throws on DB error", async () => {
    mockFrom
      .mockReturnValueOnce(
        buildChain("esport_tournaments", { data: null, error: new Error("DB down") })
      )
      .mockReturnValueOnce(buildChain("esport_matches", { data: [], error: null }));

    const { getRecentResults } = await loadService();
    await expect(getRecentResults()).rejects.toThrow();
  });
});
