import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

// In-memory state for the chained query builder
type Chain = {
  table: string;
  filters: Array<{ op: string; col: string; value: unknown }>;
  result: { data: unknown; error: unknown };
};

let lastChain: Chain;

function buildChain(table: string, result: { data: unknown; error: unknown }) {
  lastChain = { table, filters: [], result };
  const proxy: Record<string, unknown> = {};

  const passthrough = ["select", "order", "limit"];
  for (const m of passthrough) {
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
    return Promise.resolve(result);
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

  it("maps player list correctly from DB rows", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", { data: [makePlayerRow()], error: null })
    );
    const { getPlayersList } = await loadService();
    const players = await getPlayersList();

    expect(players).toHaveLength(1);
    expect(players[0]).toEqual({
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
      })
    );
    const { getPlayersList } = await loadService();
    const players = await getPlayersList();
    expect(players).toHaveLength(1);
    expect(players[0].name).toBe("Faker");
  });

  it("applies a name search via ilike", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_players", { data: [], error: null })
    );
    const { getPlayersList } = await loadService();
    await getPlayersList({ search: "caps" });
    expect(lastChain.filters.some((f) => f.op === "ilike" && f.col === "name")).toBe(true);
  });

  it("caches the player list across calls", async () => {
    mockFrom.mockReturnValue(
      buildChain("esport_players", { data: [makePlayerRow()], error: null })
    );
    const { getPlayersList } = await loadService();
    await getPlayersList();
    await getPlayersList();
    expect(mockFrom).toHaveBeenCalledTimes(1);
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
});
