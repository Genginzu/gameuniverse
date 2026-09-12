/**
 * Property-Based Tests for Admin Character Search Filter
 *
 * **Validates: Requirements 1.2**
 *
 * Property 4: Search filter
 * For any set of characters and any non-empty search term, all returned
 * characters must have a name containing the search term (case-insensitive),
 * and no character whose name contains the term should be excluded.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Pure search filter function matching the API's ilike behavior
function filterCharactersByName(
  characters: Array<{ id: string; name: string }>,
  searchTerm: string
): Array<{ id: string; name: string }> {
  if (!searchTerm.trim()) return characters;

  const normalizedTerm = searchTerm.trim().toLowerCase();
  return characters.filter((c) => c.name.toLowerCase().includes(normalizedTerm));
}

// Generators
const characterNameGenerator = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

const characterGenerator = fc.record({
  id: fc.uuid(),
  name: characterNameGenerator,
});

const characterListGenerator = fc.array(characterGenerator, {
  minLength: 0,
  maxLength: 30,
});

const searchTermGenerator = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

// ============================================================================
// Property 4: Search filter
// **Validates: Requirements 1.2**
// ============================================================================

describe("Property 4: Search filter", () => {
  it("all returned characters contain the search term (case-insensitive)", () => {
    fc.assert(
      fc.property(characterListGenerator, searchTermGenerator, (characters, searchTerm) => {
        const results = filterCharactersByName(characters, searchTerm);
        const normalizedTerm = searchTerm.trim().toLowerCase();

        // Every result must contain the search term
        for (const result of results) {
          expect(result.name.toLowerCase()).toContain(normalizedTerm);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("no matching character is excluded from results", () => {
    fc.assert(
      fc.property(characterListGenerator, searchTermGenerator, (characters, searchTerm) => {
        const results = filterCharactersByName(characters, searchTerm);
        const normalizedTerm = searchTerm.trim().toLowerCase();

        // Every character whose name contains the term must be in results
        const expectedMatches = characters.filter((c) =>
          c.name.toLowerCase().includes(normalizedTerm)
        );

        expect(results.length).toBe(expectedMatches.length);

        for (const expected of expectedMatches) {
          expect(results.some((r) => r.id === expected.id)).toBe(true);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("results are a subset of the original characters", () => {
    fc.assert(
      fc.property(characterListGenerator, searchTermGenerator, (characters, searchTerm) => {
        const results = filterCharactersByName(characters, searchTerm);

        expect(results.length).toBeLessThanOrEqual(characters.length);

        for (const result of results) {
          expect(characters.some((c) => c.id === result.id)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("empty search term returns all characters", () => {
    fc.assert(
      fc.property(characterListGenerator, (characters) => {
        const results = filterCharactersByName(characters, "");
        expect(results.length).toBe(characters.length);
      }),
      { numRuns: 100 }
    );
  });

  it("search is case-insensitive: same results regardless of term casing", () => {
    fc.assert(
      fc.property(characterListGenerator, searchTermGenerator, (characters, searchTerm) => {
        const resultsLower = filterCharactersByName(characters, searchTerm.toLowerCase());
        const resultsUpper = filterCharactersByName(characters, searchTerm.toUpperCase());

        expect(resultsLower.length).toBe(resultsUpper.length);

        for (const r of resultsLower) {
          expect(resultsUpper.some((u) => u.id === r.id)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});
