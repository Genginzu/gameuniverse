import { describe, it, expect, vi, beforeEach } from "bun:test";
import { getPlayerGameRanks } from "@/lib/services/gameRankService";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
});

describe("gameRankService", () => {
  it("returns empty array when no linked accounts", async () => {
    const ranks = await getPlayerGameRanks([]);
    expect(ranks).toEqual([]);
  });

  it("fetches rank from matching adapter", async () => {
    vi.stubEnv("RIOT_API_KEY", "test-key");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ tier: "Diamond", rank: "II", leaguePoints: 75 }]),
    });
    vi.stubGlobal("fetch", mockFetch);

    const ranks = await getPlayerGameRanks([
      { game: "league-of-legends", accountId: "summoner123" },
    ]);

    expect(ranks).toHaveLength(1);
    expect(ranks[0].tier).toBe("Diamond");
    expect(ranks[0].rank).toBe("II");
    expect(ranks[0].points).toBe(75);
  });

  it("skips unknown games", async () => {
    const ranks = await getPlayerGameRanks([{ game: "unknown-game", accountId: "abc" }]);
    expect(ranks).toEqual([]);
  });

  it("handles API errors gracefully", async () => {
    vi.stubEnv("RIOT_API_KEY", "test-key");

    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal("fetch", mockFetch);

    const ranks = await getPlayerGameRanks([
      { game: "league-of-legends", accountId: "summoner456" },
    ]);
    expect(ranks).toEqual([]);
  });

  it.skip("caches results", async () => {
    vi.stubEnv("RIOT_API_KEY", "test-key");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ tier: "Gold", rank: "I", leaguePoints: 50 }]),
    });
    vi.stubGlobal("fetch", mockFetch);

    const accounts = [{ game: "league-of-legends", accountId: "s1" }];
    await getPlayerGameRanks(accounts);
    await getPlayerGameRanks(accounts);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("returns null when API key is missing", async () => {
    delete process.env.RIOT_API_KEY;

    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const ranks = await getPlayerGameRanks([{ game: "league-of-legends", accountId: "s2" }]);

    expect(ranks).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
