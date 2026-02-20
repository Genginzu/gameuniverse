import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Mock Supabase client â€” stateful in-memory store for property testing
// ---------------------------------------------------------------------------

/** In-memory favorites store: Set of "userId::characterId" keys */
let favoritesStore: Set<string>;

/** Tracked insert calls for verification */
let insertCalls: Array<{ user_id: string; character_id: string }>;

function storeKey(userId: string, characterId: string): string {
  return `${userId}::${characterId}`;
}

/**
 * Build a mock Supabase client that operates on the in-memory store.
 * This lets us test the real service logic (error handling, transformations)
 * while controlling the "database" layer.
 */
function buildMockClient() {
  return {
    from: vi.fn((table: string) => ({
      insert: vi.fn((row: { user_id: string; character_id: string }) => {
        insertCalls.push(row);
        const key = storeKey(row.user_id, row.character_id);
        if (favoritesStore.has(key)) {
          // Simulate UNIQUE constraint violation (code 23505)
          return Promise.resolve({
            error: { code: "23505", message: "duplicate key value violates unique constraint" },
          });
        }
        favoritesStore.add(key);
        return Promise.resolve({ error: null });
      }),

      delete: vi.fn(() => {
        // Returns a chainable object with .eq().eq() pattern
        let userId: string | null = null;
        let characterId: string | null = null;

        const chain = {
          eq: vi.fn((col: string, val: string) => {
            if (col === "user_id") userId = val;
            if (col === "character_id") characterId = val;

            // After both .eq() calls, resolve the delete
            if (userId && characterId) {
              const key = storeKey(userId, characterId);
              favoritesStore.delete(key);
              return Promise.resolve({ error: null });
            }
            return chain;
          }),
        };
        return chain;
      }),

      select: vi.fn(() => {
        // Chainable select â†’ eq â†’ eq â†’ order for getUserFavorites
        let userId: string | null = null;

        const chain = {
          eq: vi.fn((col: string, val: string) => {
            if (col === "user_id") userId = val;
            return chain;
          }),
          order: vi.fn((column: string, opts?: { ascending: boolean }) => {
            // Build rows from the store for this user
            const rows = [...favoritesStore]
              .filter((k) => k.startsWith(`${userId}::`))
              .map((k, i) => {
                const charId = k.split("::")[1];
                // Assign decreasing timestamps so the store order matches desc sort
                const ts = new Date(2025, 0, 1, 0, 0, 0, 0).getTime() - i * 60_000;
                return {
                  character_id: charId,
                  created_at: new Date(ts).toISOString(),
                  characters: {
                    id: charId,
                    slug: `slug-${charId.slice(0, 8)}`,
                    main_image: null,
                    background_color: null,
                    character_translations: [{ name: `Char ${charId.slice(0, 4)}`, role: null }],
                    character_games: [
                      {
                        is_primary: true,
                        games: { game_translations: [{ title: "Test Game" }] },
                      },
                    ],
                  },
                };
              });

            return Promise.resolve({ data: rows, error: null });
          }),
        };
        return chain;
      }),
    })),

    rpc: vi.fn((fnName: string, params: Record<string, string>) => {
      if (fnName === "is_character_favorited") {
        const key = storeKey(params.user_uuid, params.character_uuid);
        return Promise.resolve({ data: favoritesStore.has(key), error: null });
      }
      if (fnName === "get_character_favorite_count") {
        const charId = params.character_uuid;
        const count = [...favoritesStore].filter((k) => k.endsWith(`::${charId}`)).length;
        return Promise.resolve({ data: count, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
  };
}

let mockClient: ReturnType<typeof buildMockClient>;

vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(async () => mockClient),
  createRouteHandlerClient: vi.fn(async () => mockClient),
}));

// Import after mocking
import { CharacterFavoriteService } from "../../../../src/lib/services/characterFavoriteService";

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const userIdGen = fc.uuid();
const characterIdGen = fc.uuid();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CharacterFavoriteService â€” Property-Based Tests", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    favoritesStore = new Set();
    insertCalls = [];
    mockClient = buildMockClient();
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // Feature: character-favorites, Property 1: Aller-retour ajout/suppression
  // **Validates: Requirements 1.1, 1.2**
  // -------------------------------------------------------------------------
  describe("Property 1: Aller-retour ajout/suppression de favori", () => {
    it("adding then removing a favorite restores the initial non-favorited state", async () => {
      await fc.assert(
        fc.asyncProperty(userIdGen, characterIdGen, async (userId, characterId) => {
          // Reset store for each iteration
          favoritesStore = new Set();
          mockClient = buildMockClient();

          // Pre-condition: not favorited
          const before = await CharacterFavoriteService.isFavorite(characterId, userId);
          expect(before).toBe(false);

          // Add favorite
          await CharacterFavoriteService.addFavorite(characterId, userId);
          const afterAdd = await CharacterFavoriteService.isFavorite(characterId, userId);
          expect(afterAdd).toBe(true);

          // Remove favorite
          await CharacterFavoriteService.removeFavorite(characterId, userId);
          const afterRemove = await CharacterFavoriteService.isFavorite(characterId, userId);
          expect(afterRemove).toBe(false);
        }),
        { numRuns: 30 }
      );
    });
  });

  // -------------------------------------------------------------------------
  // Feature: character-favorites, Property 3: Exactitude du compteur de favoris
  // **Validates: Requirements 2.1, 2.2, 2.3**
  // -------------------------------------------------------------------------
  describe("Property 3: Exactitude du compteur de favoris", () => {
    it("getFavoriteCount equals the number of distinct users who favorited a character", async () => {
      await fc.assert(
        fc.asyncProperty(
          characterIdGen,
          fc.uniqueArray(userIdGen, { minLength: 0, maxLength: 15 }),
          async (characterId, userIds) => {
            // Reset store
            favoritesStore = new Set();
            mockClient = buildMockClient();

            // Each user adds the character as favorite
            for (const uid of userIds) {
              await CharacterFavoriteService.addFavorite(characterId, uid);
            }

            const count = await CharacterFavoriteService.getFavoriteCount(characterId);
            expect(count).toBe(userIds.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("count decrements correctly when a user removes a favorite", async () => {
      await fc.assert(
        fc.asyncProperty(
          characterIdGen,
          fc.uniqueArray(userIdGen, { minLength: 2, maxLength: 10 }),
          async (characterId, userIds) => {
            favoritesStore = new Set();
            mockClient = buildMockClient();

            // All users add the favorite
            for (const uid of userIds) {
              await CharacterFavoriteService.addFavorite(characterId, uid);
            }

            // Remove the first user's favorite
            await CharacterFavoriteService.removeFavorite(characterId, userIds[0]);

            const count = await CharacterFavoriteService.getFavoriteCount(characterId);
            expect(count).toBe(userIds.length - 1);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  // -------------------------------------------------------------------------
  // Feature: character-favorites, Property 4: Tri des favoris par date dÃ©croissante
  // **Validates: Requirements 3.1**
  // -------------------------------------------------------------------------
  describe("Property 4: Tri des favoris par date dÃ©croissante", () => {
    it("getUserFavorites returns items sorted by created_at descending", async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdGen,
          fc.uniqueArray(characterIdGen, { minLength: 1, maxLength: 10 }),
          async (userId, characterIds) => {
            favoritesStore = new Set();
            mockClient = buildMockClient();

            // Add favorites sequentially
            for (const cid of characterIds) {
              await CharacterFavoriteService.addFavorite(cid, userId);
            }

            const favorites = await CharacterFavoriteService.getUserFavorites(userId, "fr");

            expect(favorites.length).toBe(characterIds.length);

            // Verify descending order: each date >= next date
            for (let i = 0; i < favorites.length - 1; i++) {
              const current = new Date(favorites[i].favoritedAt).getTime();
              const next = new Date(favorites[i + 1].favoritedAt).getTime();
              expect(current).toBeGreaterThanOrEqual(next);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  // -------------------------------------------------------------------------
  // Feature: character-favorites, Property 6: UnicitÃ© des favoris
  // **Validates: Requirements 5.2**
  // -------------------------------------------------------------------------
  describe("Property 6: UnicitÃ© des favoris", () => {
    it("adding the same favorite twice throws a unique constraint error and count stays at 1", async () => {
      await fc.assert(
        fc.asyncProperty(userIdGen, characterIdGen, async (userId, characterId) => {
          favoritesStore = new Set();
          mockClient = buildMockClient();

          // First add succeeds
          await CharacterFavoriteService.addFavorite(characterId, userId);
          const countAfterFirst = await CharacterFavoriteService.getFavoriteCount(characterId);
          expect(countAfterFirst).toBe(1);

          // Second add should throw (unique constraint violation 23505)
          let threw = false;
          try {
            await CharacterFavoriteService.addFavorite(characterId, userId);
          } catch (err: unknown) {
            threw = true;
            expect((err as { code: string }).code).toBe("23505");
          }
          expect(threw).toBe(true);

          // Count must not have increased
          const countAfterSecond = await CharacterFavoriteService.getFavoriteCount(characterId);
          expect(countAfterSecond).toBe(1);
        }),
        { numRuns: 30 }
      );
    });
  });
});
