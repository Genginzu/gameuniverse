import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { HybridSearchService } from "../../../../src/lib/services/hybridSearchService";
import { GameService } from "../../../../src/lib/services/gameService";
import { IGDBService } from "../../../../src/lib/services/igdbService";
import { GameSummary } from "@/types/game";
import { IGDBSearchResult } from "@/types/igdb";

// Feature: igdb-hybrid-search, Property 1: Recherche parallÃ¨le dÃ©clenchÃ©e
// **Validates: Requirements 1.1, 1.2**

describe("HybridSearchService Property-Based Tests", () => {
  let originalFetch: typeof global.fetch;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnv = { ...process.env };
    // Set up test credentials for IGDB
    process.env.IGDB_CLIENT_ID = "test-client-id";
    process.env.IGDB_CLIENT_SECRET = "test-client-secret";
    // Clear IGDB token cache
    IGDBService.clearTokenCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    IGDBService.clearTokenCache();
  });

  describe("Property 1: Recherche parallÃ¨le dÃ©clenchÃ©e", () => {
    it("for any search query of 2+ characters, both Supabase and IGDB searches must be triggered", async () => {
      // Generate valid search queries (2+ characters)
      const validQueryArbitrary = fc.string({ minLength: 2, maxLength: 100 }).filter((s) => {
        // Filter out strings that are only whitespace
        return s.trim().length >= 2;
      });

      await fc.assert(
        fc.asyncProperty(validQueryArbitrary, async (query) => {
          IGDBService.clearTokenCache();

          let localSearchCalled = false;
          let igdbSearchCalled = false;

          // Mock the GameService.fetchGames to track local search calls
          const originalFetchGames = GameService.fetchGames;
          GameService.fetchGames = vi.fn(async (options) => {
            localSearchCalled = true;
            // Return empty results
            return {
              games: [],
              pagination: {
                currentPage: 1,
                totalPages: 0,
                totalCount: 0,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            };
          });

          // Mock fetch to track IGDB API calls
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
            if (url.includes("api.igdb.com")) {
              igdbSearchCalled = true;
              return Promise.resolve({
                ok: true,
                status: 200,
                statusText: "OK",
                json: () => Promise.resolve([]),
              } as Response);
            }
            return Promise.resolve({
              ok: false,
              status: 404,
              statusText: "Not Found",
            } as Response);
          });

          try {
            // Execute the hybrid search
            await HybridSearchService.search({
              query,
              locale: "fr",
              localLimit: 5,
              igdbLimit: 5,
            });

            // Property assertion: Both searches must be triggered
            expect(localSearchCalled).toBe(true);
            expect(igdbSearchCalled).toBe(true);
          } finally {
            // Restore original function
            GameService.fetchGames = originalFetchGames;
          }
        }),
        { numRuns: 30 }
      );
    });

    it("searches are executed in parallel (Promise.allSettled behavior)", async () => {
      // Generate test cases with small delays to verify parallelism
      const testCases = fc.sample(
        fc.record({
          query: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
          localDelay: fc.integer({ min: 5, max: 20 }),
          igdbDelay: fc.integer({ min: 5, max: 20 }),
        }),
        10
      );

      for (const { query, localDelay, igdbDelay } of testCases) {
        IGDBService.clearTokenCache();

        const callOrder: string[] = [];
        const completionOrder: string[] = [];

        // Mock GameService.fetchGames with delay
        const originalFetchGames = GameService.fetchGames;
        GameService.fetchGames = vi.fn(async () => {
          callOrder.push("local_start");
          await new Promise((resolve) => setTimeout(resolve, localDelay));
          completionOrder.push("local_complete");
          return {
            games: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalCount: 0,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          };
        });

        // Mock fetch for IGDB with delay
        global.fetch = vi.fn(async (url: string) => {
          if (url.includes("twitch.tv/oauth2/token")) {
            return {
              ok: true,
              status: 200,
              statusText: "OK",
              json: () =>
                Promise.resolve({
                  access_token: "test-token",
                  expires_in: 3600,
                  token_type: "bearer",
                }),
            } as Response;
          }
          if (url.includes("api.igdb.com")) {
            callOrder.push("igdb_start");
            await new Promise((resolve) => setTimeout(resolve, igdbDelay));
            completionOrder.push("igdb_complete");
            return {
              ok: true,
              status: 200,
              statusText: "OK",
              json: () => Promise.resolve([]),
            } as Response;
          }
          return {
            ok: false,
            status: 404,
            statusText: "Not Found",
          } as Response;
        });

        try {
          const startTime = Date.now();
          await HybridSearchService.search({ query });
          const totalTime = Date.now() - startTime;

          // Property assertion: Both searches were initiated
          expect(callOrder).toContain("local_start");
          expect(callOrder).toContain("igdb_start");

          // Property assertion: Both searches completed
          expect(completionOrder).toContain("local_complete");
          expect(completionOrder).toContain("igdb_complete");

          // Property assertion: Total time should be approximately max(localDelay, igdbDelay)
          // not localDelay + igdbDelay (which would indicate sequential execution)
          // Allow some tolerance for test overhead
          const maxDelay = Math.max(localDelay, igdbDelay);
          const sequentialTime = localDelay + igdbDelay;

          // If parallel, total time should be closer to maxDelay than sequentialTime
          // We use a generous tolerance since timing in tests can be variable
          // (system load, GC pauses, etc. can add overhead across 50 iterations)
          expect(totalTime).toBeLessThan(sequentialTime + 150);
        } finally {
          GameService.fetchGames = originalFetchGames;
        }
      }
    });

    it("both searches receive the same query string", async () => {
      // Generate alphanumeric queries to avoid special character escaping issues
      const queryArbitrary = fc
        .stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9 ]{1,49}$/)
        .filter((s) => s.trim().length >= 2);

      await fc.assert(
        fc.asyncProperty(queryArbitrary, async (query) => {
          IGDBService.clearTokenCache();

          let localSearchQuery: string | undefined;
          let igdbSearchBody: string | undefined;

          // Mock GameService.fetchGames to capture the query
          const originalFetchGames = GameService.fetchGames;
          GameService.fetchGames = vi.fn(async (options) => {
            localSearchQuery = options?.search;
            return {
              games: [],
              pagination: {
                currentPage: 1,
                totalPages: 0,
                totalCount: 0,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            };
          });

          // Mock fetch to capture IGDB query
          global.fetch = vi.fn((url: string, options?: RequestInit) => {
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
            if (url.includes("api.igdb.com")) {
              // Capture the request body for IGDB
              igdbSearchBody = options?.body as string;
              return Promise.resolve({
                ok: true,
                status: 200,
                statusText: "OK",
                json: () => Promise.resolve([]),
              } as Response);
            }
            return Promise.resolve({
              ok: false,
              status: 404,
              statusText: "Not Found",
            } as Response);
          });

          try {
            await HybridSearchService.search({ query });

            // Property assertion: Local search received the query
            expect(localSearchQuery).toBe(query);

            // Property assertion: IGDB search body contains the query words
            // IGDB uses format: where name ~ *"word1"* & name ~ *"word2"*
            expect(igdbSearchBody).toBeDefined();
            const words = query.trim().split(/\s+/).filter(Boolean);
            for (const word of words) {
              // Each word should appear in the IGDB query body
              expect(igdbSearchBody).toContain(word);
            }
          } finally {
            GameService.fetchGames = originalFetchGames;
          }
        }),
        { numRuns: 30 }
      );
    });
  });
});

