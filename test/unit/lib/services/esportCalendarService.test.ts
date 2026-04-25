import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

const mockGetUpcoming = vi.fn();
const mockGetRunning = vi.fn();

vi.mock("@/lib/pandascore/client", () => ({
  getUpcomingTournaments: (...args: unknown[]) => mockGetUpcoming(...args),
  getRunningTournaments: (...args: unknown[]) => mockGetRunning(...args),
}));

function makeTournament(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "World Championship",
    slug: "world-championship",
    begin_at: "2026-06-01T00:00:00Z",
    end_at: "2026-06-15T00:00:00Z",
    serie_id: 1,
    league_id: 1,
    league: { id: 1, name: "LEC", slug: "lec", image_url: null, url: null },
    serie: { id: 1, name: null, slug: "s1", begin_at: null, end_at: null, full_name: "Season 1", year: 2026 },
    videogame: { id: 1, name: "League of Legends", slug: "league-of-legends" },
    prizepool: "$1,000,000",
    tier: "s",
    winner_id: null,
    winner_type: null,
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

  it("merges running and upcoming tournaments", async () => {
    const running = [makeTournament({ id: 1, name: "Running" })];
    const upcoming = [makeTournament({ id: 2, name: "Upcoming" })];
    mockGetRunning.mockResolvedValue(running);
    mockGetUpcoming.mockResolvedValue(upcoming);

    const { getCalendarTournaments } = await loadService();
    const result = await getCalendarTournaments();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Running");
    expect(result[0].status).toBe("running");
    expect(result[1].name).toBe("Upcoming");
    expect(result[1].status).toBe("upcoming");
  });

  it("maps tournament fields correctly", async () => {
    mockGetRunning.mockResolvedValue([]);
    mockGetUpcoming.mockResolvedValue([makeTournament()]);

    const { getCalendarTournaments } = await loadService();
    const [t] = await getCalendarTournaments();

    expect(t.id).toBe(1);
    expect(t.game).toBe("League of Legends");
    expect(t.gameSlug).toBe("league-of-legends");
    expect(t.league).toBe("LEC");
    expect(t.prizepool).toBe("$1,000,000");
    expect(t.tier).toBe("s");
    expect(t.beginAt).toBe("2026-06-01T00:00:00Z");
  });

  it("passes game filter to PandaScore", async () => {
    mockGetRunning.mockResolvedValue([]);
    mockGetUpcoming.mockResolvedValue([]);

    const { getCalendarTournaments } = await loadService();
    await getCalendarTournaments({ game: "Valorant" });

    expect(mockGetUpcoming).toHaveBeenCalledWith(
      expect.objectContaining({ "filter[videogame_title]": "Valorant" }),
    );
  });

  it("caches results for subsequent calls", async () => {
    mockGetRunning.mockResolvedValue([]);
    mockGetUpcoming.mockResolvedValue([makeTournament()]);

    const { getCalendarTournaments } = await loadService();
    await getCalendarTournaments();
    await getCalendarTournaments();

    // Only called once due to cache
    expect(mockGetUpcoming).toHaveBeenCalledTimes(1);
  });

  it("getCalendarGames returns unique sorted game names", async () => {
    mockGetRunning.mockResolvedValue([]);
    mockGetUpcoming.mockResolvedValue([
      makeTournament({ id: 1, videogame: { id: 1, name: "Valorant", slug: "valorant" } }),
      makeTournament({ id: 2, videogame: { id: 2, name: "CS2", slug: "cs2" } }),
      makeTournament({ id: 3, videogame: { id: 1, name: "Valorant", slug: "valorant" } }),
    ]);

    const { getCalendarGames } = await loadService();
    const games = await getCalendarGames();

    expect(games).toEqual(["CS2", "Valorant"]);
  });

  it("throws on PandaScore error", async () => {
    mockGetRunning.mockRejectedValue(new Error("API down"));
    mockGetUpcoming.mockRejectedValue(new Error("API down"));

    const { getCalendarTournaments } = await loadService();
    await expect(getCalendarTournaments()).rejects.toThrow("API down");
  });
});
