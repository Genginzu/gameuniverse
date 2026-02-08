import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import * as fc from "fast-check";
import { GameService } from "../../../src/lib/services/gameService";
import type { GameDetails, GameSummary } from "../../../src/types/game";

// Feature: test-reorganization, Property: Data Transformation Consistency
// **Validates: Requirements 7.4**

// Helper to create simple slug-like strings without slow regex matching
const slugChars = "abcdefghijklmnopqrstuvwxyz0123456789";
const slugCharsWithDash = "abcdefghijklmnopqrstuvwxyz0123456789-";

const simpleSlugGen = (maxLen: number) =>
  fc
    .array(fc.constantFrom(...slugCharsWithDash.split("")), { minLength: 1, maxLength: maxLen })
    .map((chars) => chars.join(""))
    .filter((s) => !s.startsWith("-") && !s.endsWith("-") && s.length > 0);

// Generators for game data
const genreGenerator = fc.record({
  id: fc.uuid(),
  slug: simpleSlugGen(20),
  name: fc.string({ minLength: 1, maxLength: 50 }),
});

const companyGenerator = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  slug: simpleSlugGen(20),
  isPrimary: fc.boolean(),
});

const mediaGenerator = fc.record({
  coverImage: fc.option(fc.webUrl()),
  screenshots: fc.constant([]),
  artwork: fc.constant([]),
  videos: fc.constant([]),
});

// Safe date string generator that produces valid ISO date strings (YYYY-MM-DD)
const safeDateStringGenerator = fc
  .integer({ min: 0, max: 1893456000000 }) // Up to year 2030
  .map((timestamp) => new Date(timestamp).toISOString().split("T")[0]);

// Safe ISO datetime string generator
const safeIsoDateTimeGenerator = fc
  .integer({ min: 0, max: 1893456000000 }) // Up to year 2030
  .map((timestamp) => new Date(timestamp).toISOString());

const gameDetailsGenerator: fc.Arbitrary<GameDetails> = fc.record({
  id: fc.uuid(),
  slug: simpleSlugGen(30),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
  releaseDate: fc.option(safeDateStringGenerator),
  releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 })),
  metascore: fc.option(fc.integer({ min: 0, max: 100 })),
  genres: fc.array(genreGenerator, { minLength: 0, maxLength: 5 }),
  companies: fc.record({
    developers: fc.array(companyGenerator, { minLength: 1, maxLength: 3 }),
    publishers: fc.array(companyGenerator, { minLength: 1, maxLength: 3 }),
  }),
  developer: fc.string({ minLength: 1, maxLength: 100 }),
  publisher: fc.string({ minLength: 1, maxLength: 100 }),
  media: mediaGenerator,
  pricing: fc.constant([]),
  createdAt: safeIsoDateTimeGenerator,
  updatedAt: safeIsoDateTimeGenerator,
});

const gameSummaryGenerator: fc.Arbitrary<GameSummary> = fc.record({
  id: fc.uuid(),
  slug: simpleSlugGen(30),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
  coverImage: fc.option(fc.webUrl()),
  releaseDate: fc.option(safeDateStringGenerator),
  releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 })),
  genres: fc.array(
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      id: fc.option(fc.uuid()),
    }),
    { minLength: 0, maxLength: 5 }
  ),
  developer: fc.string({ minLength: 1, maxLength: 100 }),
  publisher: fc.string({ minLength: 1, maxLength: 100 }),
  metascore: fc.option(fc.integer({ min: 0, max: 100 })),
});

const paginationGenerator = fc.record({
  currentPage: fc.integer({ min: 1, max: 100 }),
  totalPages: fc.integer({ min: 1, max: 100 }),
  totalCount: fc.integer({ min: 0, max: 10000 }),
  hasNextPage: fc.boolean(),
  hasPreviousPage: fc.boolean(),
});

const localeGenerator = fc.constantFrom("fr", "en");
// Use the simpleSlugGen helper for slugs
const slugGenerator = simpleSlugGen(25);

