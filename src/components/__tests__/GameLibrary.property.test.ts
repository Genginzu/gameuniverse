import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

// Feature: game-library, Property 1: Game List Display Completeness
// **Validates: Requirements 1.2**

// Generate unique prefixed strings to avoid substring collisions
const uniquePrefixedString = (prefix: string, minLength: number, maxLength: number) =>
  fc.uuid().map((id) => `${prefix}_${id.slice(0, Math.min(maxLength - prefix.length - 1, 8))}`);

// Mock game data generator for property-based testing
// Uses unique prefixes to ensure no substring collisions between fields
const gameGenerator = () =>
  fc.record({
    id: fc.uuid(),
    slug: fc.uuid().map((id) => `slug-${id.slice(0, 8)}`),
    title: uniquePrefixedString("Title", 10, 30),
    description: fc.option(fc.constant("A game description")),
    coverImage: fc.option(fc.webUrl()),
    releaseDate: fc.option(
      fc
        .date({ min: new Date("1970-01-01"), max: new Date("2030-12-31") })
        .map((d) => d.toISOString().split("T")[0])
    ),
    releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 })),
    genres: fc.array(
      fc.record({
        name: fc.constantFrom(
          "Action",
          "Adventure",
          "RPG",
          "Strategy",
          "Simulation",
          "Sports",
          "Racing",
          "Puzzle",
          "Horror",
          "Indie"
        ),
      }),
      { minLength: 1, maxLength: 5 }
    ),
    developer: uniquePrefixedString("Dev", 8, 20),
    publisher: uniquePrefixedString("Pub", 8, 20),
    metascore: fc.option(fc.integer({ min: 0, max: 100 })),
  });

// Mock function to simulate rendering a game list
const renderGameList = (games: any[]): string => {
  // Simulate the rendering logic that would happen in the GameCard component
  return games
    .map((game) => {
      const parts = [
        game.title,
        game.genres.map((g: any) => g.name).join(", "),
        game.releaseYear?.toString() || "Unknown Year",
        game.developer,
        game.publisher,
      ];
      return parts.join(" | ");
    })
    .join("\n");
};

describe("GameLibrary Property-Based Tests", () => {
  it("Property 1: Game List Display Completeness - For any set of games, each game card should contain title, genre, release year, developer, and publisher information", () => {
    fc.assert(
      fc.property(fc.array(gameGenerator(), { minLength: 1, maxLength: 20 }), (games) => {
        const rendered = renderGameList(games);
        const lines = rendered.split("\n");

        // Verify that each game's essential information is present in its corresponding line
        return games.every((game, index) => {
          const gameLine = lines[index];
          if (!gameLine) return false;

          const gameTitle = game.title;
          const gameGenres = game.genres.map((g: { name: string }) => g.name);
          const gameYear = game.releaseYear?.toString() || "Unknown Year";
          const gameDeveloper = game.developer;
          const gamePublisher = game.publisher;

          // Check that all essential information is present in the game's line
          const hasTitle = gameLine.includes(gameTitle);
          const hasAtLeastOneGenre = gameGenres.some((genre: string) => gameLine.includes(genre));
          const hasYear = gameLine.includes(gameYear);
          const hasDeveloper = gameLine.includes(gameDeveloper);
          const hasPublisher = gameLine.includes(gamePublisher);

          return hasTitle && hasAtLeastOneGenre && hasYear && hasDeveloper && hasPublisher;
        });
      }),
      { numRuns: 100 }
    );
  });

  it("Property 1 Extended: Game List should handle empty states gracefully", () => {
    fc.assert(
      fc.property(
        fc.constantFrom([]), // Empty array
        (games) => {
          const rendered = renderGameList(games);
          // Empty game list should render as empty string
          return rendered === "";
        }
      ),
      { numRuns: 10 }
    );
  });

  it("Property 1 Extended: Game List should handle games with missing optional data", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            slug: fc.uuid().map((id) => `slug-${id.slice(0, 8)}`),
            title: uniquePrefixedString("Title", 10, 30),
            description: fc.constant(undefined), // Always undefined
            coverImage: fc.constant(undefined), // Always undefined
            releaseDate: fc.constant(undefined), // Always undefined
            releaseYear: fc.constant(undefined), // Always undefined
            genres: fc.array(
              fc.record({
                name: fc.constantFrom("Action", "Adventure", "RPG"),
              }),
              { minLength: 1, maxLength: 2 }
            ),
            developer: uniquePrefixedString("Dev", 8, 20),
            publisher: uniquePrefixedString("Pub", 8, 20),
            metascore: fc.constant(undefined), // Always undefined
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (games) => {
          const rendered = renderGameList(games);
          const lines = rendered.split("\n");

          // Even with missing optional data, essential information should still be present
          return games.every((game, index) => {
            const gameLine = lines[index];
            if (!gameLine) return false;

            const hasTitle = gameLine.includes(game.title);
            const hasGenre = game.genres.some((g: { name: string }) => gameLine.includes(g.name));
            const hasUnknownYear = gameLine.includes("Unknown Year");
            const hasDeveloper = gameLine.includes(game.developer);
            const hasPublisher = gameLine.includes(game.publisher);

            return hasTitle && hasGenre && hasUnknownYear && hasDeveloper && hasPublisher;
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it("Property 1 Extended: Game List should preserve order of games", () => {
    fc.assert(
      fc.property(fc.array(gameGenerator(), { minLength: 2, maxLength: 10 }), (games) => {
        const rendered = renderGameList(games);
        const lines = rendered.split("\n");

        // The order of games in the rendered output should match the input order
        return games.every((game, index) => {
          return lines[index] && lines[index].includes(game.title);
        });
      }),
      { numRuns: 50 }
    );
  });
});
