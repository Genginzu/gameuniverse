// Feature: game-dlc-extensions, Property 1: Transformation IGDB → base de données complète et correcte
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  transformIgdbToDlcExtensionRow,
  sortDlcExtensions,
  groupDlcExtensionsByCategory,
} from "@/lib/utils/dlcExtensionUtils";
import type { IGDBDlcExtension } from "@/types/igdb";
import type { DlcExtensionCategory, GameDlcExtension } from "@/types/game";

/**
 * Feature: game-dlc-extensions
 * Property 1: Transformation IGDB → base de données complète et correcte
 * **Validates: Requirements 3.1, 3.2**
 */

const IGDB_COVER_URL_PATTERN =
  /^https:\/\/images\.igdb\.com\/igdb\/image\/upload\/t_cover_big\/.+\.jpg$/;

// --- Smart generators ---

/** Positive IGDB ID */
const igdbIdArb = fc.integer({ min: 1, max: 999_999 });

/** Non-empty name (IGDB always returns a name) */
const nameArb = fc.string({ minLength: 1, maxLength: 200 });

/** Slug-like string */
const slugArb = fc
  .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")), {
    minLength: 1,
    maxLength: 80,
  })
  .map((chars) => chars.join(""));

/** Optional summary */
const summaryArb = fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined });

/** Optional IGDB game_type number (0–14, but can be anything) */
const igdbGameTypeArb = fc.option(
  fc.constantFrom(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14),
  { nil: undefined }
);

/** Optional Unix timestamp for release date (reasonable game era: 1980–2035) */
const releaseDateArb = fc.option(fc.integer({ min: 315_532_800, max: 2_051_222_400 }), {
  nil: undefined,
});

/** IGDB image_id: alphanumeric string like "co1wyy" */
const imageIdArb = fc
  .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")), {
    minLength: 4,
    maxLength: 12,
  })
  .map((chars) => chars.join(""));

/** Optional cover object */
const coverArb = fc.option(
  imageIdArb.map((imageId) => ({ image_id: imageId })),
  {
    nil: undefined,
  }
);

/** Full IGDBDlcExtension generator */
const igdbDlcExtensionArb: fc.Arbitrary<IGDBDlcExtension> = fc.record({
  id: igdbIdArb,
  name: nameArb,
  slug: slugArb,
  summary: summaryArb,
  game_type: igdbGameTypeArb,
  first_release_date: releaseDateArb,
  cover: coverArb,
});

/** Source category (determined by parent game field, not IGDB game_type) */
const sourceCategoryArb: fc.Arbitrary<DlcExtensionCategory> = fc.constantFrom(
  "dlc",
  "expansion",
  "bundle",
  "mod",
  "episode",
  "season",
  "remake",
  "remaster",
  "expanded_game",
  "port",
  "fork",
  "pack",
  "update"
);

/** UUID v4 for gameId */
const hexChars = "0123456789abcdef".split("");
const hexStringArb = (len: number) =>
  fc.array(fc.constantFrom(...hexChars), { minLength: len, maxLength: len }).map((c) => c.join(""));

const gameIdArb = fc
  .tuple(hexStringArb(8), hexStringArb(4), hexStringArb(4), hexStringArb(4), hexStringArb(12))
  .map(([a, b, c, d, e]) => `${a}-${b}-${c}-${d}-${e}`);

/** Display order */
const displayOrderArb = fc.integer({ min: 0, max: 1000 });

