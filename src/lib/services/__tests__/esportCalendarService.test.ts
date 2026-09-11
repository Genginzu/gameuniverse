import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

const mockSelect = vi.fn();
const mockOr = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockEq = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({
    from: () => ({ select: mockSelect }),
  }),
}));

function setupChain(data: Record<string, unknown>[] | null, error?: { message: string }) {
  mockSelect.mockReturnValue({ or: mockOr });
  mockOr.mockReturnValue({ order: mockOrder });
  mockOrder.mockReturnValue({ limit: mockLimit });
  mockLimit.mockReturnValue({ eq: mockEq, data, error: error ?? null });
  mockEq.mockReturnValue({ data, error: error ?? null });
}

function makeTournament(overrides: Record<string, unknown> = {}) {
  return {
    id: "uuid-1",
    pandascore_id: 1,
    name: "World Championship",
    slug: "world-championship",
    begin_at: "2099-06-01T00:00:00Z",
    end_at: "2099-06-15T00:00:00Z",
    league_name: "LEC",
    league_image_url: null,
    serie_name: "Season 1",
    game: "League of Legends",
    prizepool: "$1,000,000",
    tier: "s",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("esportCalendarService", () => {
  async function loadService() {
    return import("@/lib/services/esportCalendarService");
  }

  it("returns tournaments from DB and determines status", async () => {
    const past = makeTournament({ pandascore_id: 1, name: "Running", begin_at: "2020-01-01T00:00:00Z" });
    const future = makeTournament({ pandascore_id: 2, name: "Upcoming", begin_at: "2099-01-01T00:00:00Z" });
    setupChain([past, future]);

    const { getCalendarTournaments } = await loadService();
    const result = await getCalendarTournaments();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Running");
    expect(result[0].status).toBe("running");
    expect(result[1].name).toBe("Upcoming");
    expect(result[1].status).toBe("upcoming");
  });

  it("maps tournament fields correctly", async () => {
    setupChain([makeTournament()]);

    const { getCalendarTournaments } = await loadService();
    const [t] = await getCalendarTournaments();

    expect(t.id).toBe(1);
    expect(t.game).toBe("League of Legends");
    expect(t.gameSlug).toBe("league-of-legends");
    expect(t.league).toBe("LEC");
    expect(t.prizepool).toBe("$1,000,000");
    expect(t.tier).toBe("s");
  });

  it("passes game filter as eq query", async () => {
    setupChain([]);

    const { getCalendarTournaments } = await loadService();
    await getCalendarTournaments({ game: "Valorant" });

    expect(mockEq).toHaveBeenCalledWith("game", "Valorant");
  });

  it("getCalendarGames returns unique sorted game names", async () => {
    setupChain([
      makeTournament({ pandascore_id: 1, game: "Valorant" }),
      makeTournament({ pandascore_id: 2, game: "CS2" }),
      makeTournament({ pandascore_id: 3, game: "Valorant" }),
    ]);

    const { getCalendarGames } = await loadService();
    const games = await getCalendarGames();

    expect(games).toEqual(["CS2", "Valorant"]);
  });

  it("throws on DB error", async () => {
    setupChain(null, { message: "DB down" });

    const { getCalendarTournaments } = await loadService();
    await expect(getCalendarTournaments()).rejects.toThrow();
  });
});
