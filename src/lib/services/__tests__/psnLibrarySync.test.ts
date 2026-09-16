import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("psn-api", () => ({ getRecentlyPlayedGames: vi.fn() }));
vi.mock("@/lib/services/igdb-external-games", () => ({
  EXTERNAL_GAME_CATEGORY: { PLAYSTATION_STORE_US: 36 },
  resolveIgdbIdsByExternalUids: vi.fn(),
}));
vi.mock("@/lib/services/gameImportService", () => ({
  GameImportService: { importFromIGDB: vi.fn() },
}));
vi.mock("@/lib/services/igdbService", () => ({ IGDBService: { searchGames: vi.fn() } }));
vi.mock("@/lib/services/platformTokenRefresh", () => ({ getValidAccessToken: vi.fn() }));

import { syncPsnLibrary } from "@/lib/services/psnLibrarySync";
import { getRecentlyPlayedGames } from "psn-api";
import { resolveIgdbIdsByExternalUids } from "@/lib/services/igdb-external-games";
import { IGDBService } from "@/lib/services/igdbService";
import { getValidAccessToken } from "@/lib/services/platformTokenRefresh";

interface LocalGame {
  id: string;
  igdb_id: number;
}

// Minimal chainable Supabase fake covering the queries psnLibrarySync makes:
//   games.select().in("igdb_id", ids)         → local lookup by igdb id
//   games.select().eq("igdb_id", id).maybeSingle() → re-fetch after import
//   user_library.upsert(rows, ...)            → collects upserted rows
function makeSupabase(localGames: LocalGame[], upserted: unknown[]) {
  return {
    from(table: string) {
      if (table === "games") {
        return {
          select: () => ({
            in: (_col: string, ids: number[]) =>
              Promise.resolve({
                data: localGames.filter((g) => ids.includes(g.igdb_id)),
                error: null,
              }),
            eq: (_col: string, val: number) => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: localGames.find((g) => g.igdb_id === val) ?? null,
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "user_library") {
        return {
          upsert: (rows: unknown[]) => {
            (upserted as unknown[]).push(...rows);
            return Promise.resolve({ error: null, count: rows.length });
          },
        };
      }
      if (table === "platform_game_matches") {
        return {
          // Empty shared cache: select().eq("platform").in("source_id", …)
          select: () => ({
            eq: () => ({
              in: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
          upsert: () => Promise.resolve({ error: null }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
     
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getValidAccessToken).mockResolvedValue("access-token");
});

describe("syncPsnLibrary", () => {
  it("maps via external_game_source (cat 36) and falls back to name search", async () => {
    vi.mocked(getRecentlyPlayedGames).mockResolvedValue({
      data: {
        gameLibraryTitlesRetrieve: {
          __typename: "GameList",
          games: [
            { name: "Game A", titleId: "TA", conceptId: "cA", productId: null },
            { name: "Game B™", titleId: "TB", conceptId: "cB", productId: null },
          ],
        },
      },
       
    } as any);

    // Game A resolves via cat 36 (conceptId cA → igdb 100).
    vi.mocked(resolveIgdbIdsByExternalUids).mockResolvedValue(new Map([["cA", 100]]));
    // Game B has no store mapping → name search returns a strict match (igdb 200).
    vi.mocked(IGDBService.searchGames).mockResolvedValue([
       
      { id: 200, name: "Game B" } as any,
    ]);

    const upserted: unknown[] = [];
    const supabase = makeSupabase(
      [
        { id: "gA", igdb_id: 100 },
        { id: "gB", igdb_id: 200 },
      ],
      upserted
    );

    const result = await syncPsnLibrary(supabase, "user-1");

    expect(result.total).toBe(2);
    expect(result.matched).toBe(2);
    expect(result.upserted).toBe(2);
    expect(result.imported).toBe(0);
    expect(upserted).toHaveLength(2);
    expect(upserted).toContainEqual(
      expect.objectContaining({ game_id: "gA", source_platform: "playstation", source_id: "TA" })
    );
    expect(upserted).toContainEqual(
      expect.objectContaining({ game_id: "gB", source_id: "TB" })
    );
  });

  it("throws when the PlayStation account is not connected", async () => {
    vi.mocked(getValidAccessToken).mockResolvedValue(null);
    const supabase = makeSupabase([], []);
    await expect(syncPsnLibrary(supabase, "user-1")).rejects.toThrow(/not connected/i);
  });

  it("returns zero counts for an empty PSN library", async () => {
    vi.mocked(getRecentlyPlayedGames).mockResolvedValue({
      data: { gameLibraryTitlesRetrieve: { __typename: "GameList", games: [] } },
       
    } as any);
    const supabase = makeSupabase([], []);
    const result = await syncPsnLibrary(supabase, "user-1");
    expect(result).toEqual({
      total: 0,
      matched: 0,
      upserted: 0,
      unmatched: 0,
      imported: 0,
      done: true,
    });
  });
});