describe("Property 1: Transformation IGDB → base de données complète et correcte", () => {
  it("produces a row with non-null igdb_id matching the input ID", () => {
    fc.assert(
      fc.property(
        igdbDlcExtensionArb,
        gameIdArb,
        sourceCategoryArb,
        displayOrderArb,
        (extension, gameId, sourceCategory, displayOrder) => {
          const row = transformIgdbToDlcExtensionRow(
            extension,
            gameId,
            sourceCategory,
            displayOrder
          );

          expect(row.igdb_id).not.toBeNull();
          expect(row.igdb_id).toBe(extension.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("produces a row with a non-empty name", () => {
    fc.assert(
      fc.property(
        igdbDlcExtensionArb,
        gameIdArb,
        sourceCategoryArb,
        displayOrderArb,
        (extension, gameId, sourceCategory, displayOrder) => {
          const row = transformIgdbToDlcExtensionRow(
            extension,
            gameId,
            sourceCategory,
            displayOrder
          );

          expect(row.name).toBeTruthy();
          expect(row.name.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("produces a row with a valid DlcExtensionCategory", () => {
    fc.assert(
      fc.property(
        igdbDlcExtensionArb,
        gameIdArb,
        sourceCategoryArb,
        displayOrderArb,
        (extension, gameId, sourceCategory, displayOrder) => {
          const row = transformIgdbToDlcExtensionRow(
            extension,
            gameId,
            sourceCategory,
            displayOrder
          );

          const validCategories = [
            "dlc",
            "expansion",
            "bundle",
            "mod",
            "episode",
            "season",
            "remake",
            "remaster",
            "expanded_game",
            "port",
            "fork",
            "pack",
            "update",
          ];
          expect(validCategories).toContain(row.category);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("produces a valid IGDB cover URL when input has a cover image_id, null otherwise", () => {
    fc.assert(
      fc.property(
        igdbDlcExtensionArb,
        gameIdArb,
        sourceCategoryArb,
        displayOrderArb,
        (extension, gameId, sourceCategory, displayOrder) => {
          const row = transformIgdbToDlcExtensionRow(
            extension,
            gameId,
            sourceCategory,
            displayOrder
          );

          if (extension.cover?.image_id) {
            expect(row.cover_image_url).not.toBeNull();
            expect(row.cover_image_url).toMatch(IGDB_COVER_URL_PATTERN);
            expect(row.cover_image_url).toContain(extension.cover.image_id);
          } else {
            expect(row.cover_image_url).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("preserves the game_id and display_order from the input arguments", () => {
    fc.assert(
      fc.property(
        igdbDlcExtensionArb,
        gameIdArb,
        sourceCategoryArb,
        displayOrderArb,
        (extension, gameId, sourceCategory, displayOrder) => {
          const row = transformIgdbToDlcExtensionRow(
            extension,
            gameId,
            sourceCategory,
            displayOrder
          );

          expect(row.game_id).toBe(gameId);
          expect(row.display_order).toBe(displayOrder);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("uses game_type when available, falls back to sourceCategory", () => {
    fc.assert(
      fc.property(
        igdbDlcExtensionArb,
        gameIdArb,
        sourceCategoryArb,
        displayOrderArb,
        (extension, gameId, sourceCategory, displayOrder) => {
          const row = transformIgdbToDlcExtensionRow(
            extension,
            gameId,
            sourceCategory,
            displayOrder
          );

          if (extension.game_type !== undefined) {
            // game_type takes precedence
            const validCategories = [
              "dlc",
              "expansion",
              "bundle",
              "mod",
              "episode",
              "season",
              "remake",
              "remaster",
              "expanded_game",
              "port",
              "fork",
              "pack",
              "update",
            ];
            expect(validCategories).toContain(row.category);
          } else {
            expect(row.category).toBe(sourceCategory);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("converts release_date to ISO date string or null", () => {
    fc.assert(
      fc.property(
        igdbDlcExtensionArb,
        gameIdArb,
        sourceCategoryArb,
        displayOrderArb,
        (extension, gameId, sourceCategory, displayOrder) => {
          const row = transformIgdbToDlcExtensionRow(
            extension,
            gameId,
            sourceCategory,
            displayOrder
          );

          if (extension.first_release_date !== undefined && extension.first_release_date !== null) {
            expect(row.release_date).not.toBeNull();
            // ISO date format: YYYY-MM-DD
            expect(row.release_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          } else {
            expect(row.release_date).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: game-dlc-extensions, Property 2: Tri des contenus additionnels par catégorie puis par date

/**
 * Feature: game-dlc-extensions
 * Property 2: Tri des contenus additionnels par catégorie puis par date
 * **Validates: Requirements 6.1**
 */

// --- Smart generators for GameDlcExtension ---

/** Category generator */
const categoryArb: fc.Arbitrary<DlcExtensionCategory> = fc.constantFrom(
  "dlc",
  "expansion",
  "bundle",
  "mod",
  "episode",
  "season",
  "remake",
  "remaster",
  "expanded_game",
  "port",
  "fork",
  "pack",
  "update"
);

/** UUID v4 generator */
const uuidArb = fc
  .tuple(hexStringArb(8), hexStringArb(4), hexStringArb(4), hexStringArb(4), hexStringArb(12))
  .map(([a, b, c, d, e]) => `${a}-${b}-${c}-${d}-${e}`);

/** ISO date string (YYYY-MM-DD) or null — built from integer components to avoid invalid Date issues */
const releaseDateStringArb = fc.option(
  fc
    .tuple(
      fc.integer({ min: 1980, max: 2035 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 }) // 28 to avoid invalid day-of-month
    )
    .map(([y, m, d]) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`),
  { nil: null }
);

/** Full GameDlcExtension generator */
const gameDlcExtensionArb: fc.Arbitrary<GameDlcExtension> = fc.record({
  id: uuidArb,
  igdbId: igdbIdArb,
  name: nameArb,
  slug: slugArb,
  summary: fc.option(fc.string({ minLength: 1, maxLength: 300 }), { nil: null }),
  category: categoryArb,
  coverImageUrl: fc.option(
    imageIdArb.map((id) => `https://images.igdb.com/igdb/image/upload/t_cover_big/${id}.jpg`),
    { nil: null }
  ),
  releaseDate: releaseDateStringArb,
  gameSlug: fc.option(slugArb, { nil: null }),
});

/** Defined category order for assertions */
const CATEGORY_ORDER: Record<DlcExtensionCategory, number> = {
  dlc: 0,
  expansion: 1,
  bundle: 2,
  episode: 3,
  season: 4,
  pack: 5,
  mod: 6,
  remake: 7,
  remaster: 8,
  expanded_game: 9,
  port: 10,
  fork: 11,
  update: 12,
};

describe("Property 2: Tri des contenus additionnels par catégorie puis par date", () => {
  it("produces a list where categories appear in the defined order (dlc < expansion < bundle)", () => {
    fc.assert(
      fc.property(fc.array(gameDlcExtensionArb, { minLength: 0, maxLength: 50 }), (extensions) => {
        const sorted = sortDlcExtensions(extensions);

        // Categories should appear in non-decreasing order
        for (let i = 1; i < sorted.length; i++) {
          expect(CATEGORY_ORDER[sorted[i].category]).toBeGreaterThanOrEqual(
            CATEGORY_ORDER[sorted[i - 1].category]
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it("keeps all items of the same category contiguous", () => {
    fc.assert(
      fc.property(fc.array(gameDlcExtensionArb, { minLength: 0, maxLength: 50 }), (extensions) => {
        const sorted = sortDlcExtensions(extensions);

        // Track seen categories; once a category ends, it should not reappear
        const seenCategories = new Set<DlcExtensionCategory>();
        let currentCategory: DlcExtensionCategory | null = null;

        for (const item of sorted) {
          if (item.category !== currentCategory) {
            expect(seenCategories.has(item.category)).toBe(false);
            if (currentCategory !== null) {
              seenCategories.add(currentCategory);
            }
            currentCategory = item.category;
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("within each category group, items are ordered by release date ascending with nulls last", () => {
    fc.assert(
      fc.property(fc.array(gameDlcExtensionArb, { minLength: 0, maxLength: 50 }), (extensions) => {
        const sorted = sortDlcExtensions(extensions);

        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].category !== sorted[i - 1].category) continue;

          const prevDate = sorted[i - 1].releaseDate;
          const currDate = sorted[i].releaseDate;

          // Null dates come last within a category
          if (prevDate === null) {
            expect(currDate).toBeNull();
          } else if (currDate !== null) {
            expect(prevDate <= currDate).toBe(true);
          }
          // prevDate non-null, currDate null is valid (null goes last)
        }
      }),
      { numRuns: 100 }
    );
  });

  it("does not mutate the input array", () => {
    fc.assert(
      fc.property(fc.array(gameDlcExtensionArb, { minLength: 1, maxLength: 30 }), (extensions) => {
        const original = extensions.map((e) => ({ ...e }));
        sortDlcExtensions(extensions);

        expect(extensions).toEqual(original);
      }),
      { numRuns: 100 }
    );
  });

  it("preserves all elements (no items lost or duplicated)", () => {
    fc.assert(
      fc.property(fc.array(gameDlcExtensionArb, { minLength: 0, maxLength: 50 }), (extensions) => {
        const sorted = sortDlcExtensions(extensions);

        expect(sorted).toHaveLength(extensions.length);

        // Every input item should appear in the output (by reference check on id)
        const inputIds = extensions.map((e) => e.id).sort();
        const outputIds = sorted.map((e) => e.id).sort();
        expect(outputIds).toEqual(inputIds);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: game-dlc-extensions, Property 3: Regroupement par catégorie

/**
 * Feature: game-dlc-extensions
 * Property 3: Regroupement par catégorie
 * **Validates: Requirements 7.3**
 */

describe("Property 3: Regroupement par catégorie", () => {
  it("every item in a group has the matching category", () => {
    fc.assert(
      fc.property(fc.array(gameDlcExtensionArb, { minLength: 0, maxLength: 50 }), (extensions) => {
        const groups = groupDlcExtensionsByCategory(extensions);

        for (const [category, items] of Object.entries(groups)) {
          for (const item of items!) {
            expect(item.category).toBe(category);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("the union of all groups equals the original list (no items lost or duplicated)", () => {
    fc.assert(
      fc.property(fc.array(gameDlcExtensionArb, { minLength: 0, maxLength: 50 }), (extensions) => {
        const groups = groupDlcExtensionsByCategory(extensions);

        // Collect all items from all groups
        const allGroupedItems = Object.values(groups).flat();

        // Same total count
        expect(allGroupedItems).toHaveLength(extensions.length);

        // Same set of IDs (sorted for comparison)
        const inputIds = extensions.map((e) => e.id).sort();
        const groupedIds = allGroupedItems.map((e) => e.id).sort();
        expect(groupedIds).toEqual(inputIds);
      }),
      { numRuns: 100 }
    );
  });

  it("only non-empty groups are returned", () => {
    fc.assert(
      fc.property(fc.array(gameDlcExtensionArb, { minLength: 0, maxLength: 50 }), (extensions) => {
        const groups = groupDlcExtensionsByCategory(extensions);

        for (const items of Object.values(groups)) {
          expect(items!.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});
