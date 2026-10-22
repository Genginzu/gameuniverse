import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

vi.mock("psn-api", () => ({ getUserTitles: vi.fn() }));
vi.mock("@/lib/services/platform-connection", () => ({
  getValidAccessToken: vi.fn(),
  getXboxAuthForPlayer: vi.fn(),
  xboxAuthorizationHeader: vi.fn().mockReturnValue("XBL3.0 x=hash;token"),
}));

import { getUserTitles } from "psn-api";
import { getValidAccessToken, getXboxAuthForPlayer } from "@/lib/services/platform-connection";
import { normalizeSteamLibrary, steamAdapter } from "@/lib/services/library-sync/adapters/steam";
import { normalizeXboxTitles, xboxAdapter } from "@/lib/services/library-sync/adapters/xbox";
import {
  normalizePsnTitles,
  playstationAdapter,
} from "@/lib/services/library-sync/adapters/playstation";
import { getLibraryAdapter } from "@/lib/services/library-sync/adapters";

function makeDb(
  externalId: string | null,
  steamGames: Array<{ id: string; steam_appid: number }> = []
) {
  return {
    from(table: string) {
      if (table === "player_linked_platforms") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: externalId ? { external_id: externalId } : null,
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }
      if (table === "games") {
        return {
          select: () => ({
            in: (_col: string, ids: number[]) =>
              Promise.resolve({
                data: steamGames.filter((g) => ids.includes(g.steam_appid)),
                error: null,
              }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient<Database>;
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  process.env.STEAM_API_KEY = "steam-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getLibraryAdapter", () => {
  it("returns the adapter for each syncable platform", () => {
    expect(getLibraryAdapter("steam")).toBe(steamAdapter);
    expect(getLibraryAdapter("xbox")).toBe(xboxAdapter);
    expect(getLibraryAdapter("playstation")).toBe(playstationAdapter);
  });
});

describe("steam adapter", () => {
  it("normalises owned games ordered by playtime", () => {
    const result = normalizeSteamLibrary({
      response: {
        game_count: 2,
        games: [
          { appid: 10, name: "Short", playtime_forever: 5 },
          { appid: 20, name: "Long", playtime_forever: 500 },
          { appid: 30 },
        ],
      },
    });
    expect(result.privateProfile).toBe(false);
    expect(result.items).toEqual([
      { sourceId: "20", name: "Long", uids: ["20"], playtimeMinutes: 500 },
      { sourceId: "10", name: "Short", uids: ["10"], playtimeMinutes: 5 },
      { sourceId: "30", name: "", uids: ["30"], playtimeMinutes: 0 },
    ]);
  });

  it("flags a private profile when game_count is missing", () => {
    expect(normalizeSteamLibrary({ response: {} })).toEqual({ items: [], privateProfile: true });
  });

  it("loads the steamid from linked platforms and fetches owned games", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ response: { game_count: 1, games: [{ appid: 1, name: "One" }] } }),
    });

    const result = await steamAdapter.fetchLibrary(makeDb("7656"), "user-1");

    expect(String(fetchMock.mock.calls[0][0])).toContain("steamid=7656");
    expect(result.items.map((i) => i.sourceId)).toEqual(["1"]);
  });

  it("throws when the steam account is not linked", async () => {
    await expect(steamAdapter.fetchLibrary(makeDb(null), "user-1")).rejects.toThrow(/not linked/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("finds known games by steam_appid", async () => {
    const known = await steamAdapter.findKnownGames?.(
      makeDb(null, [{ id: "g-1", steam_appid: 1 }]),
      [
        { sourceId: "1", name: "One", uids: ["1"] },
        { sourceId: "2", name: "Two", uids: ["2"] },
      ]
    );
    expect(known).toEqual(new Map([["1", "g-1"]]));
  });

  it("keeps the most-played duplicate", () => {
    const low = { sourceId: "1", name: "A", uids: [], playtimeMinutes: 1 };
    const high = { sourceId: "2", name: "B", uids: [], playtimeMinutes: 9 };
    expect(steamAdapter.pickDuplicate?.(low, high)).toBe(high);
    expect(steamAdapter.pickDuplicate?.(high, low)).toBe(high);
  });
});

describe("xbox adapter", () => {
  it("drops applications and collects title id + pfn as uids", () => {
    expect(
      normalizeXboxTitles([
        { titleId: "1", name: "Halo", pfn: "Halo.PFN" },
        { titleId: "2", name: "Netflix", type: "Application" },
        { titleId: "3", name: "Forza", type: "Game" },
      ])
    ).toEqual([
      { sourceId: "1", name: "Halo", uids: ["1", "Halo.PFN"] },
      { sourceId: "3", name: "Forza", uids: ["3"] },
    ]);
  });

  it("throws when the xbox account is not connected", async () => {
    vi.mocked(getXboxAuthForPlayer).mockResolvedValue(null);
    await expect(xboxAdapter.fetchLibrary(makeDb(null), "user-1")).rejects.toThrow(
      /not connected/i
    );
  });

  it("fetches title history with the xbox auth context", async () => {
    vi.mocked(getXboxAuthForPlayer).mockResolvedValue({
      xstsToken: "t",
      userHash: "h",
      xuid: "42",
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ titles: [{ titleId: "1", name: "Halo" }] }),
    });

    const result = await xboxAdapter.fetchLibrary(makeDb(null), "user-1");

    expect(String(fetchMock.mock.calls[0][0])).toContain("xuid(42)");
    expect(result.items).toEqual([{ sourceId: "1", name: "Halo", uids: ["1"] }]);
  });
});

describe("playstation adapter", () => {
  it("normalises trophy titles without external uids", () => {
    expect(normalizePsnTitles([{ npCommunicationId: "NPWR1", trophyTitleName: "Game A" }])).toEqual(
      [{ sourceId: "NPWR1", name: "Game A", uids: [] }]
    );
  });

  it("paginates trophy titles until nextOffset is exhausted", async () => {
    vi.mocked(getValidAccessToken).mockResolvedValue("token");
    vi.mocked(getUserTitles)
      .mockResolvedValueOnce({
        trophyTitles: [{ npCommunicationId: "NPWR1", trophyTitleName: "A" }],
        nextOffset: 100,
      } as never)
      .mockResolvedValueOnce({
        trophyTitles: [{ npCommunicationId: "NPWR2", trophyTitleName: "B" }],
        nextOffset: undefined,
      } as never);

    const result = await playstationAdapter.fetchLibrary(makeDb("acct-1"), "user-1");

    expect(getUserTitles).toHaveBeenCalledTimes(2);
    expect(vi.mocked(getUserTitles).mock.calls[1][2]).toMatchObject({ offset: 100 });
    expect(result.items.map((i) => i.sourceId)).toEqual(["NPWR1", "NPWR2"]);
  });

  it("throws when the PlayStation account is not connected", async () => {
    vi.mocked(getValidAccessToken).mockResolvedValue(null);
    await expect(playstationAdapter.fetchLibrary(makeDb("acct-1"), "user-1")).rejects.toThrow(
      /not connected/i
    );
  });

  it("throws when the account id is missing", async () => {
    vi.mocked(getValidAccessToken).mockResolvedValue("token");
    await expect(playstationAdapter.fetchLibrary(makeDb(null), "user-1")).rejects.toThrow(
      /account id/i
    );
  });
});
