import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

type ChainResult = { data: unknown; error: unknown; count?: number };

type Chain = {
  table: string;
  filters: Array<{ op: string; col: string; value: unknown }>;
  result: ChainResult;
};

let lastChain: Chain;

/**
 * Minimal Supabase chained query builder mock. Every chained method is
 * recorded and returns the same proxy. The chain resolves to `result` when
 * awaited (via the `then` trap), no matter how it's terminated.
 */
function buildChain(table: string, result: ChainResult) {
  lastChain = { table, filters: [], result };
  const proxy: Record<string, unknown> = {};

  for (const m of ["select", "order", "limit", "range", "not"]) {
    proxy[m] = (...args: unknown[]) => {
      lastChain.filters.push({ op: m, col: String(args[0] ?? ""), value: args[1] });
      return proxy;
    };
  }

  proxy.ilike = (col: string, value: string) => {
    lastChain.filters.push({ op: "ilike", col, value });
    return proxy;
  };
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
  getSupabaseAdmin: () => ({ from: (table: string) => mockFrom(table) }),
}));

function makePlayerRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "uuid-1",
    pandascore_id: 1,
    name: "Faker",
    slug: "faker",
    first_name: "Sang-hyeok",
    last_name: "Lee",
    nationality: "KR",
    image_url: "https://faker.png",
    role: "Mid",
    game: "League of Legends",
    esport_teams: { name: "T1", image_url: "https://t1.png" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("esportPlayerService (DB-backed)", () => {
  async function loadService() {
    return import("@/lib/services/esportPlayerService");
  }

  it("maps the paginated player list correctly", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", {
        data: [makePlayerRow()],
        error: null,
        count: 42,
      })
    );
    const { getPlayersList } = await loadService();
    const result = await getPlayersList();

    expect(result.players).toHaveLength(1);
    expect(result.total).toBe(42);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(24);
    expect(result.players[0]).toEqual({
      id: 1,
      name: "Faker",
      slug: "faker",
      firstName: "Sang-hyeok",
      lastName: "Lee",
      nationality: "KR",
      imageUrl: "https://faker.png",
      role: "Mid",
      teamName: "T1",
      game: "League of Legends",
    });
  });

  it("filters out players without pandascore_id", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", {
        data: [makePlayerRow(), makePlayerRow({ pandascore_id: null, name: "Ghost" })],
        error: null,
        count: 2,
      })
    );
    const { getPlayersList } = await loadService();
    const result = await getPlayersList();
    expect(result.players).toHaveLength(1);
    expect(result.players[0].name).toBe("Faker");
  });

  it("applies a name search via ilike", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", { data: [], error: null, count: 0 })
    );
    const { getPlayersList } = await loadService();
    await getPlayersList({ search: "caps" });
    expect(lastChain.filters.some((f) => f.op === "ilike" && f.col === "name")).toBe(true);
  });

  it("applies a game filter via eq('game', ...)", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", { data: [], error: null, count: 0 })
    );
    const { getPlayersList } = await loadService();
    await getPlayersList({ game: "Valorant" });
    expect(
      lastChain.filters.some((f) => f.op === "eq" && f.col === "game" && f.value === "Valorant")
    ).toBe(true);
  });

  it("computes the correct range from page/limit", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", { data: [], error: null, count: 0 })
    );
    const { getPlayersList } = await loadService();
    await getPlayersList({ page: 3, limit: 10 });

    const rangeCall = lastChain.filters.find((f) => f.op === "range");
    // range(from, to) → page 3, limit 10 ⇒ from=20, to=29
    expect(rangeCall).toEqual({ op: "range", col: "20", value: 29 });
  });

  it("caps the limit to MAX_PAGE_SIZE", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", { data: [], error: null, count: 0 })
    );
    const { getPlayersList } = await loadService();
    const result = await getPlayersList({ limit: 9999 });
    expect(result.limit).toBe(100);
  });

  it("caches the listing across identical calls", async () => {
    mockFrom.mockReturnValue(
      buildChain("esport_players", { data: [makePlayerRow()], error: null, count: 1 })
    );
    const { getPlayersList } = await loadService();
    await getPlayersList();
    await getPlayersList();
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("uses a different cache key per game filter", async () => {
    mockFrom
      .mockReturnValueOnce(
        buildChain("esport_players", { data: [makePlayerRow()], error: null, count: 1 })
      )
      .mockReturnValueOnce(
        buildChain("esport_players", { data: [], error: null, count: 0 })
      );
    const { getPlayersList } = await loadService();
    await getPlayersList();
    await getPlayersList({ game: "Valorant" });
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it("fetches player detail with team image", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", { data: [makePlayerRow()], error: null })
    );
    const { getPlayerDetail } = await loadService();
    const detail = await getPlayerDetail(1);

    expect(detail).not.toBeNull();
    expect(detail?.name).toBe("Faker");
    expect(detail?.teamName).toBe("T1");
    expect(detail?.teamImageUrl).toBe("https://t1.png");
  });

  it("returns null when the player is not found", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", { data: [], error: null })
    );
    const { getPlayerDetail } = await loadService();
    const detail = await getPlayerDetail(999);
    expect(detail).toBeNull();
  });

  it("throws on DB error", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", { data: null, error: new Error("DB failure") })
    );
    const { getPlayersList } = await loadService();
    await expect(getPlayersList()).rejects.toThrow();
  });

  it("returns the distinct list of games sorted alphabetically", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", {
        data: [
          { game: "Valorant" },
          { game: "League of Legends" },
          { game: "Valorant" },
          { game: "Dota 2" },
          { game: null },
        ],
        error: null,
      })
    );
    const { getPlayersGames } = await loadService();
    const games = await getPlayersGames();
    expect(games).toEqual(["Dota 2", "League of Legends", "Valorant"]);
  });
});
