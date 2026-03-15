// Feature: achievements-system, Property 7: Achievement list completeness
// **Validates: Requirements 6.1, 8.1**

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";

// --- Mock setup ---

const mockFrom = vi.fn();
const mockSupabaseClient = { from: mockFrom };

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => mockSupabaseClient),
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { AchievementService } from "@/lib/services/achievementService";

// --- Helpers ---

function buildChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const resolver = () => Promise.resolve(result);
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.single = vi.fn(resolver);
  chain.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return chain;
}

const CATEGORIES = ["library", "playtime", "reviews", "social", "collections"] as const;
const TIERS = ["bronze", "silver", "gold"] as const;
const ICONS = ["BookOpen", "Clock", "Star", "Users", "Folder"] as const;

// --- Generators ---

/** Generates a single catalog row with a unique key based on index. */
const catalogRowArb = (index: number) =>
  fc.record({
    key: fc.constant(`ach_${index}`),
    category: fc.constantFrom(...CATEGORIES),
    tier: fc.constantFrom(...TIERS),
    threshold: fc.integer({ min: 1, max: 500 }),
    xp_value: fc.integer({ min: 1, max: 500 }),
    icon: fc.constantFrom(...ICONS),
    name_fr: fc.string({ minLength: 1, maxLength: 30 }),
    name_en: fc.string({ minLength: 1, maxLength: 30 }),
    description_fr: fc.string({ minLength: 1, maxLength: 60 }),
    description_en: fc.string({ minLength: 1, maxLength: 60 }),
    sort_order: fc.constant(index),
  });

/**
 * Generates a catalog of 1–20 entries with unique keys,
 * paired with a random subset of indices representing unlocked achievements.
 */
const catalogWithUnlockedArb = fc.integer({ min: 1, max: 20 }).chain((size) => {
  const catalogArb = fc.tuple(...Array.from({ length: size }, (_, i) => catalogRowArb(i)));
  const indices = Array.from({ length: size }, (_, i) => i);
  const unlockedIndicesArb = fc.subarray(indices, {
    minLength: 0,
    maxLength: size,
  });
  return fc.tuple(catalogArb, unlockedIndicesArb);
});

const localeArb = fc.constantFrom("fr", "en");

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Property 7: Achievement list completeness", () => {
  it("returns exactly N entries for a catalog of N items, each with valid unlockedAt", async () => {
    await fc.assert(
      fc.asyncProperty(
        catalogWithUnlockedArb,
        localeArb,
        async ([catalog, unlockedIndices], locale) => {
          vi.clearAllMocks();

          // Build unlocked rows from the random subset of indices
          const unlockedRows = unlockedIndices.map((i) => ({
            achievement_key: catalog[i].key,
            unlocked_at: "2024-06-15T12:00:00Z",
          }));
          const unlockedKeySet = new Set(unlockedRows.map((r) => r.achievement_key));

          // Mock Supabase responses
          mockFrom.mockImplementation((table: string) => {
            if (table === "achievement_catalog") {
              return buildChain({ data: catalog, error: null });
            }
            if (table === "player_achievements") {
              return buildChain({ data: unlockedRows, error: null });
            }
            return buildChain({ data: [], error: null });
          });

          const result = await AchievementService.fetchPlayerAchievements(
            "player-prop-test",
            locale
          );

          // Property: result count == catalog count
          expect(result).toHaveLength(catalog.length);

          // Property: each entry has unlockedAt that is either null or a string
          for (const entry of result) {
            if (unlockedKeySet.has(entry.key)) {
              expect(typeof entry.unlockedAt).toBe("string");
            } else {
              expect(entry.unlockedAt).toBeNull();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
