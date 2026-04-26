import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

const mockGetPastTournaments = vi.fn();
const mockGetPastMatches = vi.fn();

vi.mock("@/lib/pandascore/client", () => ({
  getPastTournaments: (...args: unknown[]) => mockGetPastTournaments(...args),
  getPastMatches: (...args: unknown[]) => mockGetPastMatches(...args),
}));

function makeTournament(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Worlds 2025",
    slug: "worlds-2025",
    begin_at: "2025-10-01T00:00:00Z",
    end_at: "2025-11-01T00:00:00Z",
    serie_id: 1,
    league_id: 1,
    league: { id: 1, name: "Worlds", slug: "worlds", image_url: null, url: null },
    serie: {
      id: 1,
      name: null,
      slug: "s1",
      begin_at: null,
      end_at: null,
      full_name: "2025",
      year: 2025,
    },
    videogame: { id: 1, name: "League of Legends", slug: "lol" },
    prizepool: "$2,000,000",
    tier: "s",
    winner_id: 42,
    winner_type: "Team",
    ...overrides,
  };
}

function makeMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    name: "Grand Final",
    slug: "grand-final",
    status: "finished",
    match_type: "best_of",
    number_of_games: 5,
    begin_at: "2025-11-01T18:00:00Z",
    end_at: "2025-11-01T21:00:00Z",
    tournament_id: 1,
    tournament: { id: 1, name: "Worlds 2025", slug: "worlds-2025" },
    opponents: [
      {
        type: "Team",
        opponent: {
          id: 100,
          name: "T1",
          slug: "t1",
          acronym: "T1",
          image_url: "https://t1.png",
          location: "KR",
          current_videogame: null,
        },
      },
      {
        type: "Team",
        opponent: {
          id: 200,
          name: "Gen.G",
          slug: "geng",
          acronym: "GEN",
          image_url: "https://geng.png",
          location: "KR",
          current_videogame: null,
        },
      },
    ],
    winner_id: 100,
    winner_type: "Team",
    videogame: { id: 1, name: "League of Legends", slug: "lol" },
    league: { id: 1, name: "Worlds", slug: "worlds", image_url: null, url: null },
    serie: {
      id: 1,
      name: null,
      slug: "s1",
      begin_at: null,
      end_at: null,
      full_name: "2025",
      year: 2025,
    },
    results: [
      { team_id: 100, score: 3 },
      { team_id: 200, score: 1 },
    ],
    streams_list: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("esportResultsService", () => {
  async function loadService() {
    return import("@/lib/services/esportResultsService");
  }

  it("returns mapped tournaments and matches", async () => {
    mockGetPastTournaments.mockResolvedValue([makeTournament()]);
    mockGetPastMatches.mockResolvedValue([makeMatch()]);

    const { getRecentResults } = await loadService();
    const { tournaments, matches } = await getRecentResults();

    expect(tournaments).toHaveLength(1);
    expect(tournaments[0].name).toBe("Worlds 2025");
    expect(tournaments[0].winnerId).toBe(42);

    expect(matches).toHaveLength(1);
    expect(matches[0].opponents[0].name).toBe("T1");
    expect(matches[0].opponents[0].score).toBe(3);
    expect(matches[0].opponents[1].name).toBe("Gen.G");
    expect(matches[0].opponents[1].score).toBe(1);
  });

  it("passes game filter to PandaScore", async () => {
    mockGetPastTournaments.mockResolvedValue([]);
    mockGetPastMatches.mockResolvedValue([]);

    const { getRecentResults } = await loadService();
    await getRecentResults({ game: "Valorant" });

    expect(mockGetPastTournaments).toHaveBeenCalledWith(
      expect.objectContaining({ "filter[videogame_title]": "Valorant" })
    );
  });

  it("caches results", async () => {
    mockGetPastTournaments.mockResolvedValue([]);
    mockGetPastMatches.mockResolvedValue([]);

    const { getRecentResults } = await loadService();
    await getRecentResults();
    await getRecentResults();

    expect(mockGetPastTournaments).toHaveBeenCalledTimes(1);
  });

  it("throws on API error", async () => {
    mockGetPastTournaments.mockRejectedValue(new Error("down"));
    mockGetPastMatches.mockRejectedValue(new Error("down"));

    const { getRecentResults } = await loadService();
    await expect(getRecentResults()).rejects.toThrow("down");
  });
});
