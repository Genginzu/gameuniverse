import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type {
  LibrarySyncAdapter,
  LibrarySyncProgress,
  PlatformLibraryItem,
} from "@/types/library-sync";

vi.mock("@/lib/services/igdb-external-games", () => ({
  EXTERNAL_GAME_CATEGORY: { STEAM: 1, XBOX_MARKETPLACE: 31, PLAYSTATION_STORE_US: 36 },
  resolveIgdbIdsByExternalUids: vi.fn(),
}));
vi.mock("@/lib/services/gameImportService", () => ({
  GameImportService: { importFromIGDB: vi.fn() },
}));
vi.mock("@/lib/services/igdbService", () => ({ IGDBService: { searchGames: vi.fn() } }));
vi.mock("@/lib/services/librarySyncBackfill", () => ({
  recordUserPlatformTitles: vi.fn().mockResolvedValue(undefined),
  backfillMatch: vi.fn().mockResolvedValue(0),
}));

import { syncLibraryWithAdapter } from "@/lib/services/library-sync/syncPlatformLibrary";
import { resolveIgdbIdsByExternalUids } from "@/lib/services/igdb-external-games";
import { IGDBService } from "@/lib/services/igdbService";
import { backfillMatch, recordUserPlatformTitles } from "@/lib/services/librarySyncBackfill";

interface FakeDb {
  client: SupabaseClient<Database>;
  upsertCalls: Array<Array<Record<string, unknown>>>;
  cacheWrites: Array<Record<string, unknown>>;
}

