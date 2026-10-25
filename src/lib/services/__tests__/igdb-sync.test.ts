import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  syncGameField,
  syncAllGameFields,
  type SyncSupabaseClient,
} from "@/lib/services/igdb-sync";
import { IGDBService } from "@/lib/services/igdbService";
import { TRACKABLE_FIELDS } from "@/lib/services/igdb-fields/registry";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import type { IGDBGame } from "@/types/igdb";

// =============================================================================
// Mock Supabase
// =============================================================================

function createMockSupabase(): { client: SyncSupabaseClient; lastSyncedAt: string | null } {
  const state = { lastSyncedAt: null as string | null };
  const noopResult = { data: { id: "mock-id" }, error: null };

  const client: SyncSupabaseClient = {
    from: (table: string) => ({
      update: (data: Record<string, unknown>) => {
        if (table === "games" && data.last_synced_at) {
          state.lastSyncedAt = data.last_synced_at as string;
        }
        return { eq: () => Promise.resolve({ error: null }) };
      },
      delete: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: null }),
          in: () => Promise.resolve({ error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({ single: () => Promise.resolve(noopResult) }),
      }),
      upsert: () => Promise.resolve({ error: null }),
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve(noopResult),
          eq: () => ({ single: () => Promise.resolve(noopResult) }),
        }),
        in: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
    rpc: () => Promise.resolve({ error: null }),
  };

  return {
    client,
    ...state,
    get lastSyncedAt() {
      return state.lastSyncedAt;
    },
  };
}

const MOCK_IGDB_GAME: IGDBGame = {
  id: 123,
  name: "Test Game",
  slug: "test-game",
  summary: "A test game",
  first_release_date: 1609459200,
  cover: { image_id: "co1234" },
  screenshots: [{ image_id: "sc0001" }],
  artworks: [{ image_id: "ar0001" }],
  genres: [{ id: 1, name: "Action", slug: "action" }],
  involved_companies: [],
  aggregated_rating: 85.5,
};

// =============================================================================
// Tests
// =============================================================================

describe("igdb-sync", () => {
  let getGameDetailsSpy: ReturnType<typeof vi.spyOn>;
  let getTimeToBeatSpy: ReturnType<typeof vi.spyOn>;
  let getGameVersionsSpy: ReturnType<typeof vi.spyOn>;
  let getPopularityPrimitivesSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getGameDetailsSpy = vi.spyOn(IGDBService, "getGameDetails");
    getTimeToBeatSpy = vi.spyOn(IGDBService, "getTimeToBeat");
    getGameVersionsSpy = vi.spyOn(IGDBService, "getGameVersions");
    getPopularityPrimitivesSpy = vi.spyOn(IGDBService, "getPopularityPrimitives");

    getTimeToBeatSpy.mockResolvedValue(null);
    getGameVersionsSpy.mockResolvedValue([]);
    getPopularityPrimitivesSpy.mockResolvedValue(null);
  });

  afterEach(() => {
    getGameDetailsSpy.mockRestore();
    getTimeToBeatSpy.mockRestore();
    getGameVersionsSpy.mockRestore();
    getPopularityPrimitivesSpy.mockRestore();
  });

  describe("syncGameField - erreur jeu introuvable dans IGDB", () => {
    it("retourne une erreur quand getGameDetails retourne null", async () => {
      getGameDetailsSpy.mockResolvedValue(null);
      const { client } = createMockSupabase();

      const result = await syncGameField(client, "game-id", 999999, "cover_image");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Game not found in IGDB");
      expect(result.syncedFields).toEqual([]);
    });
  });

  describe("syncGameField - erreur appel IGDB", () => {
    it("retourne une erreur quand getGameDetails throw", async () => {
      getGameDetailsSpy.mockRejectedValue(new Error("IGDB API timeout"));
      const { client } = createMockSupabase();

      const result = await syncGameField(client, "game-id", 123, "translations");

      expect(result.success).toBe(false);
      expect(result.error).toContain("IGDB API timeout");
      expect(result.syncedFields).toEqual([]);
    });
  });

  describe("syncGameField - mise à jour de last_synced_at", () => {
    it("met à jour last_synced_at après une sync réussie", async () => {
      getGameDetailsSpy.mockResolvedValue(MOCK_IGDB_GAME);
      const mock = createMockSupabase();

      const result = await syncGameField(mock.client, "game-id", 123, "cover_image");

      expect(result.success).toBe(true);
      expect(mock.lastSyncedAt).not.toBeNull();
      // Vérifier que c'est un ISO timestamp récent
      const syncDate = new Date(mock.lastSyncedAt!);
      expect(syncDate.getTime()).toBeGreaterThan(Date.now() - 5000);
    });
  });

  describe("syncAllGameFields - erreur jeu introuvable", () => {
    it("retourne une erreur quand getGameDetails retourne null", async () => {
      getGameDetailsSpy.mockResolvedValue(null);
      const { client } = createMockSupabase();

      const result = await syncAllGameFields(client, "game-id", 999999);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Game not found in IGDB");
    });
  });

  describe("syncAllGameFields - mise à jour de last_synced_at", () => {
    it("met à jour last_synced_at après une sync globale réussie", async () => {
      getGameDetailsSpy.mockResolvedValue(MOCK_IGDB_GAME);
      const mock = createMockSupabase();

      const result = await syncAllGameFields(mock.client, "game-id", 123);

      expect(result.success).toBe(true);
      expect(mock.lastSyncedAt).not.toBeNull();
    });
  });

  describe("syncGameField - champ invalide", () => {
    it("retourne une erreur pour un champ non reconnu", async () => {
      const { client } = createMockSupabase();

      const result = await syncGameField(client, "game-id", 123, "invalid_field" as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid field");
    });
  });

  describe("syncAllGameFields - override modes", () => {
    it("skips overridden fields and keeps their overrides in respect-overrides mode", async () => {
      getGameDetailsSpy.mockResolvedValue(MOCK_IGDB_GAME);
      const db = createSupabaseQueryMock();
      db.enqueue("game_field_overrides", {
        data: [{ field_name: "videos" }, { field_name: "cover_image" }],
      });

      const result = await syncAllGameFields(
        db.client as unknown as SyncSupabaseClient,
        "game-id",
        123,
        "respect-overrides"
      );

      expect(result.success).toBe(true);
      expect(result.syncedFields).not.toContain("videos");
      expect(result.syncedFields).not.toContain("cover_image");
      expect(result.syncedFields).toHaveLength(TRACKABLE_FIELDS.length - 2);
      expect(db.callsFor("game_videos", "delete")).toHaveLength(0);
      expect(db.callsFor("game_field_overrides", "delete")).toHaveLength(0);
    });

    it("syncs every field and clears overrides in force mode", async () => {
      getGameDetailsSpy.mockResolvedValue(MOCK_IGDB_GAME);
      const db = createSupabaseQueryMock();

      const result = await syncAllGameFields(
        db.client as unknown as SyncSupabaseClient,
        "game-id",
        123
      );

      expect(result.syncedFields).toEqual([...TRACKABLE_FIELDS]);
      expect(db.callsFor("game_field_overrides", "select")).toHaveLength(0);
      expect(db.callsFor("game_field_overrides", "in")).toEqual([
        ["field_name", [...TRACKABLE_FIELDS]],
      ]);
    });
  });
});
