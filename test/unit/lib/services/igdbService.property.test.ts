import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { IGDBService } from "../../../../src/lib/services/igdbService";
import { IGDBGame, IGDBSearchResult } from "@/types/igdb";

// Feature: igdb-hybrid-search, Property 10: Cache du token IGDB
// **Validates: Requirements 6.3**
// Feature: igdb-hybrid-search, Property 11: Transformation donnÃ©es IGDB valide
// **Validates: Requirements 6.4**

describe("IGDBService Property-Based Tests", () => {
  let originalFetch: typeof global.fetch;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnv = { ...process.env };
    // Set up test credentials
    process.env.IGDB_CLIENT_ID = "test-client-id";
    process.env.IGDB_CLIENT_SECRET = "test-client-secret";
    // Clear token cache before each test
    IGDBService.clearTokenCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    IGDBService.clearTokenCache();
  });

  describe("Property 10: Cache du token IGDB", () => {
    it("for any sequence of requests before token expiration, the same token must be reused", async () => {
      // Generate test cases: number of sequential requests (2-10)
      const testCases = fc.sample(
        fc.record({
          numRequests: fc.integer({ min: 2, max: 10 }),
          tokenValue: fc.string({ minLength: 20, maxLength: 50 }),
          expiresIn: fc.integer({ min: 3600, max: 86400 }), // 1 hour to 24 hours
        }),
        100
      );

      for (const { numRequests, tokenValue, expiresIn } of testCases) {
        // Clear cache for each test case
        IGDBService.clearTokenCache();

        let fetchCallCount = 0;
        const mockTokenResponse = {
          access_token: tokenValue,
          expires_in: expiresIn,
          token_type: "bearer",
        };

        global.fetch = vi.fn((url: string) => {
          if (url.includes("twitch.tv/oauth2/token")) {
            fetchCallCount++;
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () => Promise.resolve(mockTokenResponse),
            } as Response);
          }
          // For any other IGDB API call, return empty response
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve([]),
          } as Response);
        });

        // Make multiple sequential requests
        const tokens: string[] = [];
        for (let i = 0; i < numRequests; i++) {
          const token = await IGDBService.getAccessToken();
          tokens.push(token);
        }

        // Property assertion: All tokens should be the same
        const allTokensSame = tokens.every((t) => t === tokens[0]);
        expect(allTokensSame).toBe(true);

        // Property assertion: Token should match the expected value
        expect(tokens[0]).toBe(tokenValue);

        // Property assertion: Auth endpoint should only be called once
        expect(fetchCallCount).toBe(1);
      }
    });

    it("token cache is invalidated when token expires", async () => {
      // Generate test cases with short expiration times
      const testCases = fc.sample(
        fc.record({
          firstToken: fc.string({ minLength: 20, maxLength: 50 }),
          secondToken: fc.string({ minLength: 20, maxLength: 50 }),
        }),
        50
      );

      for (const { firstToken, secondToken } of testCases) {
        // Clear cache for each test case
        IGDBService.clearTokenCache();

        let fetchCallCount = 0;
        let currentToken = firstToken;

        global.fetch = vi.fn((url: string) => {
          if (url.includes("twitch.tv/oauth2/token")) {
            fetchCallCount++;
            const response = {
              access_token: currentToken,
              expires_in: 1, // Very short expiration (1 second, but with 5 min buffer becomes negative)
              token_type: "bearer",
            };
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () => Promise.resolve(response),
            } as Response);
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve([]),
          } as Response);
        });

        // First request - should fetch new token
        const token1 = await IGDBService.getAccessToken();
        expect(token1).toBe(firstToken);
        expect(fetchCallCount).toBe(1);

        // Change the token that will be returned
        currentToken = secondToken;

        // Second request - token should be expired (expires_in=1 with 5 min buffer = already expired)
        // So it should fetch a new token
        const token2 = await IGDBService.getAccessToken();
        expect(token2).toBe(secondToken);
        expect(fetchCallCount).toBe(2);
      }
    });

    it("cached token is returned without network call when valid", async () => {
      // Generate test cases
      const testCases = fc.sample(
        fc.record({
          tokenValue: fc.string({ minLength: 20, maxLength: 50 }),
          expiresIn: fc.integer({ min: 7200, max: 86400 }), // At least 2 hours
          numSubsequentCalls: fc.integer({ min: 1, max: 20 }),
        }),
        100
      );

      for (const { tokenValue, expiresIn, numSubsequentCalls } of testCases) {
        IGDBService.clearTokenCache();

        let authCallCount = 0;

        global.fetch = vi.fn((url: string) => {
          if (url.includes("twitch.tv/oauth2/token")) {
            authCallCount++;
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () =>
                Promise.resolve({
                  access_token: tokenValue,
                  expires_in: expiresIn,
                  token_type: "bearer",
                }),
            } as Response);
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve([]),
          } as Response);
        });

        // First call - should hit the auth endpoint
        await IGDBService.getAccessToken();
        expect(authCallCount).toBe(1);

        // Subsequent calls - should NOT hit the auth endpoint
        for (let i = 0; i < numSubsequentCalls; i++) {
          const token = await IGDBService.getAccessToken();
          expect(token).toBe(tokenValue);
        }

        // Auth endpoint should still only have been called once
        expect(authCallCount).toBe(1);
      }
    });

    it("getTokenCache returns the cached token state correctly", async () => {
      const testCases = fc.sample(
        fc.record({
          tokenValue: fc.string({ minLength: 20, maxLength: 50 }),
          expiresIn: fc.integer({ min: 3600, max: 86400 }),
        }),
        50
      );

      for (const { tokenValue, expiresIn } of testCases) {
        IGDBService.clearTokenCache();

        // Before any request, cache should be null
        expect(IGDBService.getTokenCache()).toBeNull();

        global.fetch = vi.fn((url: string) => {
          if (url.includes("twitch.tv/oauth2/token")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () =>
                Promise.resolve({
                  access_token: tokenValue,
                  expires_in: expiresIn,
                  token_type: "bearer",
                }),
            } as Response);
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve([]),
          } as Response);
        });

        // After request, cache should contain the token
        await IGDBService.getAccessToken();
        const cachedToken = IGDBService.getTokenCache();

        expect(cachedToken).not.toBeNull();
        expect(cachedToken?.access_token).toBe(tokenValue);
        expect(cachedToken?.expires_in).toBe(expiresIn);
        expect(cachedToken?.token_type).toBe("bearer");
        expect(typeof cachedToken?.expires_at).toBe("number");
        expect(cachedToken?.expires_at).toBeGreaterThan(Date.now());
      }
    });

    it("clearTokenCache properly clears the cache", async () => {
      const testCases = fc.sample(
        fc.record({
          tokenValue: fc.string({ minLength: 20, maxLength: 50 }),
        }),
        50
      );

      for (const { tokenValue } of testCases) {
        IGDBService.clearTokenCache();

        global.fetch = vi.fn((url: string) => {
          if (url.includes("twitch.tv/oauth2/token")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () =>
                Promise.resolve({
                  access_token: tokenValue,
                  expires_in: 3600,
                  token_type: "bearer",
                }),
            } as Response);
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve([]),
          } as Response);
        });

        // Populate the cache
        await IGDBService.getAccessToken();
        expect(IGDBService.getTokenCache()).not.toBeNull();

        // Clear the cache
        IGDBService.clearTokenCache();
        expect(IGDBService.getTokenCache()).toBeNull();
      }
    });
  });

  // Feature: igdb-hybrid-search, Property 11: Transformation donnÃ©es IGDB valide
  // **Validates: Requirements 6.4**
  describe("Property 11: Transformation donnÃ©es IGDB valide", () => {
    // Arbitrary generator for IGDBGame objects
    const igdbGameArbitrary = fc.record({
      id: fc.integer({ min: 1, max: 999999 }),
      name: fc.string({ minLength: 1, maxLength: 200 }),
      slug: fc
        .string({ minLength: 1, maxLength: 200 })
        .map((s) => s.toLowerCase().replace(/\s+/g, "-")),
      summary: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
      storyline: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
      first_release_date: fc.option(
        fc.integer({ min: 0, max: 2147483647 }), // Unix timestamp range
        { nil: undefined }
      ),
      cover: fc.option(
        fc.record({
          image_id: fc.string({ minLength: 5, maxLength: 20 }),
        }),
        { nil: undefined }
      ),
      screenshots: fc.option(
        fc.array(fc.record({ image_id: fc.string({ minLength: 5, maxLength: 20 }) }), {
          minLength: 0,
          maxLength: 5,
        }),
        { nil: undefined }
      ),
      artworks: fc.option(
        fc.array(fc.record({ image_id: fc.string({ minLength: 5, maxLength: 20 }) }), {
          minLength: 0,
          maxLength: 5,
        }),
        { nil: undefined }
      ),
      genres: fc.option(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 100 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            slug: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        { nil: undefined }
      ),
      involved_companies: fc.option(
        fc.array(
          fc.record({
            company: fc.record({
              id: fc.integer({ min: 1, max: 99999 }),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              slug: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            developer: fc.boolean(),
            publisher: fc.boolean(),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        { nil: undefined }
      ),
      aggregated_rating: fc.option(fc.float({ min: 0, max: 100 }), { nil: undefined }),
    });

    it("for any IGDB game data, transformation to IGDBSearchResult produces a valid object", async () => {
      await fc.assert(
        fc.asyncProperty(igdbGameArbitrary, async (igdbGame: IGDBGame) => {
          IGDBService.clearTokenCache();

          // Mock fetch to return the generated game
          global.fetch = vi.fn((url: string) => {
            if (url.includes("twitch.tv/oauth2/token")) {
              return Promise.resolve({
                ok: true,
                status: 200,
                statusText: "OK",
                json: () =>
                  Promise.resolve({
                    access_token: "test-token",
                    expires_in: 3600,
                    token_type: "bearer",
                  }),
              } as Response);
            }
            // Return the generated game for IGDB API calls
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () => Promise.resolve([igdbGame]),
            } as Response);
          });

          // Call searchGames which internally uses transformToSearchResult
          const results = await IGDBService.searchGames("test", 1);

          // Property assertions: The result must be a valid IGDBSearchResult
          expect(results).toBeInstanceOf(Array);
          expect(results.length).toBe(1);

          const result = results[0];

          // Required fields must be present and have correct types
          expect(typeof result.id).toBe("number");
          expect(result.id).toBe(igdbGame.id);

          expect(typeof result.name).toBe("string");
          expect(result.name).toBe(igdbGame.name);

          expect(typeof result.slug).toBe("string");
          expect(result.slug).toBe(igdbGame.slug);

          // Optional fields must be undefined or have correct types
          if (result.cover_url !== undefined) {
            expect(typeof result.cover_url).toBe("string");
            // If cover was provided, cover_url should be a valid URL
            if (igdbGame.cover?.image_id) {
              expect(result.cover_url).toContain("images.igdb.com");
              expect(result.cover_url).toContain(igdbGame.cover.image_id);
            }
          } else {
            // If no cover was provided, cover_url should be undefined
            expect(igdbGame.cover?.image_id).toBeFalsy();
          }

          if (result.release_year !== undefined) {
            expect(typeof result.release_year).toBe("number");
            // Year should be a reasonable value (1970-2100)
            expect(result.release_year).toBeGreaterThanOrEqual(1970);
            expect(result.release_year).toBeLessThanOrEqual(2100);
            // If first_release_date was provided, year should match
            if (igdbGame.first_release_date) {
              const expectedYear = new Date(igdbGame.first_release_date * 1000).getFullYear();
              expect(result.release_year).toBe(expectedYear);
            }
          } else {
            // If no release date was provided, release_year should be undefined
            expect(igdbGame.first_release_date).toBeFalsy();
          }

          if (result.developer !== undefined) {
            expect(typeof result.developer).toBe("string");
            // Developer should match one of the involved companies marked as developer
            const developerCompany = igdbGame.involved_companies?.find((ic) => ic.developer);
            expect(developerCompany).toBeDefined();
            expect(result.developer).toBe(developerCompany?.company?.name);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("transformation handles edge cases: empty optional fields", async () => {
      // Test with minimal game data (only required fields)
      const minimalGames = fc.sample(
        fc.record({
          id: fc.integer({ min: 1, max: 999999 }),
          name: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 200 }),
        }),
        100
      );

      for (const minimalGame of minimalGames) {
        IGDBService.clearTokenCache();

        global.fetch = vi.fn((url: string) => {
          if (url.includes("twitch.tv/oauth2/token")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () =>
                Promise.resolve({
                  access_token: "test-token",
                  expires_in: 3600,
                  token_type: "bearer",
                }),
            } as Response);
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve([minimalGame]),
          } as Response);
        });

        const results = await IGDBService.searchGames("test", 1);

        expect(results.length).toBe(1);
        const result = results[0];

        // Required fields must be present
        expect(result.id).toBe(minimalGame.id);
        expect(result.name).toBe(minimalGame.name);
        expect(result.slug).toBe(minimalGame.slug);

        // Optional fields should be undefined when not provided
        expect(result.cover_url).toBeUndefined();
        expect(result.release_year).toBeUndefined();
        expect(result.developer).toBeUndefined();
      }
    });

    it("transformation correctly extracts developer from involved_companies", async () => {
      // Generate games with various involved_companies configurations
      const gamesWithCompanies = fc.sample(
        fc.record({
          id: fc.integer({ min: 1, max: 999999 }),
          name: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 200 }),
          involved_companies: fc.array(
            fc.record({
              company: fc.record({
                id: fc.integer({ min: 1, max: 99999 }),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                slug: fc.string({ minLength: 1, maxLength: 100 }),
              }),
              developer: fc.boolean(),
              publisher: fc.boolean(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        100
      );

      for (const game of gamesWithCompanies) {
        IGDBService.clearTokenCache();

        global.fetch = vi.fn((url: string) => {
          if (url.includes("twitch.tv/oauth2/token")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () =>
                Promise.resolve({
                  access_token: "test-token",
                  expires_in: 3600,
                  token_type: "bearer",
                }),
            } as Response);
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve([game]),
          } as Response);
        });

        const results = await IGDBService.searchGames("test", 1);
        const result = results[0];

        // Find the first developer in the involved_companies
        const expectedDeveloper = game.involved_companies?.find((ic) => ic.developer);

        if (expectedDeveloper) {
          expect(result.developer).toBe(expectedDeveloper.company.name);
        } else {
          expect(result.developer).toBeUndefined();
        }
      }
    });

    it("buildImageUrl produces valid URLs for all image sizes", async () => {
      const imageSizes: Array<"cover_small" | "cover_big" | "screenshot_big" | "1080p" | "720p"> = [
        "cover_small",
        "cover_big",
        "screenshot_big",
        "1080p",
        "720p",
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }),
          fc.constantFrom(...imageSizes),
          async (imageId, size) => {
            const url = IGDBService.buildImageUrl(imageId, size);

            // URL must be a valid string
            expect(typeof url).toBe("string");

            // URL must contain the IGDB image base URL
            expect(url).toContain("images.igdb.com/igdb/image/upload");

            // URL must contain the size parameter
            expect(url).toContain(`t_${size}`);

            // URL must contain the image ID
            expect(url).toContain(imageId);

            // URL must end with .jpg
            expect(url).toMatch(/\.jpg$/);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
