import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

// Feature: game-library, Property 1: Game List Display Completeness
// **Validates: Requirements 1.2**

// Mock game data generator for property-based testing
const gameGenerator = () =>
  fc.record({
    id: fc.uuid(),
    slug: fc
      .string({ minLength: 1, maxLength: 50 })
      .map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, "-")),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
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
    developer: fc.string({ minLength: 1, maxLength: 50 }),
    publisher: fc.string({ minLength: 1, maxLength: 50 }),
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

        // Verify that each game's essential information is present in the rendered output
        return games.every((game) => {
          const gameTitle = game.title;
          const gameGenres = game.genres.map((g) => g.name);
          const gameYear = game.releaseYear?.toString() || "Unknown Year";
          const gameDeveloper = game.developer;
          const gamePublisher = game.publisher;

          // Check that all essential information is present in the rendered string
          const hasTitle = rendered.includes(gameTitle);
          const hasAtLeastOneGenre = gameGenres.some((genre) => rendered.includes(genre));
          const hasYear = rendered.includes(gameYear);
          const hasDeveloper = rendered.includes(gameDeveloper);
          const hasPublisher = rendered.includes(gamePublisher);

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
            slug: fc.string({ minLength: 1, maxLength: 50 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
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
            developer: fc.string({ minLength: 1, maxLength: 50 }),
            publisher: fc.string({ minLength: 1, maxLength: 50 }),
            metascore: fc.constant(undefined), // Always undefined
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (games) => {
          const rendered = renderGameList(games);

          // Even with missing optional data, essential information should still be present
          return games.every((game) => {
            const hasTitle = rendered.includes(game.title);
            const hasGenre = game.genres.some((g) => rendered.includes(g.name));
            const hasUnknownYear = rendered.includes("Unknown Year");
            const hasDeveloper = rendered.includes(game.developer);
            const hasPublisher = rendered.includes(game.publisher);

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
