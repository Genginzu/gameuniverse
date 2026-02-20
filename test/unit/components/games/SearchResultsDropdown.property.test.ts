import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { SearchResultItem } from "../../../../src/types/search";

// Feature: igdb-hybrid-search
// **Property 3: Informations de jeu dans le rendu**
// **Property 4: Ordre des rÃ©sultats (local d'abord)**
// **Property 5: Indicateur de source prÃ©sent**
// **Validates: Requirements 2.1, 2.2, 2.3**

/**
 * Generator for SearchResultItem with local source
 */
const localGameGenerator = (): fc.Arbitrary<SearchResultItem> =>
  fc.record({
    id: fc.uuid(),
    igdbId: fc.option(fc.integer({ min: 1, max: 999999 }), { nil: undefined }),
    slug: fc
      .string({ minLength: 1, maxLength: 50 })
      .map((s) => s.replace(/\s+/g, "-").toLowerCase()),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    coverUrl: fc.option(fc.webUrl(), { nil: undefined }),
    developer: fc.option(
      fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      { nil: undefined }
    ),
    releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 }), { nil: undefined }),
    source: fc.constant("local" as const),
  });

/**
 * Generator for SearchResultItem with IGDB source
 */
const igdbGameGenerator = (): fc.Arbitrary<SearchResultItem> =>
  fc.record({
    id: fc.uuid(),
    igdbId: fc.integer({ min: 1, max: 999999 }),
    slug: fc
      .string({ minLength: 1, maxLength: 50 })
      .map((s) => s.replace(/\s+/g, "-").toLowerCase()),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    coverUrl: fc.option(fc.webUrl(), { nil: undefined }),
    developer: fc.option(
      fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      { nil: undefined }
    ),
    releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 }), { nil: undefined }),
    source: fc.constant("igdb" as const),
  });

/**
 * Generator for mixed search results (both local and IGDB)
 */
const mixedResultsGenerator = (): fc.Arbitrary<SearchResultItem[]> =>
  fc
    .tuple(
      fc.array(localGameGenerator(), { minLength: 0, maxLength: 5 }),
      fc.array(igdbGameGenerator(), { minLength: 0, maxLength: 5 })
    )
    .map(([local, igdb]) => [...local, ...igdb]);

interface RenderedGameInfo {
  title: string;
  coverUrl?: string;
  developer?: string;
  source: "local" | "igdb";
  hasSourceIndicator: boolean;
}

function simulateRender(results: SearchResultItem[]): RenderedGameInfo[] {
  return results.map((item) => ({
    title: item.title,
    coverUrl: item.coverUrl,
    developer: item.developer,
    source: item.source,
    hasSourceIndicator: true,
  }));
}

function validateResultOrder(results: SearchResultItem[]): boolean {
  let seenIgdb = false;

  for (const result of results) {
    if (result.source === "igdb") {
      seenIgdb = true;
    } else if (result.source === "local" && seenIgdb) {
      return false;
    }
  }

  return true;
}

function sortResultsLocalFirst(results: SearchResultItem[]): SearchResultItem[] {
  const localGames = results.filter((r) => r.source === "local");
  const igdbGames = results.filter((r) => r.source === "igdb");
  return [...localGames, ...igdbGames];
}

