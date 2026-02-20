import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { CharacterService } from "../../../../src/lib/services/characterService";
import type { CharacterDetails, CharacterGame, CharacterMedia } from "@/types/character";

/**
 * Feature: character-pages
 * Property 10: Database Query Relation Loading
 * **Validates: Requirements 7.4**
 *
 * For any valid character slug queried from the database, the returned data
 * should include all related entities: associated games (with primary game flag)
 * and all media items.
 *
 * Property 11: API Filter Application
 * **Validates: Requirements 8.3**
 *
 * For any combination of query parameters (search, games, roles) sent to
 * /api/characters, the API should return only characters matching all specified criteria.
 */

// Generators for property-based testing
const localeGenerator = fc.constantFrom("fr", "en");

const roleGenerator = fc.constantFrom("protagonist", "antagonist", "supporting", "npc", "playable");

// Use simple alphanumeric search terms to avoid URL encoding complexities
const searchTermGenerator = fc.stringMatching(/^[a-zA-Z0-9]{1,15}$/);

const gameIdGenerator = fc.uuid();

const characterSummaryGenerator = fc.record({
  id: fc.uuid(),
  slug: fc.stringMatching(/^[a-z0-9-]{3,30}$/),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  role: fc.option(roleGenerator, { nil: undefined }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
  mainImage: fc.option(fc.webUrl(), { nil: undefined }),
  backgroundColor: fc.option(fc.stringMatching(/^#[0-9a-f]{6}$/), { nil: undefined }),
  primaryGame: fc.string({ minLength: 1, maxLength: 50 }),
  gamesCount: fc.integer({ min: 1, max: 10 }),
});

const paginationGenerator = fc.record({
  currentPage: fc.integer({ min: 1, max: 100 }),
  totalPages: fc.integer({ min: 1, max: 100 }),
  totalCount: fc.integer({ min: 0, max: 1000 }),
  hasNextPage: fc.boolean(),
  hasPreviousPage: fc.boolean(),
});

// Generators for Property 10: Database Query Relation Loading
const screenshotGenerator = fc.record({
  id: fc.uuid(),
  url: fc.webUrl(),
  altText: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
  caption: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
  isFeatured: fc.option(fc.boolean(), { nil: undefined }),
});

const artworkGenerator = fc.record({
  id: fc.uuid(),
  url: fc.webUrl(),
  altText: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
  caption: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
  type: fc.option(fc.constantFrom("concept", "promotional", "fan-art"), { nil: undefined }),
  isFeatured: fc.option(fc.boolean(), { nil: undefined }),
});

const videoGenerator = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 3, maxLength: 50 }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
  url: fc.webUrl(),
  thumbnailUrl: fc.option(fc.webUrl(), { nil: undefined }),
  type: fc.option(fc.constantFrom("trailer", "gameplay", "cutscene"), { nil: undefined }),
  duration: fc.option(fc.integer({ min: 10, max: 3600 }), { nil: undefined }),
  isFeatured: fc.option(fc.boolean(), { nil: undefined }),
});

const characterMediaGenerator = fc.record({
  mainImage: fc.option(fc.webUrl(), { nil: undefined }),
  backgroundImage: fc.option(fc.webUrl(), { nil: undefined }),
  screenshots: fc.array(screenshotGenerator, { minLength: 0, maxLength: 5 }),
  artwork: fc.array(artworkGenerator, { minLength: 0, maxLength: 5 }),
  videos: fc.array(videoGenerator, { minLength: 0, maxLength: 3 }),
});

const characterGameGenerator = fc.record({
  id: fc.uuid(),
  slug: fc.stringMatching(/^[a-z0-9-]{3,30}$/),
  title: fc.string({ minLength: 3, maxLength: 50 }),
  coverImage: fc.option(fc.webUrl(), { nil: undefined }),
  backgroundImage: fc.option(fc.webUrl(), { nil: undefined }),
  releaseYear: fc.option(fc.integer({ min: 1980, max: 2030 }), { nil: undefined }),
  isPrimary: fc.boolean(),
});

