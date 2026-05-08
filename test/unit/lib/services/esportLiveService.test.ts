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

  for (const m of ["select", "order", "limit"]) {
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

function makeLiveMatchRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "uuid-match-1",
    pandascore_id: 1,
    name: "Grand Final",
    begin_at: "2026-04-25T18:00:00Z",
    game: "League of Legends",
    opponent1_score: 1,
    opponent2_score: 0,
    streams: [
      { language: "en", main: true, raw_url: "https://twitch.tv/riotgames" },
      { language: "fr", main: false, raw_url: "https://twitch.tv/otplol" },
    ],
    esport_tournaments: { name: "Worlds", league_name: "Worlds Championship" },
    opponent1: { id: "uuid-team-100", name: "T1", image_url: "https://t1.png", pandascore_id: 100 },
    opponent2: { id: "uuid-team-200", name: "Gen.G", image_url: "https://geng.png", pandascore_id: 200 },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("esportLiveService (DB-backed)", () => {
  async function loadService() {
    return import("@/lib/services/esportLiveService");
  }

  it("returns running matches from DB", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_matches", { data: [makeLiveMatchRow()], error: null })
    );
    const { getLiveMatches } = await loadService();
    const matches = await getLiveMatches();

    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe(1);
    expect(matches[0].name).toBe("Grand Final");
    expect(matches[0].league).toBe("Worlds Championship");
    expect(matches[0].opponents).toHaveLength(2);
    expect(matches[0].opponents[0]).toEqual({
      id: 100,
      name: "T1",
      imageUrl: "https://t1.png",
      score: 1,
    });
  });

  it("exposes streams sorted with main first", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_matches", { data: [makeLiveMatchRow()], error: null })
    );
    const { getLiveMatches } = await loadService();
    const matches = await getLiveMatches();
    expect(matches[0].streams).toHaveLength(2);
    expect(matches[0].streams[0].main).toBe(true);
    expect(matches[0].streams[0].rawUrl).toBe("https://twitch.tv/riotgames");
    expect(matches[0].streams[1].main).toBe(false);
  });

  it("filters streams without raw_url", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_matches", {
        data: [
          makeLiveMatchRow({
            streams: [
              { language: "en", main: true, raw_url: "https://twitch.tv/x" },
              { language: "fr", main: false, raw_url: "" },
              { language: "es", main: false, raw_url: null },
            ],
          }),
        ],
        error: null,
      })
    );
    const { getLiveMatches } = await loadService();
    const matches = await getLiveMatches();
    expect(matches[0].streams).toHaveLength(1);
    expect(matches[0].streams[0].language).toBe("en");
  });

  it("returns empty streams when streams column is null", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_matches", {
        data: [makeLiveMatchRow({ streams: null })],
        error: null,
      })
    );
    const { getLiveMatches } = await loadService();
    const matches = await getLiveMatches();
    expect(matches[0].streams).toEqual([]);
  });

  it("filters by status='running' on the query", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_matches", { data: [], error: null })
    );
    const { getLiveMatches } = await loadService();
    await getLiveMatches();
    expect(
      lastChain.filters.some((f) => f.op === "eq" && f.col === "status" && f.value === "running")
    ).toBe(true);
  });

  it("filters out matches without pandascore_id", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_matches", {
        data: [makeLiveMatchRow(), makeLiveMatchRow({ pandascore_id: null })],
        error: null,
      })
    );
    const { getLiveMatches } = await loadService();
    const matches = await getLiveMatches();
    expect(matches).toHaveLength(1);
  });

  it("passes the game filter", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_matches", { data: [], error: null })
    );
    const { getLiveMatches } = await loadService();
    await getLiveMatches({ game: "Valorant" });
    expect(
      lastChain.filters.some((f) => f.op === "eq" && f.col === "game" && f.value === "Valorant")
    ).toBe(true);
  });

  it("caches results across calls", async () => {
    mockFrom.mockReturnValue(
      buildChain("esport_matches", { data: [makeLiveMatchRow()], error: null })
    );
    const { getLiveMatches } = await loadService();
    await getLiveMatches();
    await getLiveMatches();
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("throws on DB error", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_matches", { data: null, error: new Error("DB down") })
    );
    const { getLiveMatches } = await loadService();
    await expect(getLiveMatches()).rejects.toThrow();
  });
});
