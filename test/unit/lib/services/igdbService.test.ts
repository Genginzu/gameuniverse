import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { IGDBService } from "../../../../src/lib/services/igdbService";

describe("IGDBService", () => {
  let originalFetch: typeof fetch;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    IGDBService.clearTokenCache();

    // Set up environment variables
    process.env.IGDB_CLIENT_ID = "test-client-id";
    process.env.IGDB_CLIENT_SECRET = "test-client-secret";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    IGDBService.clearTokenCache();
  });

  describe("getAccessToken", () => {
    it("should fetch a new token when cache is empty", async () => {
      const mockToken = {
        access_token: "test-token",
        expires_in: 3600,
        token_type: "bearer",
      };

      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => mockToken,
      })) as typeof fetch;

      const token = await IGDBService.getAccessToken();

      expect(token).toBe("test-token");
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    it("should return cached token when valid", async () => {
      const mockToken = {
        access_token: "cached-token",
        expires_in: 3600,
        token_type: "bearer",
      };

      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => mockToken,
      })) as typeof fetch;

      // First call to populate cache
      await IGDBService.getAccessToken();

      // Reset mock to track second call
      const secondFetch = vi.fn(async () => ({
        ok: true,
        json: async () => ({ access_token: "new-token", expires_in: 3600 }),
      })) as typeof fetch;
      globalThis.fetch = secondFetch;

      // Second call should use cache
      const token = await IGDBService.getAccessToken();

      expect(token).toBe("cached-token");
      expect(secondFetch).not.toHaveBeenCalled();
    });

    it("should throw error when credentials are missing", async () => {
      delete process.env.IGDB_CLIENT_ID;

      await expect(IGDBService.getAccessToken()).rejects.toThrow("IGDB credentials not configured");
    });

    it("should throw error on failed token fetch", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Unauthorized",
      })) as typeof fetch;

      await expect(IGDBService.getAccessToken()).rejects.toThrow(
        "Failed to authenticate with Twitch"
      );
    });
  });

  describe("searchGames", () => {
    beforeEach(() => {
      // Mock token fetch
      const mockToken = { access_token: "test-token", expires_in: 3600 };
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => mockToken };
        }
        return { ok: true, json: async () => [] };
      }) as typeof fetch;
    });

    it("should search games successfully", async () => {
      const mockGames = [
        {
          id: 1,
          name: "Test Game",
          slug: "test-game",
          cover: { image_id: "cover123" },
          first_release_date: 1704067200,
          involved_companies: [{ developer: true, company: { name: "Test Dev" } }],
        },
      ];

      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: true, json: async () => mockGames };
      }) as typeof fetch;

      const results = await IGDBService.searchGames("test", 10);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Test Game");
      expect(results[0].developer).toBe("Test Dev");
    });

    it("should handle empty search results", async () => {
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: true, json: async () => [] };
      }) as typeof fetch;

      const results = await IGDBService.searchGames("nonexistent", 10);

      expect(results).toHaveLength(0);
    });

    it("should throw error on search failure", async () => {
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: false, status: 500, statusText: "Server Error", text: async () => "Error" };
      }) as typeof fetch;

      await expect(IGDBService.searchGames("test", 10)).rejects.toThrow("IGDB search failed");
    });
  });

  describe("getGameDetails", () => {
    it("should fetch game details successfully", async () => {
      const mockGame = {
        id: 123,
        name: "Detailed Game",
        slug: "detailed-game",
        summary: "A detailed game",
        cover: { image_id: "cover123" },
      };

      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: true, json: async () => [mockGame] };
      }) as typeof fetch;

      const result = await IGDBService.getGameDetails(123);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Detailed Game");
    });

    it("should return null when game not found", async () => {
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: true, json: async () => [] };
      }) as typeof fetch;

      const result = await IGDBService.getGameDetails(999999);

      expect(result).toBeNull();
    });

    it("should throw error on API failure", async () => {
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: false, status: 500, statusText: "Error", text: async () => "Server error" };
      }) as typeof fetch;

      await expect(IGDBService.getGameDetails(123)).rejects.toThrow("IGDB getGameDetails failed");
    });

    it("should throw error when client ID is missing", async () => {
      delete process.env.IGDB_CLIENT_ID;

      // Need to mock token fetch to pass
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => ({ access_token: "token", expires_in: 3600 }),
      })) as typeof fetch;

      await expect(IGDBService.getGameDetails(123)).rejects.toThrow();
    });
  });

  describe("getTimeToBeat", () => {
    it("should fetch time to beat data successfully", async () => {
      const mockTimeToBeat = {
        game_id: 123,
        hastily: 3600,
        normally: 7200,
        completely: 14400,
        count: 100,
      };

      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: true, json: async () => [mockTimeToBeat] };
      }) as typeof fetch;

      const result = await IGDBService.getTimeToBeat(123);

      expect(result).not.toBeNull();
      expect(result?.normally).toBe(7200);
    });

    it("should return null when no time to beat data", async () => {
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: true, json: async () => [] };
      }) as typeof fetch;

      const result = await IGDBService.getTimeToBeat(123);

      expect(result).toBeNull();
    });

    it("should return null on API failure", async () => {
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: false, status: 500, statusText: "Error", text: async () => "Error" };
      }) as typeof fetch;

      const result = await IGDBService.getTimeToBeat(123);

      expect(result).toBeNull();
    });
  });

  describe("getAgeRatings", () => {
    it("should return empty array for empty input", async () => {
      const result = await IGDBService.getAgeRatings([]);

      expect(result).toEqual([]);
    });

    it("should fetch age ratings successfully", async () => {
      const mockAgeRatings = [
        {
          id: 1,
          organization: 1,
          rating_category: 1,
          synopsis: "Teen",
          rating_content_descriptions: [1, 2],
        },
      ];

      const mockContentDescriptions = [
        { id: 1, category: 1, description: "Violence" },
        { id: 2, category: 2, description: "Language" },
      ];

      let callCount = 0;
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        callCount++;
        if (callCount === 1) {
          // Age ratings call
          return { ok: true, text: async () => JSON.stringify(mockAgeRatings) };
        }
        // Content descriptions call
        return { ok: true, json: async () => mockContentDescriptions };
      }) as typeof fetch;

      const result = await IGDBService.getAgeRatings([1]);

      expect(result).toHaveLength(1);
      expect(result[0].content_descriptions).toHaveLength(2);
    });

    it("should return empty array on API failure", async () => {
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: false, status: 500, statusText: "Error", text: async () => "Error" };
      }) as typeof fetch;

      const result = await IGDBService.getAgeRatings([1, 2]);

      expect(result).toEqual([]);
    });
  });

  describe("getAgeRatingContentDescriptions", () => {
    it("should return empty array for empty input", async () => {
      const result = await IGDBService.getAgeRatingContentDescriptions([]);

      expect(result).toEqual([]);
    });

    it("should fetch content descriptions successfully", async () => {
      const mockDescriptions = [
        { id: 1, category: 1, description: "Violence" },
        { id: 2, category: 2, description: "Language" },
      ];

      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: true, json: async () => mockDescriptions };
      }) as typeof fetch;

      const result = await IGDBService.getAgeRatingContentDescriptions([1, 2]);

      expect(result).toHaveLength(2);
    });

    it("should return empty array on API failure", async () => {
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: false, status: 500, statusText: "Error", text: async () => "Error" };
      }) as typeof fetch;

      const result = await IGDBService.getAgeRatingContentDescriptions([1, 2]);

      expect(result).toEqual([]);
    });
  });

  describe("getGameVersions", () => {
    it("should fetch game versions successfully", async () => {
      const mockVersions = [
        { id: 1, name: "Game - Deluxe Edition", slug: "game-deluxe", version_title: "Deluxe" },
        { id: 2, name: "Game - GOTY Edition", slug: "game-goty", version_title: "GOTY" },
      ];

      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: true, json: async () => mockVersions };
      }) as typeof fetch;

      const result = await IGDBService.getGameVersions(123);

      expect(result).toHaveLength(2);
      expect(result[0].version_title).toBe("Deluxe");
    });

    it("should return empty array when no versions found", async () => {
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: true, json: async () => [] };
      }) as typeof fetch;

      const result = await IGDBService.getGameVersions(123);

      expect(result).toEqual([]);
    });

    it("should return empty array on API failure", async () => {
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.includes("oauth2/token")) {
          return { ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) };
        }
        return { ok: false, status: 500, statusText: "Error", text: async () => "Error" };
      }) as typeof fetch;

      const result = await IGDBService.getGameVersions(123);

      expect(result).toEqual([]);
    });
  });

  describe("buildImageUrl", () => {
    it("should build correct URL for different sizes", () => {
      const imageId = "co1234";

      expect(IGDBService.buildImageUrl(imageId, "cover_small")).toBe(
        "https://images.igdb.com/igdb/image/upload/t_cover_small/co1234.jpg"
      );

      expect(IGDBService.buildImageUrl(imageId, "cover_big")).toBe(
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg"
      );

      expect(IGDBService.buildImageUrl(imageId, "screenshot_big")).toBe(
        "https://images.igdb.com/igdb/image/upload/t_screenshot_big/co1234.jpg"
      );
    });
  });

  describe("clearTokenCache", () => {
    it("should clear the token cache", async () => {
      // First, populate the cache
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => ({ access_token: "cached-token", expires_in: 3600 }),
      })) as typeof fetch;

      await IGDBService.getAccessToken();
      expect(IGDBService.getTokenCache()).not.toBeNull();

      // Clear the cache
      IGDBService.clearTokenCache();

      expect(IGDBService.getTokenCache()).toBeNull();
    });
  });

  describe("getTokenCache", () => {
    it("should return null when cache is empty", () => {
      expect(IGDBService.getTokenCache()).toBeNull();
    });

    it("should return cached token after fetch", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => ({ access_token: "test-token", expires_in: 3600 }),
      })) as typeof fetch;

      await IGDBService.getAccessToken();

      const cache = IGDBService.getTokenCache();
      expect(cache).not.toBeNull();
      expect(cache?.access_token).toBe("test-token");
    });
  });
});
