import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

const mockGetRunningMatches = vi.fn();

vi.mock("@/lib/pandascore/client", () => ({
  getRunningMatches: (...args: unknown[]) => mockGetRunningMatches(...args),
}));

function makeMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Grand Final",
    slug: "grand-final",
    status: "running",
    match_type: "best_of",
    number_of_games: 5,
    begin_at: "2026-04-25T18:00:00Z",
    end_at: null,
    tournament_id: 1,
    tournament: { id: 1, name: "Worlds", slug: "worlds" },
    opponents: [
      { type: "Team", opponent: { id: 100, name: "T1", slug: "t1" } },
      { type: "Team", opponent: { id: 200, name: "Gen.G", slug: "geng" } },
    ],
    winner_id: null,
    winner_type: null,
    videogame: { id: 1, name: "League of Legends", slug: "lol" },
    league: { id: 1, name: "Worlds", slug: "worlds", image_url: null, url: null },
    serie: {
      id: 1,
      name: null,
      slug: "s1",
      begin_at: null,
      end_at: null,
      full_name: "2026",
      year: 2026,
    },
    results: [],
    streams_list: [
      { language: "en", main: true, raw_url: "https://twitch.tv/riotgames" },
      { language: "fr", main: false, raw_url: "https://twitch.tv/otplol" },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("esportLiveService", () => {
  async function loadService() {
    return import("@/lib/services/esportLiveService");
  }

  it("extracts streams from running matches", async () => {
    mockGetRunningMatches.mockResolvedValue([makeMatch()]);
    const { getLiveStreams } = await loadService();
    const streams = await getLiveStreams();

    expect(streams).toHaveLength(2);
    expect(streams[0].isMain).toBe(true);
    expect(streams[0].streamUrl).toBe("https://twitch.tv/riotgames");
    expect(streams[0].opponents).toEqual(["T1", "Gen.G"]);
  });

  it("sorts main streams first", async () => {
    mockGetRunningMatches.mockResolvedValue([makeMatch()]);
    const { getLiveStreams } = await loadService();
    const streams = await getLiveStreams();

    expect(streams[0].isMain).toBe(true);
    expect(streams[1].isMain).toBe(false);
  });

  it("returns empty for matches without streams", async () => {
    mockGetRunningMatches.mockResolvedValue([makeMatch({ streams_list: [] })]);
    const { getLiveStreams } = await loadService();
    const streams = await getLiveStreams();

    expect(streams).toHaveLength(0);
  });

  it("passes game filter", async () => {
    mockGetRunningMatches.mockResolvedValue([]);
    const { getLiveStreams } = await loadService();
    await getLiveStreams({ game: "Valorant" });

    expect(mockGetRunningMatches).toHaveBeenCalledWith(
      expect.objectContaining({ "filter[videogame_title]": "Valorant" })
    );
  });

  it("caches results", async () => {
    mockGetRunningMatches.mockResolvedValue([makeMatch()]);
    const { getLiveStreams } = await loadService();
    await getLiveStreams();
    await getLiveStreams();
    expect(mockGetRunningMatches).toHaveBeenCalledTimes(1);
  });

  it("throws on error", async () => {
    mockGetRunningMatches.mockRejectedValue(new Error("fail"));
    const { getLiveStreams } = await loadService();
    await expect(getLiveStreams()).rejects.toThrow("fail");
  });
});
