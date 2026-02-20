import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: character-pages
 * Property 3: Multi-Filter Conjunction
 * **Validates: Requirements 3.1, 3.2, 3.3**
 *
 * For any combination of filters (games and/or roles), the displayed characters
 * should match ALL selected filter criteria (AND logic, not OR).
 *
 * This test validates the filter logic to ensure that when multiple filters are
 * applied, only characters matching all criteria are returned.
 */

// Available roles matching the CharacterFilters component
const AVAILABLE_ROLES = ["protagonist", "antagonist", "supporting", "npc", "playable"] as const;
type Role = (typeof AVAILABLE_ROLES)[number];

// Character with game associations for testing
interface TestCharacter {
  id: string;
  name: string;
  role: Role | undefined;
  gameIds: string[];
}

// Generator for character with game associations
const testCharacterGenerator = (availableGameIds: string[]): fc.Arbitrary<TestCharacter> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    role: fc.option(fc.constantFrom(...AVAILABLE_ROLES), { nil: undefined }),
    gameIds:
      availableGameIds.length > 0
        ? fc.subarray(availableGameIds, { minLength: 1 })
        : fc.constant([]),
  });

/**
 * Simulates the multi-filter conjunction logic from the API and frontend.
 * This mirrors the actual filtering behavior in:
 * - src/app/api/characters/route.ts (backend filtering)
 * - src/components/characters/AllCharactersContent.tsx (frontend state)
 */
const applyFilters = (
  characters: TestCharacter[],
  selectedGames: string[],
  selectedRoles: string[]
): TestCharacter[] => {
  return characters.filter((character) => {
    // Game filter: character must appear in at least one of the selected games
    // (OR within games, but AND with other filter types)
    const matchesGameFilter =
      selectedGames.length === 0 ||
      selectedGames.some((gameId) => character.gameIds.includes(gameId));

    // Role filter: character must have one of the selected roles
    // (OR within roles, but AND with other filter types)
    const matchesRoleFilter =
      selectedRoles.length === 0 ||
      (character.role !== undefined && selectedRoles.includes(character.role));

    // Multi-filter conjunction: ALL filter types must match (AND logic)
    return matchesGameFilter && matchesRoleFilter;
  });
};

// Pre-generate a fixed set of game IDs for consistent testing
const FIXED_GAME_IDS = ["game-001", "game-002", "game-003", "game-004", "game-005"];

