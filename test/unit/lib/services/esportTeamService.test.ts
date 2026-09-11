import { describe, it, expect, vi, beforeEach } from "bun:test";
import { getTeamsList, getTeamDetail } from "@/lib/services/esportTeamService";

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
  proxy.ilike = (col: string, value: string) => {
    lastChain.filters.push({ op: "ilike", col, value });
    return proxy;
  };
  proxy.eq = (col: string, value: unknown) => {
    lastChain.filters.push({ op: "eq", col, value });
    // For team detail, .eq() is not the terminal call (it's .limit() after).
    // The chain is awaited at the very end via the proxy's then.
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

function makeTeamRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "uuid-team-1",
    pandascore_id: 1,
    name: "T1",
    slug: "t1",
    acronym: "T1",
    image_url: "https://t1.png",
    location: "KR",
    game: "League of Legends",
    ...overrides,
  };
}

function makePlayerRosterRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "uuid-player-1",
    pandascore_id: 10,
    name: "Faker",
    first_name: "Sang-hyeok",
    last_name: "Lee",
    image_url: "https://faker.png",
    role: "Mid",
    nationality: "KR",
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("esportTeamService (DB-backed)", () => {

  it("maps the team list correctly from DB rows", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_teams", { data: [makeTeamRow()], error: null })
    );
    const teams = await getTeamsList({ search: "test-1" });

    expect(teams).toHaveLength(1);
    expect(teams[0]).toEqual({
      id: 1,
      name: "T1",
      slug: "t1",
      acronym: "T1",
      imageUrl: "https://t1.png",
      location: "KR",
      game: "League of Legends",
    });
  });

  it("filters out teams without pandascore_id", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_teams", {
        data: [makeTeamRow(), makeTeamRow({ pandascore_id: null, name: "Ghost" })],
        error: null,
      })
    );
    const teams = await getTeamsList({ search: "test-2" });
    expect(teams).toHaveLength(1);
    expect(teams[0].name).toBe("T1");
  });

  it("applies a name search via ilike", async () => {
    mockFrom.mockReturnValueOnce(buildChain("esport_teams", { data: [], error: null }));
    await getTeamsList({ search: "fnatic" });
    expect(lastChain.filters.some((f) => f.op === "ilike" && f.col === "name")).toBe(true);
  });

  it.skip("caches the team list across calls", async () => {
    mockFrom.mockReturnValue(
      buildChain("esport_teams", { data: [makeTeamRow()], error: null })
    );
    await getTeamsList({ search: "test-3" });
    await getTeamsList({ search: "test-4" });
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("fetches team detail with its roster", async () => {
    mockFrom
      .mockReturnValueOnce(
        buildChain("esport_teams", { data: [makeTeamRow()], error: null })
      )
      .mockReturnValueOnce(
        buildChain("esport_players", {
          data: [makePlayerRosterRow()],
          error: null,
        })
      );

    const detail = await getTeamDetail(1);

    expect(detail).not.toBeNull();
    expect(detail?.name).toBe("T1");
    expect(detail?.players).toHaveLength(1);
    expect(detail?.players[0]).toEqual({
      id: 10,
      name: "Faker",
      firstName: "Sang-hyeok",
      lastName: "Lee",
      imageUrl: "https://faker.png",
      role: "Mid",
      nationality: "KR",
    });
  });

  it("returns null when the team is not found", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_teams", { data: [], error: null })
    );
    const detail = await getTeamDetail(999);
    expect(detail).toBeNull();
  });

  it("throws on DB error", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_teams", { data: null, error: new Error("DB failure") })
    );
    await expect(getTeamsList({ search: "error-test" })).rejects.toThrow();
  });
});
