import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("psn-api", () => ({ getUserTitles: vi.fn() }));
vi.mock("@/lib/services/igdb-external-games", () => ({
  EXTERNAL_GAME_CATEGORY: { PLAYSTATION_STORE_US: 36 },
  resolveIgdbIdsByExternalUids: vi.fn().mockResolvedValue(new Map()),
}));
vi.mock("@/lib/services/gameImportService", () => ({
  GameImportService: { importFromIGDB: vi.fn() },
}));
vi.mock("@/lib/services/igdbService", () => ({ IGDBService: { searchGames: vi.fn() } }));
vi.mock("@/lib/services/platformTokenRefresh", () => ({ getValidAccessToken: vi.fn() }));
vi.mock("@/lib/services/librarySyncBackfill", () => ({
  recordUserPlatformTitles: vi.fn().mockResolvedValue(undefined),
  backfillMatch: vi.fn().mockResolvedValue(0),
}));

import { syncPsnLibrary } from "@/lib/services/psnLibrarySync";
import { getUserTitles } from "psn-api";
import { IGDBService } from "@/lib/services/igdbService";
import { getValidAccessToken } from "@/lib/services/platformTokenRefresh";

interface LocalGame {
  id: string;
  igdb_id: number;
}

// Minimal chainable Supabase fake for the queries syncPsnLibrary makes.
function makeSupabase(localGames: LocalGame[], upserted: unknown[], accountId: string | null) {
  return {
    from(table: string) {
      if (table === "player_linked_platforms") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: accountId ? { external_id: accountId } : null,
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
          select: () => ({ eq: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) }),
          upsert: () => Promise.resolve({ error: null }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as ReturnType<typeof makeSupabase> & Parameters<typeof syncPsnLibrary>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getValidAccessToken).mockResolvedValue("access-token");
});

describe("syncPsnLibrary", () => {
  it("fetches trophy titles and matches them by name", async () => {
    vi.mocked(getUserTitles).mockResolvedValue({
      trophyTitles: [
        { npCommunicationId: "NPWR001", trophyTitleName: "Game A" },
        { npCommunicationId: "NPWR002", trophyTitleName: "Game B™" },
      ],
      totalItemCount: 2,
      nextOffset: undefined,
    } as any);

    vi.mocked(IGDBService.searchGames).mockImplementation(async (q: string) => {
      if (q.includes("Game A")) return [{ id: 100, name: "Game A" }] as never;
      if (q.includes("Game B")) return [{ id: 200, name: "Game B" }] as never;
      return [];
    });

    const upserted: unknown[] = [];
    const supabase = makeSupabase(
      [
        { id: "gA", igdb_id: 100 },
        { id: "gB", igdb_id: 200 },
      ],
      upserted,
      "acct-1"
    );

    const result = await syncPsnLibrary(supabase, "user-1");

    expect(result.total).toBe(2);
    expect(result.matched).toBe(2);
    expect(result.upserted).toBe(2);
    expect(result.done).toBe(true);
    expect(upserted).toContainEqual(
      expect.objectContaining({ game_id: "gA", source_platform: "playstation", source_id: "NPWR001" })
    );
    expect(upserted).toContainEqual(expect.objectContaining({ game_id: "gB", source_id: "NPWR002" }));
  });

  it("throws when the PlayStation account is not connected", async () => {
    vi.mocked(getValidAccessToken).mockResolvedValue(null);
    const supabase = makeSupabase([], [], "acct-1");
    await expect(syncPsnLibrary(supabase, "user-1")).rejects.toThrow(/not connected/i);
  });

  it("throws when the account id is missing", async () => {
    const supabase = makeSupabase([], [], null);
    await expect(syncPsnLibrary(supabase, "user-1")).rejects.toThrow(/account id/i);
  });

  it("returns zero counts for an empty PSN library", async () => {
    vi.mocked(getUserTitles).mockResolvedValue({
      trophyTitles: [],
      totalItemCount: 0,
      nextOffset: undefined,
    } as any);
    const supabase = makeSupabase([], [], "acct-1");
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