// Use integer timestamps to avoid Invalid Date issues with fc.date()
const isoDateStringGenerator = fc
  .integer({ min: 1577836800000, max: 1767225600000 }) // 2020-01-01 to 2025-12-31 in ms
  .map((timestamp) => new Date(timestamp).toISOString());

const characterDetailsGenerator = fc.record({
  id: fc.uuid(),
  slug: fc.stringMatching(/^[a-z0-9-]{3,30}$/),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  role: fc.option(roleGenerator, { nil: undefined }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
  biography: fc.option(fc.string({ minLength: 20, maxLength: 500 }), { nil: undefined }),
  weapons: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
  backgroundColor: fc.option(fc.stringMatching(/^#[0-9a-f]{6}$/), { nil: undefined }),
  games: fc.array(characterGameGenerator, { minLength: 0, maxLength: 5 }),
  primaryGame: fc.string({ minLength: 3, maxLength: 50 }),
  media: characterMediaGenerator,
  relationships: fc.constant([]), // Simplified for this test
  createdAt: isoDateStringGenerator,
  updatedAt: isoDateStringGenerator,
});

/**
 * Helper to check if URL contains a parameter with expected value
 * Handles URL encoding differences (+ vs %20, %2C vs ,)
 */
function urlContainsParam(url: string, paramName: string, expectedValue: string): boolean {
  const urlObj = new URL(url);
  const actualValue = urlObj.searchParams.get(paramName);
  return actualValue === expectedValue;
}

/**
 * Helper to check if URL contains a parameter
 */
function urlHasParam(url: string, paramName: string): boolean {
  const urlObj = new URL(url);
  return urlObj.searchParams.has(paramName);
}

describe("CharacterService Property-Based Tests", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("Property 10: Database Query Relation Loading", () => {
    it("fetchCharacterDetails returns character with games array containing isPrimary flag", async () => {
      const testCases = fc.sample(fc.tuple(characterDetailsGenerator, localeGenerator), 100);

      for (const [characterData, locale] of testCases) {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve(characterData),
          } as Response)
        );

        const result = await CharacterService.fetchCharacterDetails(characterData.slug, locale);

        // Property: Response must include games array
        expect(result).not.toBeNull();
        expect(result).toHaveProperty("games");
        expect(Array.isArray(result!.games)).toBe(true);

        // Property: Each game in the array must have isPrimary flag defined
        for (const game of result!.games) {
          expect(game).toHaveProperty("isPrimary");
          expect(typeof game.isPrimary).toBe("boolean");
        }
      }
    });

    it("fetchCharacterDetails returns character with complete media structure", async () => {
      const testCases = fc.sample(fc.tuple(characterDetailsGenerator, localeGenerator), 100);

      for (const [characterData, locale] of testCases) {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve(characterData),
          } as Response)
        );

        const result = await CharacterService.fetchCharacterDetails(characterData.slug, locale);

        // Property: Response must include media object
        expect(result).not.toBeNull();
        expect(result).toHaveProperty("media");
        expect(typeof result!.media).toBe("object");

        // Property: Media object must have screenshots, artwork, and videos arrays
        expect(result!.media).toHaveProperty("screenshots");
        expect(result!.media).toHaveProperty("artwork");
        expect(result!.media).toHaveProperty("videos");
        expect(Array.isArray(result!.media.screenshots)).toBe(true);
        expect(Array.isArray(result!.media.artwork)).toBe(true);
        expect(Array.isArray(result!.media.videos)).toBe(true);
      }
    });

    it("fetchCharacterDetails preserves all games from API response", async () => {
      const testCases = fc.sample(
        fc.tuple(
          fc.array(characterGameGenerator, { minLength: 1, maxLength: 5 }),
          fc.stringMatching(/^[a-z0-9-]{3,30}$/),
          localeGenerator
        ),
        100
      );

      for (const [games, slug, locale] of testCases) {
        const characterData = {
          id: "test-id",
          slug,
          name: "Test Character",
          games,
          primaryGame: games[0]?.title || "Unknown",
          media: { screenshots: [], artwork: [], videos: [] },
          relationships: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve(characterData),
          } as Response)
        );

        const result = await CharacterService.fetchCharacterDetails(slug, locale);

        // Property: All games from API response must be present in result
        expect(result).not.toBeNull();
        expect(result!.games.length).toBe(games.length);

        // Property: Each game must have required fields
        for (let i = 0; i < result!.games.length; i++) {
          expect(result!.games[i]).toHaveProperty("id");
          expect(result!.games[i]).toHaveProperty("slug");
          expect(result!.games[i]).toHaveProperty("title");
          expect(result!.games[i]).toHaveProperty("isPrimary");
        }
      }
    });

    it("fetchCharacterDetails preserves all media items from API response", async () => {
      const testCases = fc.sample(
        fc.tuple(characterMediaGenerator, fc.stringMatching(/^[a-z0-9-]{3,30}$/), localeGenerator),
        100
      );

      for (const [media, slug, locale] of testCases) {
        const characterData = {
          id: "test-id",
          slug,
          name: "Test Character",
          games: [],
          primaryGame: "Unknown",
          media,
          relationships: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve(characterData),
          } as Response)
        );

        const result = await CharacterService.fetchCharacterDetails(slug, locale);

        // Property: All media items from API response must be present in result
        expect(result).not.toBeNull();
        expect(result!.media.screenshots.length).toBe(media.screenshots.length);
        expect(result!.media.artwork.length).toBe(media.artwork.length);
        expect(result!.media.videos.length).toBe(media.videos.length);
      }
    });

    it("fetchCharacterDetails returns null for 404 responses regardless of input", async () => {
      const testCases = fc.sample(
        fc.tuple(fc.stringMatching(/^[a-z0-9-]{3,30}$/), localeGenerator),
        50
      );

      for (const [slug, locale] of testCases) {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
            json: () => Promise.resolve({ error: "Character not found" }),
          } as Response)
        );

        const result = await CharacterService.fetchCharacterDetails(slug, locale);

        // Property: 404 responses must return null
        expect(result).toBeNull();
      }
    });

    it("fetchCharacterDetails includes primaryGame field derived from games", async () => {
      // Generate characters with at least one game marked as primary
      const testCases = fc.sample(
        fc.tuple(
          fc.array(characterGameGenerator, { minLength: 1, maxLength: 5 }).map((games) => {
            // Ensure at least one game is marked as primary
            if (!games.some((g) => g.isPrimary) && games.length > 0) {
              games[0].isPrimary = true;
            }
            return games;
          }),
          fc.stringMatching(/^[a-z0-9-]{3,30}$/),
          localeGenerator
        ),
        100
      );

      for (const [games, slug, locale] of testCases) {
        const primaryGame = games.find((g) => g.isPrimary)?.title || games[0]?.title || "Unknown";
        const characterData = {
          id: "test-id",
          slug,
          name: "Test Character",
          games,
          primaryGame,
          media: { screenshots: [], artwork: [], videos: [] },
          relationships: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve(characterData),
          } as Response)
        );

        const result = await CharacterService.fetchCharacterDetails(slug, locale);

        // Property: primaryGame field must be present and be a string
        expect(result).not.toBeNull();
        expect(result).toHaveProperty("primaryGame");
        expect(typeof result!.primaryGame).toBe("string");
        expect(result!.primaryGame.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Property 11: API Filter Application", () => {
    it("fetchCharacters constructs correct URL with search filter", async () => {
      const testCases = fc.sample(fc.tuple(searchTermGenerator, localeGenerator), 50);

      for (const [search, locale] of testCases) {
        let capturedUrl = "";
        global.fetch = vi.fn((url: string) => {
          capturedUrl = url;
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () =>
              Promise.resolve({
                characters: [],
                pagination: {
                  currentPage: 1,
                  totalPages: 0,
                  totalCount: 0,
                  hasNextPage: false,
                  hasPreviousPage: false,
                },
              }),
          } as Response);
        });

        await CharacterService.fetchCharacters({ search, locale });

        expect(capturedUrl).toContain("/api/characters");
        expect(urlContainsParam(capturedUrl, "search", search)).toBe(true);
        expect(urlContainsParam(capturedUrl, "locale", locale)).toBe(true);
      }
    });

    it("fetchCharacters constructs correct URL with games filter", async () => {
      const testCases = fc.sample(
        fc.tuple(fc.array(gameIdGenerator, { minLength: 1, maxLength: 3 }), localeGenerator),
        50
      );

      for (const [games, locale] of testCases) {
        let capturedUrl = "";
        global.fetch = vi.fn((url: string) => {
          capturedUrl = url;
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () =>
              Promise.resolve({
                characters: [],
                pagination: {
                  currentPage: 1,
                  totalPages: 0,
                  totalCount: 0,
                  hasNextPage: false,
                  hasPreviousPage: false,
                },
              }),
          } as Response);
        });

        await CharacterService.fetchCharacters({ games, locale });

        expect(capturedUrl).toContain("/api/characters");
        expect(urlContainsParam(capturedUrl, "games", games.join(","))).toBe(true);
        expect(urlContainsParam(capturedUrl, "locale", locale)).toBe(true);
      }
    });

    it("fetchCharacters constructs correct URL with roles filter", async () => {
      const testCases = fc.sample(
        fc.tuple(fc.array(roleGenerator, { minLength: 1, maxLength: 3 }), localeGenerator),
        50
      );

      for (const [roles, locale] of testCases) {
        let capturedUrl = "";
        global.fetch = vi.fn((url: string) => {
          capturedUrl = url;
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () =>
              Promise.resolve({
                characters: [],
                pagination: {
                  currentPage: 1,
                  totalPages: 0,
                  totalCount: 0,
                  hasNextPage: false,
                  hasPreviousPage: false,
                },
              }),
          } as Response);
        });

        await CharacterService.fetchCharacters({ roles, locale });

        expect(capturedUrl).toContain("/api/characters");
        expect(urlContainsParam(capturedUrl, "roles", roles.join(","))).toBe(true);
        expect(urlContainsParam(capturedUrl, "locale", locale)).toBe(true);
      }
    });

    it("fetchCharacters constructs correct URL with combined filters (search + games + roles)", async () => {
      const testCases = fc.sample(
        fc.tuple(
          searchTermGenerator,
          fc.array(gameIdGenerator, { minLength: 1, maxLength: 2 }),
          fc.array(roleGenerator, { minLength: 1, maxLength: 2 }),
          localeGenerator
        ),
        50
      );

      for (const [search, games, roles, locale] of testCases) {
        let capturedUrl = "";
        global.fetch = vi.fn((url: string) => {
          capturedUrl = url;
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () =>
              Promise.resolve({
                characters: [],
                pagination: {
                  currentPage: 1,
                  totalPages: 0,
                  totalCount: 0,
                  hasNextPage: false,
                  hasPreviousPage: false,
                },
              }),
          } as Response);
        });

        await CharacterService.fetchCharacters({ search, games, roles, locale });

        // Verify all filter parameters are included in the URL
        expect(capturedUrl).toContain("/api/characters");
        expect(urlContainsParam(capturedUrl, "search", search)).toBe(true);
        expect(urlContainsParam(capturedUrl, "games", games.join(","))).toBe(true);
        expect(urlContainsParam(capturedUrl, "roles", roles.join(","))).toBe(true);
        expect(urlContainsParam(capturedUrl, "locale", locale)).toBe(true);
      }
    });

    it("fetchCharacters returns response with correct structure for any filter combination", async () => {
      const testCases = fc.sample(
        fc.tuple(
          fc.array(characterSummaryGenerator, { minLength: 0, maxLength: 10 }),
          paginationGenerator,
          fc.record({
            search: fc.option(searchTermGenerator, { nil: undefined }),
            games: fc.option(fc.array(gameIdGenerator, { minLength: 1, maxLength: 3 }), {
              nil: undefined,
            }),
            roles: fc.option(fc.array(roleGenerator, { minLength: 1, maxLength: 3 }), {
              nil: undefined,
            }),
            locale: fc.option(localeGenerator, { nil: undefined }),
          })
        ),
        100
      );

      for (const [characters, pagination, options] of testCases) {
        const mockResponse = { characters, pagination };

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve(mockResponse),
          } as Response)
        );

        const result = await CharacterService.fetchCharacters(options);

        // Verify response structure
        expect(result).toHaveProperty("characters");
        expect(result).toHaveProperty("pagination");
        expect(Array.isArray(result.characters)).toBe(true);

        // Verify pagination properties
        expect(result.pagination).toHaveProperty("currentPage");
        expect(result.pagination).toHaveProperty("totalPages");
        expect(result.pagination).toHaveProperty("totalCount");
        expect(result.pagination).toHaveProperty("hasNextPage");
        expect(result.pagination).toHaveProperty("hasPreviousPage");
      }
    });

    it("fetchCharacters includes pagination parameters with filters", async () => {
      const testCases = fc.sample(
        fc.tuple(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 50 }),
          fc.option(searchTermGenerator, { nil: undefined }),
          fc.option(fc.array(roleGenerator, { minLength: 1, maxLength: 2 }), { nil: undefined }),
          localeGenerator
        ),
        50
      );

      for (const [page, limit, search, roles, locale] of testCases) {
        let capturedUrl = "";
        global.fetch = vi.fn((url: string) => {
          capturedUrl = url;
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () =>
              Promise.resolve({
                characters: [],
                pagination: {
                  currentPage: page,
                  totalPages: 1,
                  totalCount: 0,
                  hasNextPage: false,
                  hasPreviousPage: page > 1,
                },
              }),
          } as Response);
        });

        const options: {
          page: number;
          limit: number;
          locale: string;
          search?: string;
          roles?: string[];
        } = { page, limit, locale };
        if (search) options.search = search;
        if (roles) options.roles = roles;

        await CharacterService.fetchCharacters(options);

        expect(urlContainsParam(capturedUrl, "page", page.toString())).toBe(true);
        expect(urlContainsParam(capturedUrl, "limit", limit.toString())).toBe(true);
        expect(urlContainsParam(capturedUrl, "locale", locale)).toBe(true);
      }
    });

    it("fetchCharacters handles empty filter arrays by including them as empty strings", async () => {
      // This test verifies the actual behavior of the service with empty arrays
      const testCases = fc.sample(localeGenerator, 20);

      for (const locale of testCases) {
        let capturedUrl = "";
        global.fetch = vi.fn((url: string) => {
          capturedUrl = url;
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () =>
              Promise.resolve({
                characters: [],
                pagination: {
                  currentPage: 1,
                  totalPages: 0,
                  totalCount: 0,
                  hasNextPage: false,
                  hasPreviousPage: false,
                },
              }),
          } as Response);
        });

        // Pass empty arrays
        await CharacterService.fetchCharacters({ games: [], roles: [], locale });

        expect(capturedUrl).toContain("/api/characters");
        expect(urlContainsParam(capturedUrl, "locale", locale)).toBe(true);
        // Verify the URL was constructed (empty arrays result in empty string params)
        expect(urlHasParam(capturedUrl, "games")).toBe(true);
        expect(urlHasParam(capturedUrl, "roles")).toBe(true);
      }
    });

    it("fetchCharacters throws on API errors for any filter combination", async () => {
      const testCases = fc.sample(
        fc.tuple(
          fc.record({
            search: fc.option(searchTermGenerator, { nil: undefined }),
            games: fc.option(fc.array(gameIdGenerator, { minLength: 1, maxLength: 2 }), {
              nil: undefined,
            }),
            roles: fc.option(fc.array(roleGenerator, { minLength: 1, maxLength: 2 }), {
              nil: undefined,
            }),
            locale: fc.option(localeGenerator, { nil: undefined }),
          }),
          fc.constantFrom(400, 500, 502, 503)
        ),
        30
      );

      for (const [options, statusCode] of testCases) {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: statusCode,
            statusText: "Error",
            text: () => Promise.resolve("Error message"),
          } as Response)
        );

        await expect(CharacterService.fetchCharacters(options)).rejects.toThrow();
      }
    });
  });
});
