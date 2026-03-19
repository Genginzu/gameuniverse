import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// --- Pure filtering functions that mirror the server-side SQL logic ---

interface GameWithPlatforms {
  id: string;
  platforms: string[]; // platform slugs
  genres: string[];
}

interface CharacterWithGames {
  id: string;
  gameIds: string[];
}

/** Filters games that have at least one platform in the selected set */
function filterGamesByPlatforms(
  games: GameWithPlatforms[],
  selectedPlatforms: string[]
): GameWithPlatforms[] {
  if (selectedPlatforms.length === 0) return games;
  return games.filter((g) => g.platforms.some((p) => selectedPlatforms.includes(p)));
}

/** Filters characters whose at least one game is on a selected platform */
function filterCharactersByPlatforms(
  characters: CharacterWithGames[],
  games: GameWithPlatforms[],
  selectedPlatforms: string[]
): CharacterWithGames[] {
  if (selectedPlatforms.length === 0) return characters;
  const matchingGameIds = new Set(
    filterGamesByPlatforms(games, selectedPlatforms).map((g) => g.id)
  );
  return characters.filter((c) => c.gameIds.some((gid) => matchingGameIds.has(gid)));
}

/** Filters games by genre */
function filterGamesByGenres(
  games: GameWithPlatforms[],
  selectedGenres: string[]
): GameWithPlatforms[] {
  if (selectedGenres.length === 0) return games;
  return games.filter((g) => g.genres.some((genre) => selectedGenres.includes(genre)));
}

// --- Generators ---

const slugGen = fc.stringMatching(/^[a-z][a-z0-9-]{1,14}$/);

const gameGen = fc.record({
  id: fc.uuid(),
  platforms: fc.array(slugGen, { minLength: 0, maxLength: 4 }),
  genres: fc.array(slugGen, { minLength: 0, maxLength: 3 }),
});

const gamesGen = fc.array(gameGen, { minLength: 0, maxLength: 20 });

/**
 * Feature: game-platforms, Property 3: Game platform filter correctness
 *
 * For any set of selected platform slugs and any game returned by the filtered
 * Games_Listing, that game must be associated with at least one of the selected
 * platforms.
 *
 * **Validates: Requirements 4.1**
 */
describe("Property 3: Game platform filter correctness", () => {
  it("every returned game has at least one selected platform", () => {
    fc.assert(
      fc.property(
        gamesGen,
        fc.array(slugGen, { minLength: 1, maxLength: 5 }),
        (games, selectedPlatforms) => {
          const filtered = filterGamesByPlatforms(games, selectedPlatforms);

          for (const game of filtered) {
            const hasMatch = game.platforms.some((p) => selectedPlatforms.includes(p));
            expect(hasMatch).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("no game with a matching platform is excluded", () => {
    fc.assert(
      fc.property(
        gamesGen,
        fc.array(slugGen, { minLength: 1, maxLength: 5 }),
        (games, selectedPlatforms) => {
          const filtered = filterGamesByPlatforms(games, selectedPlatforms);
          const filteredIds = new Set(filtered.map((g) => g.id));

          for (const game of games) {
            const hasMatch = game.platforms.some((p) => selectedPlatforms.includes(p));
            if (hasMatch) {
              expect(filteredIds.has(game.id)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: game-platforms, Property 4: Character platform filter correctness
 *
 * For any set of selected platform slugs and any character returned by the
 * filtered Characters_Listing, that character must have at least one associated
 * game available on one of the selected platforms.
 *
 * **Validates: Requirements 4.2**
 */
describe("Property 4: Character platform filter correctness", () => {
  it("every returned character has at least one game on a selected platform", () => {
    const characterGen = (gameIds: string[]) =>
      fc.record({
        id: fc.uuid(),
        gameIds: fc.subarray(gameIds, { minLength: 0 }),
      });

    fc.assert(
      fc.property(
        gamesGen.chain((games) => {
          const gameIds = games.map((g) => g.id);
          return fc.tuple(
            fc.constant(games),
            fc.array(characterGen(gameIds), { minLength: 0, maxLength: 10 }),
            fc.array(slugGen, { minLength: 1, maxLength: 5 })
          );
        }),
        ([games, characters, selectedPlatforms]) => {
          const filtered = filterCharactersByPlatforms(characters, games, selectedPlatforms);
          const matchingGameIds = new Set(
            filterGamesByPlatforms(games, selectedPlatforms).map((g) => g.id)
          );

          for (const character of filtered) {
            const hasGameOnPlatform = character.gameIds.some((gid) => matchingGameIds.has(gid));
            expect(hasGameOnPlatform).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: game-platforms, Property 5: Combined filter intersection
 *
 * For any combination of platform filter and genre filter applied to the
 * Games_Listing, the result set must be a subset of the intersection of the
 * results from applying each filter independently. When no platform filter is
 * selected, the result set must equal the unfiltered result set.
 *
 * **Validates: Requirements 4.3, 4.4**
 */
describe("Property 5: Combined filter intersection", () => {
  it("combined result is the intersection of individual filters", () => {
    fc.assert(
      fc.property(
        gamesGen,
        fc.array(slugGen, { minLength: 0, maxLength: 5 }),
        fc.array(slugGen, { minLength: 0, maxLength: 5 }),
        (games, selectedPlatforms, selectedGenres) => {
          const byPlatform = filterGamesByPlatforms(games, selectedPlatforms);
          const byGenre = filterGamesByGenres(games, selectedGenres);

          // Combined: apply both filters
          const combined = filterGamesByGenres(
            filterGamesByPlatforms(games, selectedPlatforms),
            selectedGenres
          );

          const byPlatformIds = new Set(byPlatform.map((g) => g.id));
          const byGenreIds = new Set(byGenre.map((g) => g.id));

          // Combined must be subset of intersection
          for (const game of combined) {
            expect(byPlatformIds.has(game.id)).toBe(true);
            expect(byGenreIds.has(game.id)).toBe(true);
          }

          // Intersection must be subset of combined (completeness)
          for (const game of games) {
            if (byPlatformIds.has(game.id) && byGenreIds.has(game.id)) {
              expect(combined.some((g) => g.id === game.id)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("no platform filter returns all games", () => {
    fc.assert(
      fc.property(gamesGen, (games) => {
        const filtered = filterGamesByPlatforms(games, []);
        expect(filtered).toEqual(games);
      }),
      { numRuns: 100 }
    );
  });
});