describe("CharacterFilters Property-Based Tests", () => {
  describe("Property 3: Multi-Filter Conjunction", () => {
    it("returns all characters when no filters are applied", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator(FIXED_GAME_IDS), { minLength: 0, maxLength: 20 }),
          (characters) => {
            const result = applyFilters(characters, [], []);

            // With no filters, all characters should be returned
            expect(result.length).toBe(characters.length);
            expect(result).toEqual(characters);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("filters by game only when game filter is applied", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator(FIXED_GAME_IDS), { minLength: 1, maxLength: 20 }),
          fc.subarray(FIXED_GAME_IDS, { minLength: 1 }),
          (characters, selectedGames) => {
            const result = applyFilters(characters, selectedGames, []);

            // All returned characters must appear in at least one selected game
            for (const character of result) {
              const appearsInSelectedGame = selectedGames.some((gameId) =>
                character.gameIds.includes(gameId)
              );
              expect(appearsInSelectedGame).toBe(true);
            }

            // Verify count matches expected
            const expectedCount = characters.filter((c) =>
              selectedGames.some((gameId) => c.gameIds.includes(gameId))
            ).length;
            expect(result.length).toBe(expectedCount);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("filters by role only when role filter is applied", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator(FIXED_GAME_IDS), { minLength: 1, maxLength: 20 }),
          fc.subarray([...AVAILABLE_ROLES], { minLength: 1 }),
          (characters, selectedRoles) => {
            const result = applyFilters(characters, [], selectedRoles);

            // All returned characters must have one of the selected roles
            for (const character of result) {
              expect(character.role).toBeDefined();
              expect(selectedRoles).toContain(character.role);
            }

            // Verify count matches expected
            const expectedCount = characters.filter(
              (c) => c.role !== undefined && selectedRoles.includes(c.role)
            ).length;
            expect(result.length).toBe(expectedCount);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("applies AND logic when both game and role filters are active", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator(FIXED_GAME_IDS), { minLength: 1, maxLength: 20 }),
          fc.subarray(FIXED_GAME_IDS, { minLength: 1 }),
          fc.subarray([...AVAILABLE_ROLES], { minLength: 1 }),
          (characters, selectedGames, selectedRoles) => {
            const result = applyFilters(characters, selectedGames, selectedRoles);

            // All returned characters must match BOTH filters
            for (const character of result) {
              // Must appear in at least one selected game
              const appearsInSelectedGame = selectedGames.some((gameId) =>
                character.gameIds.includes(gameId)
              );
              expect(appearsInSelectedGame).toBe(true);

              // Must have one of the selected roles
              expect(character.role).toBeDefined();
              expect(selectedRoles).toContain(character.role);
            }

            // Verify count matches expected
            const expectedCount = characters.filter((c) => {
              const matchesGame = selectedGames.some((gameId) => c.gameIds.includes(gameId));
              const matchesRole = c.role !== undefined && selectedRoles.includes(c.role);
              return matchesGame && matchesRole;
            }).length;
            expect(result.length).toBe(expectedCount);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("returns empty array when no characters match all filters", () => {
      // Create characters that only have "protagonist" role
      const charactersWithProtagonistOnly: TestCharacter[] = [
        {
          id: "test-1",
          name: "Test Character 1",
          role: "protagonist",
          gameIds: [FIXED_GAME_IDS[0]],
        },
        {
          id: "test-2",
          name: "Test Character 2",
          role: "protagonist",
          gameIds: [FIXED_GAME_IDS[1]],
        },
      ];

      // Filter for "antagonist" role - should return empty
      const result = applyFilters(
        charactersWithProtagonistOnly,
        [FIXED_GAME_IDS[0]],
        ["antagonist"]
      );

      expect(result.length).toBe(0);
    });

    it("filter result is always a subset of the original list", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator(FIXED_GAME_IDS), { minLength: 0, maxLength: 20 }),
          fc.subarray(FIXED_GAME_IDS, { minLength: 0 }),
          fc.subarray([...AVAILABLE_ROLES], { minLength: 0 }),
          (characters, selectedGames, selectedRoles) => {
            const result = applyFilters(characters, selectedGames, selectedRoles);

            // Result should never be larger than input
            expect(result.length).toBeLessThanOrEqual(characters.length);

            // Every result item should exist in the original list
            for (const character of result) {
              const existsInOriginal = characters.some((c) => c.id === character.id);
              expect(existsInOriginal).toBe(true);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("adding more filters never increases result count", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator(FIXED_GAME_IDS), { minLength: 1, maxLength: 20 }),
          fc.subarray(FIXED_GAME_IDS, { minLength: 1 }),
          fc.subarray([...AVAILABLE_ROLES], { minLength: 1 }),
          (characters, selectedGames, selectedRoles) => {
            // Apply only game filter
            const gameOnlyResult = applyFilters(characters, selectedGames, []);

            // Apply both game and role filters
            const bothFiltersResult = applyFilters(characters, selectedGames, selectedRoles);

            // Adding role filter should not increase results
            expect(bothFiltersResult.length).toBeLessThanOrEqual(gameOnlyResult.length);

            // Apply only role filter
            const roleOnlyResult = applyFilters(characters, [], selectedRoles);

            // Adding game filter should not increase results
            expect(bothFiltersResult.length).toBeLessThanOrEqual(roleOnlyResult.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("filter application is idempotent", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator(FIXED_GAME_IDS), { minLength: 0, maxLength: 20 }),
          fc.subarray(FIXED_GAME_IDS, { minLength: 0 }),
          fc.subarray([...AVAILABLE_ROLES], { minLength: 0 }),
          (characters, selectedGames, selectedRoles) => {
            const firstResult = applyFilters(characters, selectedGames, selectedRoles);
            const secondResult = applyFilters(firstResult, selectedGames, selectedRoles);

            // Applying the same filters twice should give the same result
            expect(secondResult.length).toBe(firstResult.length);
            expect(secondResult).toEqual(firstResult);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Feature: character-pages
   * Property 4: Filter Clear Round-Trip
   * **Validates: Requirements 3.4**
   *
   * For any initial character list state, applying filters then clearing all
   * filters should return to displaying the same complete character list.
   */
  describe("Property 4: Filter Clear Round-Trip", () => {
    /**
     * Simulates the clear filters action from CharacterFilters component.
     * When onClearFilters is called, both selectedGames and selectedRoles
     * are reset to empty arrays.
     */
    const clearFilters = (): { selectedGames: string[]; selectedRoles: string[] } => ({
      selectedGames: [],
      selectedRoles: [],
    });

    it("clearing filters after applying game filters returns complete list", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator(FIXED_GAME_IDS), { minLength: 1, maxLength: 20 }),
          fc.subarray(FIXED_GAME_IDS, { minLength: 1 }),
          (characters, selectedGames) => {
            // Step 1: Start with complete list (no filters)
            const initialList = applyFilters(characters, [], []);

            // Step 2: Apply game filters
            const filteredList = applyFilters(characters, selectedGames, []);

            // Step 3: Clear all filters
            const clearedState = clearFilters();
            const afterClearList = applyFilters(
              characters,
              clearedState.selectedGames,
              clearedState.selectedRoles
            );

            // Verify: After clearing, we should have the same list as initial
            expect(afterClearList.length).toBe(initialList.length);
            expect(afterClearList).toEqual(initialList);

            // Also verify the filtered list was actually different (when filters matched something)
            // This ensures the test is meaningful
            if (filteredList.length < characters.length) {
              expect(filteredList.length).toBeLessThan(afterClearList.length);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("clearing filters after applying role filters returns complete list", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator(FIXED_GAME_IDS), { minLength: 1, maxLength: 20 }),
          fc.subarray([...AVAILABLE_ROLES], { minLength: 1 }),
          (characters, selectedRoles) => {
            // Step 1: Start with complete list (no filters)
            const initialList = applyFilters(characters, [], []);

            // Step 2: Apply role filters
            const filteredList = applyFilters(characters, [], selectedRoles);

            // Step 3: Clear all filters
            const clearedState = clearFilters();
            const afterClearList = applyFilters(
              characters,
              clearedState.selectedGames,
              clearedState.selectedRoles
            );

            // Verify: After clearing, we should have the same list as initial
            expect(afterClearList.length).toBe(initialList.length);
            expect(afterClearList).toEqual(initialList);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("clearing filters after applying both game and role filters returns complete list", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator(FIXED_GAME_IDS), { minLength: 1, maxLength: 20 }),
          fc.subarray(FIXED_GAME_IDS, { minLength: 1 }),
          fc.subarray([...AVAILABLE_ROLES], { minLength: 1 }),
          (characters, selectedGames, selectedRoles) => {
            // Step 1: Start with complete list (no filters)
            const initialList = applyFilters(characters, [], []);

            // Step 2: Apply both game and role filters
            const filteredList = applyFilters(characters, selectedGames, selectedRoles);

            // Step 3: Clear all filters
            const clearedState = clearFilters();
            const afterClearList = applyFilters(
              characters,
              clearedState.selectedGames,
              clearedState.selectedRoles
            );

            // Verify: After clearing, we should have the same list as initial
            expect(afterClearList.length).toBe(initialList.length);
            expect(afterClearList).toEqual(initialList);

            // The filtered list should be a subset (or equal) to the complete list
            expect(filteredList.length).toBeLessThanOrEqual(initialList.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("multiple filter-clear cycles always return to the same initial state", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator(FIXED_GAME_IDS), { minLength: 1, maxLength: 20 }),
          fc.array(
            fc.record({
              games: fc.subarray(FIXED_GAME_IDS, { minLength: 0 }),
              roles: fc.subarray([...AVAILABLE_ROLES], { minLength: 0 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (characters, filterCycles) => {
            // Get the initial complete list
            const initialList = applyFilters(characters, [], []);

            // Perform multiple filter-clear cycles
            for (const filters of filterCycles) {
              // Apply filters
              const filteredList = applyFilters(characters, filters.games, filters.roles);

              // Filtered list should be subset of initial
              expect(filteredList.length).toBeLessThanOrEqual(initialList.length);

              // Clear filters
              const clearedState = clearFilters();
              const afterClearList = applyFilters(
                characters,
                clearedState.selectedGames,
                clearedState.selectedRoles
              );

              // After each clear, we should return to initial state
              expect(afterClearList.length).toBe(initialList.length);
              expect(afterClearList).toEqual(initialList);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("clear filters resets both selectedGames and selectedRoles to empty arrays", () => {
      fc.assert(
        fc.property(
          fc.subarray(FIXED_GAME_IDS, { minLength: 1 }),
          fc.subarray([...AVAILABLE_ROLES], { minLength: 1 }),
          (selectedGames, selectedRoles) => {
            // Verify we have active filters before clearing
            expect(selectedGames.length).toBeGreaterThan(0);
            expect(selectedRoles.length).toBeGreaterThan(0);

            // Clear filters
            const clearedState = clearFilters();

            // Both should be empty arrays
            expect(clearedState.selectedGames).toEqual([]);
            expect(clearedState.selectedRoles).toEqual([]);
            expect(clearedState.selectedGames.length).toBe(0);
            expect(clearedState.selectedRoles.length).toBe(0);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("clearing already empty filters maintains empty state", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator(FIXED_GAME_IDS), { minLength: 0, maxLength: 20 }),
          (characters) => {
            // Start with no filters
            const initialList = applyFilters(characters, [], []);

            // Clear filters (even though none are active)
            const clearedState = clearFilters();
            const afterClearList = applyFilters(
              characters,
              clearedState.selectedGames,
              clearedState.selectedRoles
            );

            // Should still have the complete list
            expect(afterClearList.length).toBe(initialList.length);
            expect(afterClearList).toEqual(initialList);
            expect(afterClearList).toEqual(characters);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