function makeDb(localGames: Array<{ id: string; igdb_id: number }>, upsertError?: Error): FakeDb {
  const upsertCalls: FakeDb["upsertCalls"] = [];
  const cacheWrites: FakeDb["cacheWrites"] = [];
  const client = {
    from(table: string) {
      if (table === "games") {
        return {
          select: () => ({
            in: (_col: string, ids: number[]) =>
              Promise.resolve({
                data: localGames.filter((g) => ids.includes(g.igdb_id)),
                error: null,
              }),
          }),
        };
      }
      if (table === "platform_game_matches") {
        return {
          select: () => ({ eq: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) }),
          upsert: (rows: Array<Record<string, unknown>>) => {
            cacheWrites.push(...rows);
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === "user_library") {
        return {
          upsert: (rows: Array<Record<string, unknown>>) => {
            upsertCalls.push(rows);
            return Promise.resolve({ error: upsertError ?? null, count: rows.length });
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient<Database>;
  return { client, upsertCalls, cacheWrites };
}

function makeAdapter(
  items: PlatformLibraryItem[],
  overrides: Partial<LibrarySyncAdapter> = {}
): LibrarySyncAdapter {
  return {
    platform: "xbox",
    externalCategory: 31,
    fetchLibrary: vi.fn().mockResolvedValue({ items }),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(resolveIgdbIdsByExternalUids).mockResolvedValue(new Map());
  vi.mocked(IGDBService.searchGames).mockResolvedValue([]);
});

describe("syncLibraryWithAdapter", () => {
  it("returns a done empty result and propagates privateProfile", async () => {
    const db = makeDb([]);
    const adapter = makeAdapter([], {
      fetchLibrary: vi.fn().mockResolvedValue({ items: [], privateProfile: true }),
    });
    const progress: LibrarySyncProgress[] = [];

    const result = await syncLibraryWithAdapter(db.client, "user-1", adapter, {
      onProgress: (p) => progress.push(p),
    });

    expect(result).toEqual({
      total: 0,
      matched: 0,
      upserted: 0,
      unmatched: 0,
      imported: 0,
      pending: 0,
      done: true,
      privateProfile: true,
    });
    expect(progress.map((p) => p.phase)).toEqual(["fetching", "done"]);
    expect(db.upsertCalls).toHaveLength(0);
    expect(recordUserPlatformTitles).not.toHaveBeenCalled();
  });

  it("records titles, resolves via external uids and upserts library rows", async () => {
    vi.mocked(resolveIgdbIdsByExternalUids).mockResolvedValue(
      new Map([
        ["T1", 100],
        ["T2", 200],
      ])
    );
    const db = makeDb([
      { id: "game-a", igdb_id: 100 },
      { id: "game-b", igdb_id: 200 },
    ]);
    const adapter = makeAdapter([
      { sourceId: "T1", name: "Game A", uids: ["T1"] },
      { sourceId: "T2", name: "Game B", uids: ["T2"] },
      { sourceId: "T3", name: "Unknown", uids: [] },
    ]);
    const progress: LibrarySyncProgress[] = [];

    const result = await syncLibraryWithAdapter(db.client, "user-1", adapter, {
      onProgress: (p) => progress.push(p),
    });

    expect(recordUserPlatformTitles).toHaveBeenCalledWith(db.client, "user-1", "xbox", [
      { sourceId: "T1", name: "Game A" },
      { sourceId: "T2", name: "Game B" },
      { sourceId: "T3", name: "Unknown" },
    ]);
    expect(result).toMatchObject({ total: 3, matched: 2, upserted: 2, unmatched: 1, done: true });
    expect(progress.filter((p) => p.phase).map((p) => p.phase)).toEqual([
      "fetching",
      "resolving",
      "saving",
      "done",
    ]);
    const rows = db.upsertCalls.flat();
    expect(rows).toContainEqual(
      expect.objectContaining({
        user_id: "user-1",
        game_id: "game-a",
        status: "owned",
        source_platform: "xbox",
        source_id: "T1",
      })
    );
    expect(rows[0]).not.toHaveProperty("external_playtime_seconds");
    expect(db.cacheWrites.map((w) => w.source_id)).toEqual(["T1", "T2", "T3"]);
    expect(backfillMatch).toHaveBeenCalledTimes(2);
  });

  it("uses adapter known games, playtime columns and the duplicate tie-break", async () => {
    const db = makeDb([]);
    const adapter = makeAdapter(
      [
        { sourceId: "10", name: "Edition", uids: ["10"], playtimeMinutes: 30 },
        { sourceId: "11", name: "Deluxe", uids: ["11"], playtimeMinutes: 600 },
      ],
      {
        platform: "steam",
        findKnownGames: vi.fn().mockResolvedValue(
          new Map([
            ["10", "game-x"],
            ["11", "game-x"],
          ])
        ),
        pickDuplicate: (a, b) => ((b.playtimeMinutes ?? 0) > (a.playtimeMinutes ?? 0) ? b : a),
      }
    );

    const result = await syncLibraryWithAdapter(db.client, "user-1", adapter);

    expect(resolveIgdbIdsByExternalUids).not.toHaveBeenCalled();
    expect(result).toMatchObject({ total: 2, matched: 2, upserted: 1, done: true });
    expect(db.upsertCalls.flat()).toEqual([
      expect.objectContaining({
        game_id: "game-x",
        source_id: "11",
        source_platform: "steam",
        external_playtime_seconds: 36000,
        play_time_hours: 10,
      }),
    ]);
  });

  it("reports pending work and done=false when the IGDB budget is exhausted", async () => {
    const db = makeDb([]);
    const adapter = makeAdapter([
      { sourceId: "A", name: "Alpha", uids: [] },
      { sourceId: "B", name: "Beta", uids: [] },
      { sourceId: "C", name: "Gamma", uids: [] },
    ]);

    const result = await syncLibraryWithAdapter(db.client, "user-1", adapter, { importBudget: 1 });

    expect(IGDBService.searchGames).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ total: 3, matched: 0, pending: 2, done: false });
  });

  it("upserts in chunks of 200 rows", async () => {
    const db = makeDb([]);
    const items = Array.from({ length: 450 }, (_, i) => ({
      sourceId: String(i),
      name: `Game ${i}`,
      uids: [],
    }));
    const adapter = makeAdapter(items, {
      findKnownGames: vi
        .fn()
        .mockResolvedValue(new Map(items.map((it) => [it.sourceId, `g-${it.sourceId}`]))),
    });

    const result = await syncLibraryWithAdapter(db.client, "user-1", adapter);

    expect(db.upsertCalls.map((c) => c.length)).toEqual([200, 200, 50]);
    expect(result.upserted).toBe(450);
  });

  it("throws when an upsert chunk fails", async () => {
    const db = makeDb([], new Error("db down"));
    const adapter = makeAdapter([{ sourceId: "1", name: "One", uids: [] }], {
      findKnownGames: vi.fn().mockResolvedValue(new Map([["1", "g-1"]])),
    });

    await expect(syncLibraryWithAdapter(db.client, "user-1", adapter)).rejects.toThrow("db down");
  });
});
