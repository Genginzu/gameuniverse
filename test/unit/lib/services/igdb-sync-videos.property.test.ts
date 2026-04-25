// Feature: igdb-video-sync, Property 4: Override skips video synchronization
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import type { TrackableField } from "@/types/admin-games";
import type { IGDBGame } from "@/types/igdb";

// Mock IGDBService — syncAllGameFields calls getGameDetails internally
vi.mock("@/lib/services/igdbService", () => ({
  IGDBService: {
    getGameDetails: vi.fn(),
    getGameVersions: vi.fn().mockResolvedValue([]),
    getTimeToBeat: vi.fn().mockResolvedValue(null),
    getPopularityPrimitives: vi.fn().mockResolvedValue(null),
    buildImageUrl: vi.fn().mockReturnValue("https://images.igdb.com/mock.jpg"),
  },
}));

import { syncAllGameFields, type SyncSupabaseClient } from "@/lib/services/igdb-sync";
import { IGDBService } from "@/lib/services/igdbService";

// --- Generators ---

const videoIdArb = fc
  .array(
    fc.constantFrom(
      ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_".split("")
    ),
    { minLength: 1, maxLength: 15 }
  )
  .map((chars) => chars.join(""));

const videoNameArb = fc.string({ minLength: 1, maxLength: 100 });

const igdbVideoArb = fc.record({ video_id: videoIdArb, name: videoNameArb });

/** 1–10 videos to ensure the game actually has videos that could be synced */
const igdbVideosArb = fc.array(igdbVideoArb, { minLength: 1, maxLength: 10 });

const hexChars = "0123456789abcdef".split("");
const hexStr = (len: number) =>
  fc.array(fc.constantFrom(...hexChars), { minLength: len, maxLength: len }).map((c) => c.join(""));

const gameIdArb = fc
  .tuple(hexStr(8), hexStr(4), hexStr(4), hexStr(4), hexStr(12))
  .map(([a, b, c, d, e]) => `${a}-${b}-${c}-${d}-${e}`);

const igdbIdArb = fc.integer({ min: 1, max: 999999 });

// --- Mock Supabase that tracks game_videos operations ---

interface TableOp {
  table: string;
  operation: "delete" | "insert" | "update" | "select" | "upsert";
}

function createTrackingSupabase(): { client: SyncSupabaseClient; ops: TableOp[] } {
  const ops: TableOp[] = [];

  const noopChain = {
    eq: () => ({
      single: () => Promise.resolve({ data: null, error: null }),
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      in: () => Promise.resolve({ data: [], error: null }),
    }),
    in: () => Promise.resolve({ data: [], error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
  };

  const client = {
    from: (table: string) => ({
      update: (data: Record<string, unknown>) => {
        ops.push({ table, operation: "update" });
        return { eq: () => Promise.resolve({ error: null }) };
      },
      delete: () => ({
        eq: (_col: string, val: string) => {
          ops.push({ table, operation: "delete" });
          return {
            eq: () => Promise.resolve({ error: null }),
            in: () => Promise.resolve({ error: null }),
          };
        },
      }),
      insert: (data: Record<string, unknown> | Record<string, unknown>[]) => {
        ops.push({ table, operation: "insert" });
        return {
          select: () => ({
            single: () => Promise.resolve({ data: { id: "mock-id" }, error: null }),
          }),
        };
      },
      upsert: () => {
        ops.push({ table, operation: "upsert" });
        return Promise.resolve({ error: null });
      },
      select: (cols?: string) => {
        ops.push({ table, operation: "select" });
        return noopChain;
      },
    }),
  } as unknown as SyncSupabaseClient;

  return { client, ops };
}

/**
 * Feature: igdb-video-sync
 * Property 4: Override skips video synchronization
 * **Validates: Requirements 3.4**
 *
 * For any game that has a Field_Override for "videos", calling syncAllGameFields
 * shall not modify the game_videos rows for that game.
 */
describe("Feature: igdb-video-sync, Property 4: Override skips video synchronization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("game_videos table is never touched when 'videos' is in overriddenFields", async () => {
    await fc.assert(
      fc.asyncProperty(igdbVideosArb, gameIdArb, igdbIdArb, async (videos, gameId, igdbId) => {
        // Setup: IGDB returns a game with videos
        const igdbGame: IGDBGame = {
          id: igdbId,
          name: "Test Game",
          slug: "test-game",
          summary: "A test game",
          first_release_date: 1609459200,
          videos,
        };
        vi.mocked(IGDBService.getGameDetails).mockResolvedValue(igdbGame);

        const { client, ops } = createTrackingSupabase();

        // Call syncAllGameFields with "videos" in overriddenFields
        const overriddenFields: TrackableField[] = ["videos"];
        const result = await syncAllGameFields(client, gameId, igdbId, overriddenFields);

        expect(result.success).toBe(true);
        // "videos" should NOT be in syncedFields
        expect(result.syncedFields).not.toContain("videos");

        // game_videos table should never be touched (no delete, no insert)
        const gameVideoOps = ops.filter((op) => op.table === "game_videos");
        expect(gameVideoOps).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });
});
