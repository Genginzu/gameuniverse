// Feature: achievements-system, Property 4: Achievement evaluation is idempotent
// **Validates: Requirements 3.7**

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";

// --- Mock setup (same pattern as unit tests) ---

const mockFrom = vi.fn();
const mockSupabaseClient = { from: mockFrom };

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => mockSupabaseClient),
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/services/levelSystem", () => ({
  computeLevel: vi.fn((xp: number) => Math.floor(0.3 * Math.sqrt(Math.max(xp, 0))) + 1),
}));

import { AchievementEngine } from "@/lib/services/achievementEngine";
import type { AchievementCategory } from "@/types/achievement";

// --- Helpers ---

function buildChain(result: { data?: unknown; count?: number | null; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const resolver = () => Promise.resolve(result);
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(resolver);
  chain.single = vi.fn(resolver);
  chain.insert = vi.fn(resolver);
  chain.upsert = vi.fn(resolver);
  chain.update = vi.fn(() => chain);
  chain.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return chain;
}

const CATEGORIES: AchievementCategory[] = [
  "library",
  "playtime",
  "reviews",
  "social",
  "collections",
];

/** Maps category to the table used for counting. */
const CATEGORY_TABLE: Record<AchievementCategory, string> = {
  library: "user_library",
  playtime: "game_sessions",
  reviews: "game_reviews",
  social: "friendships",
  collections: "game_collections",
};

// --- Generators ---

/** Generates a catalog entry with a unique key, threshold ≥ 1, xp ≥ 1. */
const catalogEntryArb = (index: number) =>
  fc.record({
    key: fc.constant(`ach_${index}`),
    threshold: fc.integer({ min: 1, max: 500 }),
    xp_value: fc.integer({ min: 1, max: 200 }),
  });

/** Generates a catalog of 1–8 entries with unique keys. */
const catalogArb = fc
  .integer({ min: 1, max: 8 })
  .chain((size) => fc.tuple(...Array.from({ length: size }, (_, i) => catalogEntryArb(i))));

/** Generates a player count (0–1000). */
const playerCountArb = fc.integer({ min: 0, max: 1000 });

/** Generates a category. */
const categoryArb = fc.constantFrom(...CATEGORIES);

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Property 4: Achievement evaluation is idempotent", () => {
  it("re-evaluating after evaluation produces no new unlocks", async () => {
    await fc.assert(
      fc.asyncProperty(
        catalogArb,
        playerCountArb,
        categoryArb,
        async (catalog, playerCount, category) => {
          vi.clearAllMocks();

          const userId = "user-prop-test";
          const countTable = CATEGORY_TABLE[category];

          // Track which achievements get unlocked during first evaluation
          const unlockedAfterFirst: string[] = [];

          // --- First evaluation: no achievements unlocked yet ---
          let paCallCount = 0;
          let xpCallCount = 0;

          mockFrom.mockImplementation((table: string) => {
            switch (table) {
              case "achievement_catalog":
                return buildChain({ data: catalog, error: null });

              case "player_achievements": {
                if (paCallCount === 0) {
                  paCallCount++;
                  // No achievements unlocked yet
                  return buildChain({ data: [], error: null });
                }
                // Insert succeeds — track the key
                const insertChain = buildChain({ error: null });
                const origInsert = insertChain.insert as ReturnType<typeof vi.fn>;
                insertChain.insert = vi.fn((row: { achievement_key: string }) => {
                  unlockedAfterFirst.push(row.achievement_key);
                  return origInsert(row);
                });
                return insertChain;
              }

              case countTable:
                // For playtime, return duration_minutes data
                if (category === "playtime") {
                  return buildChain({
                    data: [{ duration_minutes: playerCount * 60 }],
                    error: null,
                  });
                }
                // For social (friendships), need sender + receiver counts
                if (category === "social") {
                  return buildChain({
                    data: null,
                    count: playerCount,
                    error: null,
                  });
                }
                return buildChain({
                  data: null,
                  count: playerCount,
                  error: null,
                });

              case "player_xp":
                if (xpCallCount === 0) {
                  xpCallCount++;
                  return buildChain({ data: { xp_total: 0 }, error: null });
                }
                return buildChain({ error: null });

              case "profiles":
                return buildChain({ data: null, error: null });

              default:
                return buildChain({ data: [], error: null });
            }
          });

          const firstResult = await AchievementEngine.evaluate(userId, category);

          // Compute expected XP after first evaluation
          const xpAfterFirst = firstResult.totalXpAwarded;

          // --- Second evaluation: unlocked achievements are now in the set ---
          paCallCount = 0;
          xpCallCount = 0;
          vi.clearAllMocks();

          mockFrom.mockImplementation((table: string) => {
            switch (table) {
              case "achievement_catalog":
                return buildChain({ data: catalog, error: null });

              case "player_achievements": {
                if (paCallCount === 0) {
                  paCallCount++;
                  // Return the achievements unlocked in first evaluation
                  return buildChain({
                    data: unlockedAfterFirst.map((k) => ({
                      achievement_key: k,
                    })),
                    error: null,
                  });
                }
                return buildChain({ error: null });
              }

              case countTable:
                if (category === "playtime") {
                  return buildChain({
                    data: [{ duration_minutes: playerCount * 60 }],
                    error: null,
                  });
                }
                if (category === "social") {
                  return buildChain({
                    data: null,
                    count: playerCount,
                    error: null,
                  });
                }
                return buildChain({
                  data: null,
                  count: playerCount,
                  error: null,
                });

              case "player_xp":
                if (xpCallCount === 0) {
                  xpCallCount++;
                  return buildChain({
                    data: { xp_total: xpAfterFirst },
                    error: null,
                  });
                }
                return buildChain({ error: null });

              case "profiles":
                return buildChain({ data: null, error: null });

              default:
                return buildChain({ data: [], error: null });
            }
          });

          const secondResult = await AchievementEngine.evaluate(userId, category);

          // Idempotence: second evaluation should produce no changes
          expect(secondResult.newlyUnlocked).toEqual([]);
          expect(secondResult.totalXpAwarded).toBe(0);
          expect(secondResult.newLevel).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