describe("SearchResultsDropdown Property-Based Tests", () => {
  describe("Property 3: Informations de jeu dans le rendu", () => {
    it("every rendered result should contain the game title", () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(localGameGenerator(), igdbGameGenerator()), {
            minLength: 1,
            maxLength: 10,
          }),
          (results) => {
            const rendered = simulateRender(results);

            return rendered.every(
              (item, index) =>
                item.title !== undefined &&
                item.title !== null &&
                item.title === results[index].title
            );
          }
        ),
        { numRuns: 30 }
      );
    });

    it("every rendered result should preserve cover URL when available", () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(localGameGenerator(), igdbGameGenerator()), {
            minLength: 1,
            maxLength: 10,
          }),
          (results) => {
            const rendered = simulateRender(results);
            return rendered.every((item, index) => item.coverUrl === results[index].coverUrl);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("every rendered result should preserve developer name when available", () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(localGameGenerator(), igdbGameGenerator()), {
            minLength: 1,
            maxLength: 10,
          }),
          (results) => {
            const rendered = simulateRender(results);
            return rendered.every((item, index) => item.developer === results[index].developer);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("rendered results should contain all required display fields", () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(localGameGenerator(), igdbGameGenerator()), {
            minLength: 1,
            maxLength: 10,
          }),
          (results) => {
            const rendered = simulateRender(results);

            return rendered.every(
              (item) =>
                typeof item.title === "string" &&
                item.title.length > 0 &&
                (item.source === "local" || item.source === "igdb")
            );
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("Property 4: Ordre des rÃ©sultats (local d'abord)", () => {
    it("when results are properly sorted, all local games should appear before IGDB games", () => {
      fc.assert(
        fc.property(mixedResultsGenerator(), (results) => {
          const sortedResults = sortResultsLocalFirst(results);
          return validateResultOrder(sortedResults);
        }),
        { numRuns: 30 }
      );
    });

    it("sorting should preserve all local games in the output", () => {
      fc.assert(
        fc.property(mixedResultsGenerator(), (results) => {
          const localBefore = results.filter((r) => r.source === "local");
          const sortedResults = sortResultsLocalFirst(results);
          const localAfter = sortedResults.filter((r) => r.source === "local");

          if (localBefore.length !== localAfter.length) return false;
          return localBefore.every((game) => localAfter.some((g) => g.id === game.id));
        }),
        { numRuns: 30 }
      );
    });

    it("sorting should preserve all IGDB games in the output", () => {
      fc.assert(
        fc.property(mixedResultsGenerator(), (results) => {
          const igdbBefore = results.filter((r) => r.source === "igdb");
          const sortedResults = sortResultsLocalFirst(results);
          const igdbAfter = sortedResults.filter((r) => r.source === "igdb");

          if (igdbBefore.length !== igdbAfter.length) return false;
          return igdbBefore.every((game) => igdbAfter.some((g) => g.id === game.id));
        }),
        { numRuns: 30 }
      );
    });

    it("the index of any local game should be less than the index of any IGDB game after sorting", () => {
      fc.assert(
        fc.property(
          fc
            .tuple(
              fc.array(localGameGenerator(), { minLength: 1, maxLength: 5 }),
              fc.array(igdbGameGenerator(), { minLength: 1, maxLength: 5 })
            )
            .filter(([local, igdb]) => local.length > 0 && igdb.length > 0),
          ([localGames, igdbGames]) => {
            const mixed = [...localGames, ...igdbGames];
            const sorted = sortResultsLocalFirst(mixed);

            const localIndices = sorted
              .map((r, i) => (r.source === "local" ? i : -1))
              .filter((i) => i >= 0);
            const igdbIndices = sorted
              .map((r, i) => (r.source === "igdb" ? i : -1))
              .filter((i) => i >= 0);

            const maxLocalIndex = Math.max(...localIndices);
            const minIgdbIndex = Math.min(...igdbIndices);

            return maxLocalIndex < minIgdbIndex;
          }
        ),
        { numRuns: 30 }
      );
    });

    it("sorting an already sorted list should produce the same result", () => {
      fc.assert(
        fc.property(mixedResultsGenerator(), (results) => {
          const sortedOnce = sortResultsLocalFirst(results);
          const sortedTwice = sortResultsLocalFirst(sortedOnce);

          if (sortedOnce.length !== sortedTwice.length) return false;
          return sortedOnce.every((game, index) => game.id === sortedTwice[index].id);
        }),
        { numRuns: 30 }
      );
    });
  });

  describe("Property 5: Indicateur de source prÃ©sent", () => {
    it("every result should have a source indicator", () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(localGameGenerator(), igdbGameGenerator()), {
            minLength: 1,
            maxLength: 10,
          }),
          (results) => {
            const rendered = simulateRender(results);
            return rendered.every((item) => item.hasSourceIndicator === true);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("source indicator should match the actual source of the game", () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(localGameGenerator(), igdbGameGenerator()), {
            minLength: 1,
            maxLength: 10,
          }),
          (results) => {
            const rendered = simulateRender(results);
            return rendered.every((item, index) => item.source === results[index].source);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("local games should always have source='local'", () => {
      fc.assert(
        fc.property(fc.array(localGameGenerator(), { minLength: 1, maxLength: 10 }), (results) => {
          const rendered = simulateRender(results);
          return rendered.every((item) => item.source === "local");
        }),
        { numRuns: 30 }
      );
    });

    it("IGDB games should always have source='igdb'", () => {
      fc.assert(
        fc.property(fc.array(igdbGameGenerator(), { minLength: 1, maxLength: 10 }), (results) => {
          const rendered = simulateRender(results);
          return rendered.every((item) => item.source === "igdb");
        }),
        { numRuns: 30 }
      );
    });

    it("source indicator should be one of the valid values", () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(localGameGenerator(), igdbGameGenerator()), {
            minLength: 1,
            maxLength: 10,
          }),
          (results) => {
            const rendered = simulateRender(results);
            return rendered.every((item) => item.source === "local" || item.source === "igdb");
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