describe("GameService Property-Based Tests", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("Property: Data Transformation Consistency", () => {
    it("for any valid game data, fetchGames transformation preserves essential fields", async () => {
      const testCases = fc.sample(
        fc.tuple(
          fc.array(gameSummaryGenerator, { minLength: 0, maxLength: 5 }),
          paginationGenerator
        ),
        20
      );

      for (const [games, pagination] of testCases) {
        // Test with 'games' format response (direct API format)
        const gamesFormatResponse = { games, pagination };

        global.fetch = mock(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(gamesFormatResponse),
          } as Response)
        );

        const result = await GameService.fetchGames();

        // Essential fields must be preserved
        expect(result.games).toHaveLength(games.length);
        expect(result.pagination).toEqual(pagination);

        // Each game's essential fields must be preserved
        for (let i = 0; i < games.length; i++) {
          expect(result.games[i].id).toBe(games[i].id);
          expect(result.games[i].slug).toBe(games[i].slug);
          expect(result.games[i].title).toBe(games[i].title);
          expect(result.games[i].developer).toBe(games[i].developer);
          expect(result.games[i].publisher).toBe(games[i].publisher);
        }
      }
    });

    it("for any valid game data, fetchGames handles items format and preserves essential fields", async () => {
      const testCases = fc.sample(
        fc.tuple(
          fc.array(gameSummaryGenerator, { minLength: 0, maxLength: 5 }),
          paginationGenerator
        ),
        20
      );

      for (const [items, pagination] of testCases) {
        // Test with 'items' format response (BaseService format)
        const itemsFormatResponse = { items, pagination };

        global.fetch = mock(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(itemsFormatResponse),
          } as Response)
        );

        const result = await GameService.fetchGames();

        // Essential fields must be preserved after transformation
        expect(result.games).toHaveLength(items.length);
        expect(result.pagination).toEqual(pagination);

        // Each game's essential fields must be preserved
        for (let i = 0; i < items.length; i++) {
          expect(result.games[i].id).toBe(items[i].id);
          expect(result.games[i].slug).toBe(items[i].slug);
          expect(result.games[i].title).toBe(items[i].title);
        }
      }
    });

    it("for any valid game details, metadata transformation preserves title", async () => {
      // Use a simpler title generator to avoid unicode/special character issues
      const titleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
      const simpleTitleGenerator = fc
        .array(fc.constantFrom(...titleChars.split("")), { minLength: 1, maxLength: 30 })
        .map((chars) => chars.join(""))
        .filter((s) => s.trim().length > 0);

      const testCases = fc.sample(
        fc.tuple(slugGenerator, localeGenerator, simpleTitleGenerator),
        20
      );

      for (const [slug, locale, title] of testCases) {
        const gameDetails = {
          id: "test-id",
          slug,
          title,
          description: "Test description for the game",
          releaseDate: "2023-01-01",
          releaseYear: 2023,
          metascore: 85,
          genres: [],
          companies: { developers: [], publishers: [] },
          developer: "Test Developer",
          publisher: "Test Publisher",
          media: { coverImage: null, screenshots: [], artwork: [], videos: [] },
          pricing: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        global.fetch = mock(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(gameDetails),
          } as Response)
        );

        const metadata = await GameService.generateGameMetadata(slug, locale);

        // Ensure both values are strings before comparison
        expect(typeof metadata.title).toBe("string");
        expect(typeof gameDetails.title).toBe("string");

        // Title must contain the game title - use includes for string comparison
        const metadataTitle = String(metadata.title);
        const gameTitle = String(gameDetails.title);
        expect(metadataTitle.includes(gameTitle)).toBe(true);
        expect(metadataTitle.includes("Game Universe")).toBe(true);

        // OpenGraph title must match game title
        expect(metadata.openGraph?.title).toBe(gameDetails.title);
      }
    });

    it("for any valid game details with description, metadata preserves description", async () => {
      const testCases = fc.sample(
        fc.tuple(
          slugGenerator,
          localeGenerator,
          gameDetailsGenerator.filter((g) => g.description !== undefined && g.description !== null)
        ),
        20
      );

      for (const [slug, locale, gameDetails] of testCases) {
        global.fetch = mock(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(gameDetails),
          } as Response)
        );

        const metadata = await GameService.generateGameMetadata(slug, locale);

        // Description must be preserved
        expect(metadata.description).toBe(gameDetails.description);
        expect(metadata.openGraph?.description).toBe(gameDetails.description);
      }
    });

    it("for any valid game details with cover image, metadata includes image in openGraph", async () => {
      const testCases = fc.sample(
        fc.tuple(
          slugGenerator,
          localeGenerator,
          gameDetailsGenerator.map((g) => ({
            ...g,
            media: { ...g.media, coverImage: "https://example.com/cover.jpg" },
          }))
        ),
        20
      );

      for (const [slug, locale, gameDetails] of testCases) {
        global.fetch = mock(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(gameDetails),
          } as Response)
        );

        const metadata = await GameService.generateGameMetadata(slug, locale);

        // Cover image must be in openGraph images
        expect(metadata.openGraph?.images).toContain(gameDetails.media.coverImage);
      }
    });

    it("for any valid game details, fetchGameDetails preserves all essential fields", async () => {
      const testCases = fc.sample(
        fc.tuple(slugGenerator, localeGenerator, gameDetailsGenerator),
        20
      );

      for (const [slug, locale, gameDetails] of testCases) {
        global.fetch = mock(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(gameDetails),
          } as Response)
        );

        const result = await GameService.fetchGameDetails(slug, locale);

        // All essential fields must be preserved exactly
        expect(result).not.toBeNull();
        expect(result!.id).toBe(gameDetails.id);
        expect(result!.slug).toBe(gameDetails.slug);
        expect(result!.title).toBe(gameDetails.title);
        expect(result!.developer).toBe(gameDetails.developer);
        expect(result!.publisher).toBe(gameDetails.publisher);
        expect(result!.genres).toEqual(gameDetails.genres);
        expect(result!.companies).toEqual(gameDetails.companies);
        expect(result!.media).toEqual(gameDetails.media);
      }
    });

    it("pagination fields are always preserved regardless of response format", async () => {
      const testCases = fc.sample(
        fc.tuple(
          fc.array(gameSummaryGenerator, { minLength: 0, maxLength: 3 }),
          paginationGenerator,
          fc.boolean() // true = games format, false = items format
        ),
        20
      );

      for (const [data, pagination, useGamesFormat] of testCases) {
        const response = useGamesFormat ? { games: data, pagination } : { items: data, pagination };

        global.fetch = mock(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(response),
          } as Response)
        );

        const result = await GameService.fetchGames();

        // All pagination fields must be preserved exactly
        expect(result.pagination.currentPage).toBe(pagination.currentPage);
        expect(result.pagination.totalPages).toBe(pagination.totalPages);
        expect(result.pagination.totalCount).toBe(pagination.totalCount);
        expect(result.pagination.hasNextPage).toBe(pagination.hasNextPage);
        expect(result.pagination.hasPreviousPage).toBe(pagination.hasPreviousPage);
      }
    });
  });
});