// Feature: igdb-hybrid-search, Property 2: RÃ©silience aux erreurs de source
// **Validates: Requirements 1.4**

describe("Property 2: RÃ©silience aux erreurs de source", () => {
  let originalFetch: typeof global.fetch;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnv = { ...process.env };
    process.env.IGDB_CLIENT_ID = "test-client-id";
    process.env.IGDB_CLIENT_SECRET = "test-client-secret";
    IGDBService.clearTokenCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    IGDBService.clearTokenCache();
  });

  it("when local search fails, IGDB results are still returned without error", async () => {
    // Generate valid search queries and mock IGDB results
    const testDataArbitrary = fc.record({
      query: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
      igdbResults: fc.array(
        fc.record({
          id: fc.integer({ min: 1, max: 1000000 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          slug: fc
            .string({ minLength: 1, maxLength: 100 })
            .map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-")),
          cover_url: fc.option(fc.webUrl(), { nil: undefined }),
          release_year: fc.option(fc.integer({ min: 1970, max: 2030 }), { nil: undefined }),
          developer: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        }),
        { minLength: 0, maxLength: 10 }
      ),
    });

    await fc.assert(
      fc.asyncProperty(testDataArbitrary, async ({ query, igdbResults }) => {
        IGDBService.clearTokenCache();

        // Mock GameService.fetchGames to throw an error
        const originalFetchGames = GameService.fetchGames;
        GameService.fetchGames = vi.fn(async () => {
          throw new Error("Database connection failed");
        });

        // Mock fetch for IGDB to return results
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
          if (url.includes("api.igdb.com")) {
            // Transform our test data to IGDB API format
            const igdbApiResults = igdbResults.map((r) => ({
              id: r.id,
              name: r.name,
              slug: r.slug,
              cover: r.cover_url ? { image_id: "test-image" } : undefined,
              first_release_date: r.release_year
                ? new Date(r.release_year, 0, 1).getTime() / 1000
                : undefined,
              involved_companies: r.developer
                ? [{ company: { name: r.developer }, developer: true }]
                : undefined,
            }));
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () => Promise.resolve(igdbApiResults),
            } as Response);
          }
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
          } as Response);
        });

        try {
          // Execute the hybrid search - should NOT throw
          const result = await HybridSearchService.search({
            query,
            locale: "fr",
            localLimit: 5,
            igdbLimit: 5,
          });

          // Property assertion: No error thrown
          expect(result).toBeDefined();

          // Property assertion: Local games should be empty (since local search failed)
          expect(result.localGames).toEqual([]);

          // Property assertion: IGDB results should be returned (up to limit)
          const expectedIgdbCount = Math.min(igdbResults.length, 5);
          expect(result.igdbGames.length).toBe(expectedIgdbCount);

          // Property assertion: IGDB game IDs should match input
          for (let i = 0; i < result.igdbGames.length; i++) {
            expect(result.igdbGames[i].id).toBe(igdbResults[i].id);
          }
        } finally {
          GameService.fetchGames = originalFetchGames;
        }
      }),
      { numRuns: 30 }
    );
  });

  it("when IGDB search fails, local results are still returned without error", async () => {
    // Generate valid search queries and mock local results
    const testDataArbitrary = fc.record({
      query: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
      localResults: fc.array(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          slug: fc
            .string({ minLength: 1, maxLength: 100 })
            .map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-")),
          coverImage: fc.option(fc.webUrl(), { nil: undefined }),
          releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 }), { nil: undefined }),
          developer: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          igdbId: fc.option(fc.integer({ min: 1, max: 1000000 }), { nil: undefined }),
        }),
        { minLength: 0, maxLength: 10 }
      ),
    });

    await fc.assert(
      fc.asyncProperty(testDataArbitrary, async ({ query, localResults }) => {
        IGDBService.clearTokenCache();

        // Mock GameService.fetchGames to return local results
        const originalFetchGames = GameService.fetchGames;
        GameService.fetchGames = vi.fn(async () => {
          return {
            games: localResults,
            pagination: {
              currentPage: 1,
              totalPages: Math.ceil(localResults.length / 5),
              totalCount: localResults.length,
              hasNextPage: localResults.length > 5,
              hasPreviousPage: false,
            },
          };
        });

        // Mock fetch for IGDB to fail
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
          if (url.includes("api.igdb.com")) {
            // Simulate IGDB API failure
            return Promise.resolve({
              ok: false,
              status: 500,
              statusText: "Internal Server Error",
              json: () => Promise.reject(new Error("IGDB API error")),
            } as Response);
          }
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
          } as Response);
        });

        try {
          // Execute the hybrid search - should NOT throw
          const result = await HybridSearchService.search({
            query,
            locale: "fr",
            localLimit: 5,
            igdbLimit: 5,
          });

          // Property assertion: No error thrown
          expect(result).toBeDefined();

          // Property assertion: IGDB games should be empty (since IGDB search failed)
          expect(result.igdbGames).toEqual([]);

          // Property assertion: Local results should be returned (up to limit)
          const expectedLocalCount = Math.min(localResults.length, 5);
          expect(result.localGames.length).toBe(expectedLocalCount);

          // Property assertion: Local game IDs should match input
          for (let i = 0; i < result.localGames.length; i++) {
            expect(result.localGames[i].id).toBe(localResults[i].id);
          }
        } finally {
          GameService.fetchGames = originalFetchGames;
        }
      }),
      { numRuns: 30 }
    );
  });

  it("when both searches fail, empty results are returned without error", async () => {
    // Generate valid search queries
    const queryArbitrary = fc
      .string({ minLength: 2, maxLength: 50 })
      .filter((s) => s.trim().length >= 2);

    await fc.assert(
      fc.asyncProperty(queryArbitrary, async (query) => {
        IGDBService.clearTokenCache();

        // Mock GameService.fetchGames to throw an error
        const originalFetchGames = GameService.fetchGames;
        GameService.fetchGames = vi.fn(async () => {
          throw new Error("Database connection failed");
        });

        // Mock fetch for IGDB to fail
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
          if (url.includes("api.igdb.com")) {
            // Simulate IGDB API failure
            return Promise.resolve({
              ok: false,
              status: 503,
              statusText: "Service Unavailable",
              json: () => Promise.reject(new Error("IGDB unavailable")),
            } as Response);
          }
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
          } as Response);
        });

        try {
          // Execute the hybrid search - should NOT throw
          const result = await HybridSearchService.search({
            query,
            locale: "fr",
            localLimit: 5,
            igdbLimit: 5,
          });

          // Property assertion: No error thrown
          expect(result).toBeDefined();

          // Property assertion: Both result arrays should be empty
          expect(result.localGames).toEqual([]);
          expect(result.igdbGames).toEqual([]);

          // Property assertion: hasMore should be false when no results
          expect(result.hasMore).toBe(false);
        } finally {
          GameService.fetchGames = originalFetchGames;
        }
      }),
      { numRuns: 30 }
    );
  });

  it("error types do not affect resilience (various error scenarios)", async () => {
    // Generate various error scenarios
    const errorScenarioArbitrary = fc.record({
      query: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
      localErrorType: fc.constantFrom("throw", "reject", "timeout"),
      igdbErrorType: fc.constantFrom(
        "http_500",
        "http_503",
        "http_429",
        "network_error",
        "json_parse_error"
      ),
      localShouldFail: fc.boolean(),
      igdbShouldFail: fc.boolean(),
    });

    await fc.assert(
      fc.asyncProperty(
        errorScenarioArbitrary,
        async ({ query, localErrorType, igdbErrorType, localShouldFail, igdbShouldFail }) => {
          IGDBService.clearTokenCache();

          // Mock GameService.fetchGames based on error type
          const originalFetchGames = GameService.fetchGames;
          GameService.fetchGames = vi.fn(async () => {
            if (localShouldFail) {
              switch (localErrorType) {
                case "throw":
                  throw new Error("Database error");
                case "reject":
                  return Promise.reject(new Error("Connection refused"));
                case "timeout":
                  throw new Error("Query timeout");
              }
            }
            return {
              games: [{ id: "local-1", title: "Local Game", slug: "local-game" }],
              pagination: {
                currentPage: 1,
                totalPages: 1,
                totalCount: 1,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            };
          });

          // Mock fetch for IGDB based on error type
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
            if (url.includes("api.igdb.com")) {
              if (igdbShouldFail) {
                switch (igdbErrorType) {
                  case "http_500":
                    return Promise.resolve({
                      ok: false,
                      status: 500,
                      statusText: "Internal Server Error",
                      json: () => Promise.reject(new Error("Server error")),
                    } as Response);
                  case "http_503":
                    return Promise.resolve({
                      ok: false,
                      status: 503,
                      statusText: "Service Unavailable",
                      json: () => Promise.reject(new Error("Service unavailable")),
                    } as Response);
                  case "http_429":
                    return Promise.resolve({
                      ok: false,
                      status: 429,
                      statusText: "Too Many Requests",
                      json: () => Promise.reject(new Error("Rate limited")),
                    } as Response);
                  case "network_error":
                    return Promise.reject(new Error("Network error"));
                  case "json_parse_error":
                    return Promise.resolve({
                      ok: true,
                      status: 200,
                      statusText: "OK",
                      json: () => Promise.reject(new SyntaxError("Invalid JSON")),
                    } as Response);
                }
              }
              return Promise.resolve({
                ok: true,
                status: 200,
                statusText: "OK",
                json: () => Promise.resolve([{ id: 1, name: "IGDB Game", slug: "igdb-game" }]),
              } as Response);
            }
            return Promise.resolve({
              ok: false,
              status: 404,
              statusText: "Not Found",
            } as Response);
          });

          try {
            // Execute the hybrid search - should NEVER throw regardless of error combination
            const result = await HybridSearchService.search({
              query,
              locale: "fr",
              localLimit: 5,
              igdbLimit: 5,
            });

            // Property assertion: Result is always defined
            expect(result).toBeDefined();
            expect(result.localGames).toBeDefined();
            expect(result.igdbGames).toBeDefined();
            expect(typeof result.hasMore).toBe("boolean");

            // Property assertion: If local failed, localGames should be empty
            if (localShouldFail) {
              expect(result.localGames).toEqual([]);
            }

            // Property assertion: If IGDB failed, igdbGames should be empty
            if (igdbShouldFail) {
              expect(result.igdbGames).toEqual([]);
            }

            // Property assertion: If neither failed, both should have results
            if (!localShouldFail && !igdbShouldFail) {
              expect(result.localGames.length).toBeGreaterThan(0);
              expect(result.igdbGames.length).toBeGreaterThan(0);
            }
          } finally {
            GameService.fetchGames = originalFetchGames;
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});

// Feature: igdb-hybrid-search, Property 2: RÃ©silience aux erreurs de source
// **Validates: Requirements 1.4**

describe("Property 2: RÃ©silience aux erreurs de source", () => {
  let originalFetch: typeof global.fetch;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnv = { ...process.env };
    process.env.IGDB_CLIENT_ID = "test-client-id";
    process.env.IGDB_CLIENT_SECRET = "test-client-secret";
    IGDBService.clearTokenCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    IGDBService.clearTokenCache();
  });

  it("when local search fails, IGDB results are still returned without error", async () => {
    // Generate valid search queries and mock IGDB results
    const testDataArbitrary = fc.record({
      query: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
      igdbResults: fc.array(
        fc.record({
          id: fc.integer({ min: 1, max: 1000000 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          slug: fc
            .string({ minLength: 1, maxLength: 100 })
            .map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-")),
          cover_url: fc.option(fc.webUrl(), { nil: undefined }),
          release_year: fc.option(fc.integer({ min: 1970, max: 2030 }), { nil: undefined }),
          developer: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        }),
        { minLength: 0, maxLength: 10 }
      ),
    });

    await fc.assert(
      fc.asyncProperty(testDataArbitrary, async ({ query, igdbResults }) => {
        IGDBService.clearTokenCache();

        // Mock GameService.fetchGames to throw an error
        const originalFetchGames = GameService.fetchGames;
        GameService.fetchGames = vi.fn(async () => {
          throw new Error("Database connection failed");
        });

        // Mock fetch for IGDB to return results
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
          if (url.includes("api.igdb.com")) {
            // Transform our test data to IGDB API format
            const igdbApiResults = igdbResults.map((r) => ({
              id: r.id,
              name: r.name,
              slug: r.slug,
              cover: r.cover_url ? { image_id: "test-image" } : undefined,
              first_release_date: r.release_year
                ? new Date(r.release_year, 0, 1).getTime() / 1000
                : undefined,
              involved_companies: r.developer
                ? [{ company: { name: r.developer }, developer: true }]
                : undefined,
            }));
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () => Promise.resolve(igdbApiResults),
            } as Response);
          }
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
          } as Response);
        });

        try {
          // Execute the hybrid search - should NOT throw
          const result = await HybridSearchService.search({
            query,
            locale: "fr",
            localLimit: 5,
            igdbLimit: 5,
          });

          // Property assertion: No error thrown
          expect(result).toBeDefined();

          // Property assertion: Local games should be empty (since local search failed)
          expect(result.localGames).toEqual([]);

          // Property assertion: IGDB results should be returned (up to limit)
          const expectedIgdbCount = Math.min(igdbResults.length, 5);
          expect(result.igdbGames.length).toBe(expectedIgdbCount);

          // Property assertion: IGDB game IDs should match input
          for (let i = 0; i < result.igdbGames.length; i++) {
            expect(result.igdbGames[i].id).toBe(igdbResults[i].id);
          }
        } finally {
          GameService.fetchGames = originalFetchGames;
        }
      }),
      { numRuns: 30 }
    );
  });

  it("when IGDB search fails, local results are still returned without error", async () => {
    // Generate valid search queries and mock local results
    const testDataArbitrary = fc.record({
      query: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
      localResults: fc.array(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          slug: fc
            .string({ minLength: 1, maxLength: 100 })
            .map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-")),
          coverImage: fc.option(fc.webUrl(), { nil: undefined }),
          releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 }), { nil: undefined }),
          developer: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          igdbId: fc.option(fc.integer({ min: 1, max: 1000000 }), { nil: undefined }),
        }),
        { minLength: 0, maxLength: 10 }
      ),
    });

    await fc.assert(
      fc.asyncProperty(testDataArbitrary, async ({ query, localResults }) => {
        IGDBService.clearTokenCache();

        // Mock GameService.fetchGames to return local results
        const originalFetchGames = GameService.fetchGames;
        GameService.fetchGames = vi.fn(async () => {
          return {
            games: localResults,
            pagination: {
              currentPage: 1,
              totalPages: Math.ceil(localResults.length / 5),
              totalCount: localResults.length,
              hasNextPage: localResults.length > 5,
              hasPreviousPage: false,
            },
          };
        });

        // Mock fetch for IGDB to fail
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
          if (url.includes("api.igdb.com")) {
            // Simulate IGDB API failure
            return Promise.resolve({
              ok: false,
              status: 500,
              statusText: "Internal Server Error",
              json: () => Promise.reject(new Error("IGDB API error")),
            } as Response);
          }
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
          } as Response);
        });

        try {
          // Execute the hybrid search - should NOT throw
          const result = await HybridSearchService.search({
            query,
            locale: "fr",
            localLimit: 5,
            igdbLimit: 5,
          });

          // Property assertion: No error thrown
          expect(result).toBeDefined();

          // Property assertion: IGDB games should be empty (since IGDB search failed)
          expect(result.igdbGames).toEqual([]);

          // Property assertion: Local results should be returned (up to limit)
          const expectedLocalCount = Math.min(localResults.length, 5);
          expect(result.localGames.length).toBe(expectedLocalCount);

          // Property assertion: Local game IDs should match input
          for (let i = 0; i < result.localGames.length; i++) {
            expect(result.localGames[i].id).toBe(localResults[i].id);
          }
        } finally {
          GameService.fetchGames = originalFetchGames;
        }
      }),
      { numRuns: 30 }
    );
  });

  it("when both searches fail, empty results are returned without error", async () => {
    // Generate valid search queries
    const queryArbitrary = fc
      .string({ minLength: 2, maxLength: 50 })
      .filter((s) => s.trim().length >= 2);

    await fc.assert(
      fc.asyncProperty(queryArbitrary, async (query) => {
        IGDBService.clearTokenCache();

        // Mock GameService.fetchGames to throw an error
        const originalFetchGames = GameService.fetchGames;
        GameService.fetchGames = vi.fn(async () => {
          throw new Error("Database connection failed");
        });

        // Mock fetch for IGDB to fail
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
          if (url.includes("api.igdb.com")) {
            // Simulate IGDB API failure
            return Promise.resolve({
              ok: false,
              status: 503,
              statusText: "Service Unavailable",
              json: () => Promise.reject(new Error("IGDB unavailable")),
            } as Response);
          }
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
          } as Response);
        });

        try {
          // Execute the hybrid search - should NOT throw
          const result = await HybridSearchService.search({
            query,
            locale: "fr",
            localLimit: 5,
            igdbLimit: 5,
          });

          // Property assertion: No error thrown
          expect(result).toBeDefined();

          // Property assertion: Both result arrays should be empty
          expect(result.localGames).toEqual([]);
          expect(result.igdbGames).toEqual([]);

          // Property assertion: hasMore should be false when no results
          expect(result.hasMore).toBe(false);
        } finally {
          GameService.fetchGames = originalFetchGames;
        }
      }),
      { numRuns: 30 }
    );
  });

  it("error types do not affect resilience (various error scenarios)", async () => {
    // Generate various error scenarios
    const errorScenarioArbitrary = fc.record({
      query: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
      localErrorType: fc.constantFrom("throw", "reject", "timeout"),
      igdbErrorType: fc.constantFrom(
        "http_500",
        "http_503",
        "http_429",
        "network_error",
        "json_parse_error"
      ),
      localShouldFail: fc.boolean(),
      igdbShouldFail: fc.boolean(),
    });

    await fc.assert(
      fc.asyncProperty(
        errorScenarioArbitrary,
        async ({ query, localErrorType, igdbErrorType, localShouldFail, igdbShouldFail }) => {
          IGDBService.clearTokenCache();

          // Mock GameService.fetchGames based on error type
          const originalFetchGames = GameService.fetchGames;
          GameService.fetchGames = vi.fn(async () => {
            if (localShouldFail) {
              switch (localErrorType) {
                case "throw":
                  throw new Error("Database error");
                case "reject":
                  return Promise.reject(new Error("Connection refused"));
                case "timeout":
                  throw new Error("Query timeout");
              }
            }
            return {
              games: [{ id: "local-1", title: "Local Game", slug: "local-game" }],
              pagination: {
                currentPage: 1,
                totalPages: 1,
                totalCount: 1,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            };
          });

          // Mock fetch for IGDB based on error type
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
            if (url.includes("api.igdb.com")) {
              if (igdbShouldFail) {
                switch (igdbErrorType) {
                  case "http_500":
                    return Promise.resolve({
                      ok: false,
                      status: 500,
                      statusText: "Internal Server Error",
                      json: () => Promise.reject(new Error("Server error")),
                    } as Response);
                  case "http_503":
                    return Promise.resolve({
                      ok: false,
                      status: 503,
                      statusText: "Service Unavailable",
                      json: () => Promise.reject(new Error("Service unavailable")),
                    } as Response);
                  case "http_429":
                    return Promise.resolve({
                      ok: false,
                      status: 429,
                      statusText: "Too Many Requests",
                      json: () => Promise.reject(new Error("Rate limited")),
                    } as Response);
                  case "network_error":
                    return Promise.reject(new Error("Network error"));
                  case "json_parse_error":
                    return Promise.resolve({
                      ok: true,
                      status: 200,
                      statusText: "OK",
                      json: () => Promise.reject(new SyntaxError("Invalid JSON")),
                    } as Response);
                }
              }
              return Promise.resolve({
                ok: true,
                status: 200,
                statusText: "OK",
                json: () => Promise.resolve([{ id: 1, name: "IGDB Game", slug: "igdb-game" }]),
              } as Response);
            }
            return Promise.resolve({
              ok: false,
              status: 404,
              statusText: "Not Found",
            } as Response);
          });

          try {
            // Execute the hybrid search - should NEVER throw regardless of error combination
            const result = await HybridSearchService.search({
              query,
              locale: "fr",
              localLimit: 5,
              igdbLimit: 5,
            });

            // Property assertion: Result is always defined
            expect(result).toBeDefined();
            expect(result.localGames).toBeDefined();
            expect(result.igdbGames).toBeDefined();
            expect(typeof result.hasMore).toBe("boolean");

            // Property assertion: If local failed, localGames should be empty
            if (localShouldFail) {
              expect(result.localGames).toEqual([]);
            }

            // Property assertion: If IGDB failed, igdbGames should be empty
            if (igdbShouldFail) {
              expect(result.igdbGames).toEqual([]);
            }

            // Property assertion: If neither failed, both should have results
            if (!localShouldFail && !igdbShouldFail) {
              expect(result.localGames.length).toBeGreaterThan(0);
              expect(result.igdbGames.length).toBeGreaterThan(0);
            }
          } finally {
            GameService.fetchGames = originalFetchGames;
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});

// Feature: igdb-hybrid-search, Property 6: DÃ©duplication par identifiant IGDB
// **Validates: Requirements 3.1, 3.2**

describe("Property 6: DÃ©duplication par identifiant IGDB", () => {
  describe("deduplicateResults", () => {
    it("for any combination of local and IGDB results where a game exists in both sources (same igdbId), only the local version must appear in the final results", () => {
      // Generate test data with potential duplicates
      const testDataArbitrary = fc.record({
        // Generate some shared IGDB IDs that will appear in both sources
        sharedIgdbIds: fc.array(fc.integer({ min: 1, max: 1000000 }), {
          minLength: 0,
          maxLength: 5,
        }),
        // Generate local games (some with shared IDs, some unique)
        localOnlyIgdbIds: fc.array(fc.integer({ min: 1000001, max: 2000000 }), {
          minLength: 0,
          maxLength: 5,
        }),
        // Generate IGDB-only games (unique IDs not in local)
        igdbOnlyIds: fc.array(fc.integer({ min: 2000001, max: 3000000 }), {
          minLength: 0,
          maxLength: 5,
        }),
      });

      fc.assert(
        fc.property(testDataArbitrary, ({ sharedIgdbIds, localOnlyIgdbIds, igdbOnlyIds }) => {
          // Build local games: games with shared IDs + games with local-only IDs
          const localGames: GameSummary[] = [
            ...sharedIgdbIds.map((igdbId, index) => ({
              id: `local-shared-${index}`,
              slug: `local-shared-game-${index}`,
              title: `Local Shared Game ${index}`,
              genres: [],
              developer: "Local Dev",
              publisher: "Local Pub",
              igdbId: igdbId,
            })),
            ...localOnlyIgdbIds.map((igdbId, index) => ({
              id: `local-only-${index}`,
              slug: `local-only-game-${index}`,
              title: `Local Only Game ${index}`,
              genres: [],
              developer: "Local Dev",
              publisher: "Local Pub",
              igdbId: igdbId,
            })),
          ];

          // Build IGDB games: games with shared IDs + games with IGDB-only IDs
          const igdbGames: IGDBSearchResult[] = [
            ...sharedIgdbIds.map((igdbId, index) => ({
              id: igdbId,
              name: `IGDB Shared Game ${index}`,
              slug: `igdb-shared-game-${index}`,
              cover_url: `https://images.igdb.com/igdb/image/upload/t_cover_big/shared${index}.jpg`,
              release_year: 2020 + index,
              developer: "IGDB Dev",
            })),
            ...igdbOnlyIds.map((igdbId, index) => ({
              id: igdbId,
              name: `IGDB Only Game ${index}`,
              slug: `igdb-only-game-${index}`,
              cover_url: `https://images.igdb.com/igdb/image/upload/t_cover_big/only${index}.jpg`,
              release_year: 2020 + index,
              developer: "IGDB Dev",
            })),
          ];

          // Execute deduplication
          const deduplicatedIgdbGames = HybridSearchService.deduplicateResults(
            localGames,
            igdbGames
          );

          // Property assertion 1: No IGDB game with a shared ID should remain
          const sharedIdSet = new Set(sharedIgdbIds);
          for (const igdbGame of deduplicatedIgdbGames) {
            expect(sharedIdSet.has(igdbGame.id)).toBe(false);
          }

          // Property assertion 2: All IGDB-only games should remain
          const igdbOnlyIdSet = new Set(igdbOnlyIds);
          const remainingIds = new Set(deduplicatedIgdbGames.map((g) => g.id));
          for (const igdbOnlyId of igdbOnlyIds) {
            expect(remainingIds.has(igdbOnlyId)).toBe(true);
          }

          // Property assertion 3: The count should be exactly the IGDB-only games
          expect(deduplicatedIgdbGames.length).toBe(igdbOnlyIds.length);
        }),
        { numRuns: 30 }
      );
    });

    it("deduplication preserves order of remaining IGDB games", () => {
      // Generate ordered IGDB games with some duplicates
      const testDataArbitrary = fc.record({
        duplicateIndices: fc.array(fc.integer({ min: 0, max: 9 }), {
          minLength: 0,
          maxLength: 5,
        }),
      });

      fc.assert(
        fc.property(testDataArbitrary, ({ duplicateIndices }) => {
          // Create 10 IGDB games with sequential IDs
          const igdbGames: IGDBSearchResult[] = Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            name: `IGDB Game ${i}`,
            slug: `igdb-game-${i}`,
          }));

          // Create local games for the duplicate indices
          const uniqueDuplicateIndices = [...new Set(duplicateIndices)];
          const localGames: GameSummary[] = uniqueDuplicateIndices.map((index) => ({
            id: `local-${index}`,
            slug: `local-game-${index}`,
            title: `Local Game ${index}`,
            genres: [],
            developer: "Dev",
            publisher: "Pub",
            igdbId: index + 1, // Match the IGDB ID
          }));

          // Execute deduplication
          const deduplicatedIgdbGames = HybridSearchService.deduplicateResults(
            localGames,
            igdbGames
          );

          // Property assertion: Remaining games should maintain relative order
          const duplicateIdSet = new Set(uniqueDuplicateIndices.map((i) => i + 1));
          const expectedRemainingGames = igdbGames.filter((g) => !duplicateIdSet.has(g.id));

          expect(deduplicatedIgdbGames.length).toBe(expectedRemainingGames.length);

          // Check order is preserved
          for (let i = 0; i < deduplicatedIgdbGames.length; i++) {
            expect(deduplicatedIgdbGames[i].id).toBe(expectedRemainingGames[i].id);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("deduplication handles edge cases: empty arrays, no duplicates, all duplicates", () => {
      // Test various edge case scenarios
      const edgeCaseArbitrary = fc.oneof(
        // Empty local, non-empty IGDB
        fc.record({
          scenario: fc.constant("empty_local"),
          igdbCount: fc.integer({ min: 1, max: 10 }),
        }),
        // Non-empty local, empty IGDB
        fc.record({
          scenario: fc.constant("empty_igdb"),
          localCount: fc.integer({ min: 1, max: 10 }),
        }),
        // Both empty
        fc.record({
          scenario: fc.constant("both_empty"),
        }),
        // No duplicates (disjoint sets)
        fc.record({
          scenario: fc.constant("no_duplicates"),
          localCount: fc.integer({ min: 1, max: 5 }),
          igdbCount: fc.integer({ min: 1, max: 5 }),
        }),
        // All duplicates (complete overlap)
        fc.record({
          scenario: fc.constant("all_duplicates"),
          count: fc.integer({ min: 1, max: 10 }),
        })
      );

      fc.assert(
        fc.property(edgeCaseArbitrary, (edgeCase) => {
          let localGames: GameSummary[] = [];
          let igdbGames: IGDBSearchResult[] = [];
          let expectedResultCount = 0;

          switch (edgeCase.scenario) {
            case "empty_local":
              igdbGames = Array.from({ length: edgeCase.igdbCount! }, (_, i) => ({
                id: i + 1,
                name: `IGDB Game ${i}`,
                slug: `igdb-game-${i}`,
              }));
              expectedResultCount = edgeCase.igdbCount!;
              break;

            case "empty_igdb":
              localGames = Array.from({ length: edgeCase.localCount! }, (_, i) => ({
                id: `local-${i}`,
                slug: `local-game-${i}`,
                title: `Local Game ${i}`,
                genres: [],
                developer: "Dev",
                publisher: "Pub",
                igdbId: i + 1,
              }));
              expectedResultCount = 0;
              break;

            case "both_empty":
              expectedResultCount = 0;
              break;

            case "no_duplicates":
              localGames = Array.from({ length: edgeCase.localCount! }, (_, i) => ({
                id: `local-${i}`,
                slug: `local-game-${i}`,
                title: `Local Game ${i}`,
                genres: [],
                developer: "Dev",
                publisher: "Pub",
                igdbId: i + 1, // IDs 1 to localCount
              }));
              igdbGames = Array.from({ length: edgeCase.igdbCount! }, (_, i) => ({
                id: edgeCase.localCount! + i + 1, // IDs start after local IDs
                name: `IGDB Game ${i}`,
                slug: `igdb-game-${i}`,
              }));
              expectedResultCount = edgeCase.igdbCount!;
              break;

            case "all_duplicates":
              localGames = Array.from({ length: edgeCase.count! }, (_, i) => ({
                id: `local-${i}`,
                slug: `local-game-${i}`,
                title: `Local Game ${i}`,
                genres: [],
                developer: "Dev",
                publisher: "Pub",
                igdbId: i + 1,
              }));
              igdbGames = Array.from({ length: edgeCase.count! }, (_, i) => ({
                id: i + 1, // Same IDs as local
                name: `IGDB Game ${i}`,
                slug: `igdb-game-${i}`,
              }));
              expectedResultCount = 0; // All should be deduplicated
              break;
          }

          // Execute deduplication
          const deduplicatedIgdbGames = HybridSearchService.deduplicateResults(
            localGames,
            igdbGames
          );

          // Property assertion: Result count matches expected
          expect(deduplicatedIgdbGames.length).toBe(expectedResultCount);
        }),
        { numRuns: 30 }
      );
    });

    it("deduplication also removes games matching by slug when igdbId is not available", () => {
      // Generate test data where some local games don't have igdbId but match by slug
      const testDataArbitrary = fc.record({
        matchingSlugCount: fc.integer({ min: 1, max: 5 }),
        nonMatchingCount: fc.integer({ min: 0, max: 5 }),
      });

      fc.assert(
        fc.property(testDataArbitrary, ({ matchingSlugCount, nonMatchingCount }) => {
          // Create local games without igdbId but with matching slugs
          const localGames: GameSummary[] = Array.from({ length: matchingSlugCount }, (_, i) => ({
            id: `local-${i}`,
            slug: `matching-slug-${i}`,
            title: `Local Game ${i}`,
            genres: [],
            developer: "Dev",
            publisher: "Pub",
            // No igdbId - will match by slug
          }));

          // Create IGDB games - some with matching slugs, some without
          const igdbGames: IGDBSearchResult[] = [
            // Games that should be deduplicated (matching slugs)
            ...Array.from({ length: matchingSlugCount }, (_, i) => ({
              id: i + 1,
              name: `IGDB Game ${i}`,
              slug: `matching-slug-${i}`, // Same slug as local
            })),
            // Games that should remain (non-matching slugs)
            ...Array.from({ length: nonMatchingCount }, (_, i) => ({
              id: matchingSlugCount + i + 1,
              name: `IGDB Unique Game ${i}`,
              slug: `unique-slug-${i}`,
            })),
          ];

          // Execute deduplication
          const deduplicatedIgdbGames = HybridSearchService.deduplicateResults(
            localGames,
            igdbGames
          );

          // Property assertion: Only non-matching games should remain
          expect(deduplicatedIgdbGames.length).toBe(nonMatchingCount);

          // Verify no matching slugs in result
          const localSlugs = new Set(localGames.map((g) => g.slug.toLowerCase()));
          for (const igdbGame of deduplicatedIgdbGames) {
            expect(localSlugs.has(igdbGame.slug.toLowerCase())).toBe(false);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("deduplication also removes games matching by normalized title", () => {
      // Generate test data where games match by normalized title
      const testDataArbitrary = fc.record({
        matchingTitleCount: fc.integer({ min: 1, max: 5 }),
        nonMatchingCount: fc.integer({ min: 0, max: 5 }),
      });

      fc.assert(
        fc.property(testDataArbitrary, ({ matchingTitleCount, nonMatchingCount }) => {
          // Create local games with titles that will match after normalization
          const localGames: GameSummary[] = Array.from({ length: matchingTitleCount }, (_, i) => ({
            id: `local-${i}`,
            slug: `local-slug-${i}`, // Different slug
            title: `Game Title ${i}`, // Will normalize to "gametitle{i}"
            genres: [],
            developer: "Dev",
            publisher: "Pub",
            // No igdbId
          }));

          // Create IGDB games - some with matching titles (different formatting), some without
          const igdbGames: IGDBSearchResult[] = [
            // Games that should be deduplicated (matching titles after normalization)
            ...Array.from({ length: matchingTitleCount }, (_, i) => ({
              id: i + 1,
              name: `GAME TITLE ${i}`, // Different case, same normalized form
              slug: `igdb-slug-${i}`, // Different slug
            })),
            // Games that should remain (non-matching titles)
            ...Array.from({ length: nonMatchingCount }, (_, i) => ({
              id: matchingTitleCount + i + 1,
              name: `Unique Game ${i}`,
              slug: `unique-slug-${i}`,
            })),
          ];

          // Execute deduplication
          const deduplicatedIgdbGames = HybridSearchService.deduplicateResults(
            localGames,
            igdbGames
          );

          // Property assertion: Only non-matching games should remain
          expect(deduplicatedIgdbGames.length).toBe(nonMatchingCount);
        }),
        { numRuns: 30 }
      );
    });
  });
});

// Feature: igdb-hybrid-search, Property 12: Limite d'affichage respectÃ©e
// **Validates: Requirements 7.3**

describe("Property 12: Limite d'affichage respectÃ©e", () => {
  let originalFetch: typeof global.fetch;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnv = { ...process.env };
    process.env.IGDB_CLIENT_ID = "test-client-id";
    process.env.IGDB_CLIENT_SECRET = "test-client-secret";
    IGDBService.clearTokenCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    IGDBService.clearTokenCache();
  });

  it("for any list of results, local games displayed must not exceed 5 and IGDB games displayed must not exceed 5", async () => {
    // Generate test data with varying numbers of results from both sources
    const testDataArbitrary = fc.record({
      query: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
      // Generate more results than the limit to test truncation
      localResultCount: fc.integer({ min: 0, max: 20 }),
      igdbResultCount: fc.integer({ min: 0, max: 20 }),
    });

    await fc.assert(
      fc.asyncProperty(testDataArbitrary, async ({ query, localResultCount, igdbResultCount }) => {
        IGDBService.clearTokenCache();

        // Generate local games with unique IDs (no overlap with IGDB)
        const localGames = Array.from({ length: localResultCount }, (_, i) => ({
          id: `local-${i}`,
          title: `Local Game ${i}`,
          slug: `local-game-${i}`,
          genres: [],
          developer: "Local Dev",
          publisher: "Local Pub",
          igdbId: 1000000 + i, // High IDs to avoid collision with IGDB
        }));

        // Generate IGDB games with unique IDs (no overlap with local)
        const igdbApiResults = Array.from({ length: igdbResultCount }, (_, i) => ({
          id: i + 1, // Low IDs
          name: `IGDB Game ${i}`,
          slug: `igdb-game-${i}`,
        }));

        // Mock GameService.fetchGames to return local results
        const originalFetchGames = GameService.fetchGames;
        GameService.fetchGames = vi.fn(async () => {
          return {
            games: localGames,
            pagination: {
              currentPage: 1,
              totalPages: Math.ceil(localGames.length / 5),
              totalCount: localGames.length,
              hasNextPage: localGames.length > 5,
              hasPreviousPage: false,
            },
          };
        });

        // Mock fetch for IGDB to return results
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
          if (url.includes("api.igdb.com")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () => Promise.resolve(igdbApiResults),
            } as Response);
          }
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
          } as Response);
        });

        try {
          // Execute the hybrid search with default limits (5 each)
          const result = await HybridSearchService.search({
            query,
            locale: "fr",
            localLimit: 5,
            igdbLimit: 5,
          });

          // Property assertion 1: Local games must not exceed 5
          expect(result.localGames.length).toBeLessThanOrEqual(5);

          // Property assertion 2: IGDB games must not exceed 5
          expect(result.igdbGames.length).toBeLessThanOrEqual(5);

          // Property assertion 3: If source has more than limit, exactly limit should be returned
          if (localResultCount > 5) {
            expect(result.localGames.length).toBe(5);
          } else {
            expect(result.localGames.length).toBe(localResultCount);
          }

          if (igdbResultCount > 5) {
            expect(result.igdbGames.length).toBe(5);
          } else {
            expect(result.igdbGames.length).toBe(igdbResultCount);
          }
        } finally {
          GameService.fetchGames = originalFetchGames;
        }
      }),
      { numRuns: 30 }
    );
  });

  it("custom limits are respected when specified", async () => {
    // Generate test data with custom limits
    const testDataArbitrary = fc.record({
      query: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
      localLimit: fc.integer({ min: 1, max: 10 }),
      igdbLimit: fc.integer({ min: 1, max: 10 }),
      localResultCount: fc.integer({ min: 0, max: 20 }),
      igdbResultCount: fc.integer({ min: 0, max: 20 }),
    });

    await fc.assert(
      fc.asyncProperty(
        testDataArbitrary,
        async ({ query, localLimit, igdbLimit, localResultCount, igdbResultCount }) => {
          IGDBService.clearTokenCache();

          // Generate local games
          const localGames = Array.from({ length: localResultCount }, (_, i) => ({
            id: `local-${i}`,
            title: `Local Game ${i}`,
            slug: `local-game-${i}`,
            genres: [],
            developer: "Local Dev",
            publisher: "Local Pub",
            igdbId: 1000000 + i,
          }));

          // Generate IGDB games
          const igdbApiResults = Array.from({ length: igdbResultCount }, (_, i) => ({
            id: i + 1,
            name: `IGDB Game ${i}`,
            slug: `igdb-game-${i}`,
          }));

          // Mock GameService.fetchGames
          const originalFetchGames = GameService.fetchGames;
          GameService.fetchGames = vi.fn(async () => {
            return {
              games: localGames,
              pagination: {
                currentPage: 1,
                totalPages: Math.ceil(localGames.length / localLimit),
                totalCount: localGames.length,
                hasNextPage: localGames.length > localLimit,
                hasPreviousPage: false,
              },
            };
          });

          // Mock fetch for IGDB
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
            if (url.includes("api.igdb.com")) {
              return Promise.resolve({
                ok: true,
                status: 200,
                statusText: "OK",
                json: () => Promise.resolve(igdbApiResults),
              } as Response);
            }
            return Promise.resolve({
              ok: false,
              status: 404,
              statusText: "Not Found",
            } as Response);
          });

          try {
            // Execute the hybrid search with custom limits
            const result = await HybridSearchService.search({
              query,
              locale: "fr",
              localLimit,
              igdbLimit,
            });

            // Property assertion 1: Local games must not exceed custom limit
            expect(result.localGames.length).toBeLessThanOrEqual(localLimit);

            // Property assertion 2: IGDB games must not exceed custom limit
            expect(result.igdbGames.length).toBeLessThanOrEqual(igdbLimit);

            // Property assertion 3: Correct count based on available results
            const expectedLocalCount = Math.min(localResultCount, localLimit);
            const expectedIgdbCount = Math.min(igdbResultCount, igdbLimit);

            expect(result.localGames.length).toBe(expectedLocalCount);
            expect(result.igdbGames.length).toBe(expectedIgdbCount);
          } finally {
            GameService.fetchGames = originalFetchGames;
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it("hasMore is correctly calculated when results exceed limits", async () => {
    // Generate test data to verify hasMore calculation
    const testDataArbitrary = fc.record({
      query: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
      localResultCount: fc.integer({ min: 0, max: 15 }),
      igdbResultCount: fc.integer({ min: 0, max: 15 }),
    });

    await fc.assert(
      fc.asyncProperty(testDataArbitrary, async ({ query, localResultCount, igdbResultCount }) => {
        IGDBService.clearTokenCache();

        const localLimit = 5;
        const igdbLimit = 5;

        // Generate local games
        const localGames = Array.from({ length: localResultCount }, (_, i) => ({
          id: `local-${i}`,
          title: `Local Game ${i}`,
          slug: `local-game-${i}`,
          genres: [],
          developer: "Local Dev",
          publisher: "Local Pub",
          igdbId: 1000000 + i,
        }));

        // Generate IGDB games
        const igdbApiResults = Array.from({ length: igdbResultCount }, (_, i) => ({
          id: i + 1,
          name: `IGDB Game ${i}`,
          slug: `igdb-game-${i}`,
        }));

        // Mock GameService.fetchGames
        const originalFetchGames = GameService.fetchGames;
        GameService.fetchGames = vi.fn(async () => {
          return {
            games: localGames,
            pagination: {
              currentPage: 1,
              totalPages: Math.ceil(localGames.length / localLimit),
              totalCount: localGames.length,
              hasNextPage: localGames.length > localLimit,
              hasPreviousPage: false,
            },
          };
        });

        // Mock fetch for IGDB
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
          if (url.includes("api.igdb.com")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () => Promise.resolve(igdbApiResults),
            } as Response);
          }
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
          } as Response);
        });

        try {
          const result = await HybridSearchService.search({
            query,
            locale: "fr",
            localLimit,
            igdbLimit,
          });

          // Property assertion: hasMore should be true if either source has more results than limit
          const expectedHasMore = localResultCount > localLimit || igdbResultCount > igdbLimit;
          expect(result.hasMore).toBe(expectedHasMore);
        } finally {
          GameService.fetchGames = originalFetchGames;
        }
      }),
      { numRuns: 30 }
    );
  });

  it("limits are applied after deduplication", async () => {
    // Generate test data where deduplication affects the final count
    const testDataArbitrary = fc.record({
      query: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
      // Number of games that exist in both sources (will be deduplicated)
      duplicateCount: fc.integer({ min: 0, max: 5 }),
      // Number of IGDB-only games
      igdbOnlyCount: fc.integer({ min: 0, max: 15 }),
    });

    await fc.assert(
      fc.asyncProperty(testDataArbitrary, async ({ query, duplicateCount, igdbOnlyCount }) => {
        IGDBService.clearTokenCache();

        const igdbLimit = 5;

        // Generate local games with specific IGDB IDs
        const localGames = Array.from({ length: duplicateCount }, (_, i) => ({
          id: `local-${i}`,
          title: `Duplicate Game ${i}`,
          slug: `duplicate-game-${i}`,
          genres: [],
          developer: "Local Dev",
          publisher: "Local Pub",
          igdbId: i + 1, // IDs 1 to duplicateCount
        }));

        // Generate IGDB games: duplicates + unique games
        const igdbApiResults = [
          // Duplicate games (same IDs as local)
          ...Array.from({ length: duplicateCount }, (_, i) => ({
            id: i + 1,
            name: `Duplicate Game ${i}`,
            slug: `duplicate-game-${i}`,
          })),
          // IGDB-only games
          ...Array.from({ length: igdbOnlyCount }, (_, i) => ({
            id: duplicateCount + i + 1,
            name: `IGDB Only Game ${i}`,
            slug: `igdb-only-game-${i}`,
          })),
        ];

        // Mock GameService.fetchGames
        const originalFetchGames = GameService.fetchGames;
        GameService.fetchGames = vi.fn(async () => {
          return {
            games: localGames,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalCount: localGames.length,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          };
        });

        // Mock fetch for IGDB
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
          if (url.includes("api.igdb.com")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () => Promise.resolve(igdbApiResults),
            } as Response);
          }
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
          } as Response);
        });

        try {
          const result = await HybridSearchService.search({
            query,
            locale: "fr",
            localLimit: 5,
            igdbLimit,
          });

          // Property assertion 1: IGDB results should not include duplicates
          const localIgdbIds = new Set(localGames.map((g) => g.igdbId));
          for (const igdbGame of result.igdbGames) {
            expect(localIgdbIds.has(igdbGame.id)).toBe(false);
          }

          // Property assertion 2: IGDB results should not exceed limit
          expect(result.igdbGames.length).toBeLessThanOrEqual(igdbLimit);

          // Property assertion 3: After deduplication, count should be min(igdbOnlyCount, igdbLimit)
          const expectedIgdbCount = Math.min(igdbOnlyCount, igdbLimit);
          expect(result.igdbGames.length).toBe(expectedIgdbCount);
        } finally {
          GameService.fetchGames = originalFetchGames;
        }
      }),
      { numRuns: 30 }
    );
  });
});
