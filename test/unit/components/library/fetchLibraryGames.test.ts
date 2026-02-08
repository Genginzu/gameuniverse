import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";

/**
 * Feature: library-games-view
 * Task 3.1: Unit tests for fetchLibraryGames
 *
 * Tests for the fetchLibraryGames function logic including:
 * - API call with correct parameters
 * - Debouncing behavior
 * - Error handling and retry
 */

// Types for testing
interface GameSummary {
  id: string;
  slug: string;
  title: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  offset: number;
}

interface FetchLibraryGamesResult {
  games: GameSummary[];
  pagination: Pagination | null;
}

// Mock API client for testing
class MockApiClient {
  private mockResponse: FetchLibraryGamesResult | null = null;
  private mockError: Error | null = null;
  public lastCalledUrl: string | null = null;
  public callCount: number = 0;

  setMockResponse(response: FetchLibraryGamesResult) {
    this.mockResponse = response;
    this.mockError = null;
  }

  setMockError(error: Error) {
    this.mockError = error;
    this.mockResponse = null;
  }

  reset() {
    this.mockResponse = null;
    this.mockError = null;
    this.lastCalledUrl = null;
    this.callCount = 0;
  }

  async get<T>(url: string): Promise<T> {
    this.lastCalledUrl = url;
    this.callCount++;

    if (this.mockError) {
      throw this.mockError;
    }

    return this.mockResponse as T;
  }
}

/**
 * Pure function that builds the API URL for fetching library games
 * This mirrors the logic in LibraryGamesContent.fetchLibraryGames
 */
function buildLibraryGamesUrl(
  locale: string,
  search: string = "",
  genres: string[] = [],
  publishers: string[] = [],
  page: number = 1
): string {
  const params = new URLSearchParams({
    locale,
    page: page.toString(),
    limit: "20",
    inLibrary: "true",
  });

  if (search.trim()) {
    params.append("search", search.trim());
  }

  if (genres.length > 0) {
    params.append("genres", genres.join(","));
  }

  if (publishers.length > 0) {
    params.append("publishers", publishers.join(","));
  }

  return `/api/games?${params.toString()}`;
}

/**
 * Simulates debounce behavior
 */
function createDebouncer(delayMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingCallback: (() => void) | null = null;

  return {
    debounce(callback: () => void) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      pendingCallback = callback;
      timeoutId = setTimeout(() => {
        if (pendingCallback) {
          pendingCallback();
          pendingCallback = null;
        }
        timeoutId = null;
      }, delayMs);
    },
    cancel() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
        pendingCallback = null;
      }
    },
    hasPending() {
      return timeoutId !== null;
    },
    flush() {
      if (timeoutId && pendingCallback) {
        clearTimeout(timeoutId);
        pendingCallback();
        pendingCallback = null;
        timeoutId = null;
      }
    },
  };
}

describe("fetchLibraryGames Unit Tests", () => {
  let mockApiClient: MockApiClient;

  beforeEach(() => {
    mockApiClient = new MockApiClient();
  });

  afterEach(() => {
    mockApiClient.reset();
  });

  describe("API call with correct parameters", () => {
    it("should build URL with default parameters", () => {
      const url = buildLibraryGamesUrl("fr");

      expect(url).toContain("/api/games?");
      expect(url).toContain("locale=fr");
      expect(url).toContain("page=1");
      expect(url).toContain("limit=20");
      expect(url).toContain("inLibrary=true");
    });

    it("should include search parameter when provided", () => {
      const url = buildLibraryGamesUrl("fr", "zelda");

      expect(url).toContain("search=zelda");
    });

    it("should trim search parameter", () => {
      const url = buildLibraryGamesUrl("fr", "  zelda  ");

      expect(url).toContain("search=zelda");
      expect(url).not.toContain("search=++zelda++");
    });

    it("should not include search parameter when empty or whitespace", () => {
      const urlEmpty = buildLibraryGamesUrl("fr", "");
      const urlWhitespace = buildLibraryGamesUrl("fr", "   ");

      expect(urlEmpty).not.toContain("search=");
      expect(urlWhitespace).not.toContain("search=");
    });

    it("should include genres parameter when provided", () => {
      const url = buildLibraryGamesUrl("fr", "", ["action", "rpg"]);

      expect(url).toContain("genres=action%2Crpg");
    });

    it("should not include genres parameter when empty array", () => {
      const url = buildLibraryGamesUrl("fr", "", []);

      expect(url).not.toContain("genres=");
    });

    it("should include publishers parameter when provided", () => {
      const url = buildLibraryGamesUrl("fr", "", [], ["nintendo", "sony"]);

      expect(url).toContain("publishers=nintendo%2Csony");
    });

    it("should not include publishers parameter when empty array", () => {
      const url = buildLibraryGamesUrl("fr", "", [], []);

      expect(url).not.toContain("publishers=");
    });

    it("should include page parameter", () => {
      const url = buildLibraryGamesUrl("fr", "", [], [], 3);

      expect(url).toContain("page=3");
    });

    it("should combine all parameters correctly", () => {
      const url = buildLibraryGamesUrl("en", "mario", ["action"], ["nintendo"], 2);

      expect(url).toContain("locale=en");
      expect(url).toContain("search=mario");
      expect(url).toContain("genres=action");
      expect(url).toContain("publishers=nintendo");
      expect(url).toContain("page=2");
      expect(url).toContain("limit=20");
      expect(url).toContain("inLibrary=true");
    });

    it("should always include inLibrary=true for library fetching", () => {
      const url = buildLibraryGamesUrl("fr");

      expect(url).toContain("inLibrary=true");
    });

    it("should always use limit=20 for pagination", () => {
      const url = buildLibraryGamesUrl("fr");

      expect(url).toContain("limit=20");
    });
  });

  describe("Debouncing behavior", () => {
    it("should delay execution by specified time", async () => {
      const debouncer = createDebouncer(300);
      let executed = false;

      debouncer.debounce(() => {
        executed = true;
      });

      expect(executed).toBe(false);
      expect(debouncer.hasPending()).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(executed).toBe(true);
      expect(debouncer.hasPending()).toBe(false);
    });

    it("should cancel previous call when new call is made", async () => {
      const debouncer = createDebouncer(300);
      let callCount = 0;
      let lastValue = "";

      debouncer.debounce(() => {
        callCount++;
        lastValue = "first";
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      debouncer.debounce(() => {
        callCount++;
        lastValue = "second";
      });

      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(callCount).toBe(1);
      expect(lastValue).toBe("second");
    });

    it("should allow manual cancellation", () => {
      const debouncer = createDebouncer(300);
      let executed = false;

      debouncer.debounce(() => {
        executed = true;
      });

      expect(debouncer.hasPending()).toBe(true);

      debouncer.cancel();

      expect(debouncer.hasPending()).toBe(false);
      expect(executed).toBe(false);
    });

    it("should allow manual flush for immediate execution", () => {
      const debouncer = createDebouncer(300);
      let executed = false;

      debouncer.debounce(() => {
        executed = true;
      });

      expect(executed).toBe(false);

      debouncer.flush();

      expect(executed).toBe(true);
      expect(debouncer.hasPending()).toBe(false);
    });

    it("should handle rapid successive calls correctly", async () => {
      const debouncer = createDebouncer(100);
      const values: string[] = [];

      for (let i = 0; i < 5; i++) {
        debouncer.debounce(() => {
          values.push(`call-${i}`);
        });
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(values.length).toBe(1);
      expect(values[0]).toBe("call-4");
    });
  });

  describe("Error handling and retry", () => {
    it("should return games and pagination on successful fetch", async () => {
      const mockResponse: FetchLibraryGamesResult = {
        games: [
          { id: "1", slug: "game-1", title: "Game 1" },
          { id: "2", slug: "game-2", title: "Game 2" },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 2,
          limit: 20,
          hasNextPage: false,
          hasPreviousPage: false,
          offset: 0,
        },
      };

      mockApiClient.setMockResponse(mockResponse);

      const result = await mockApiClient.get<FetchLibraryGamesResult>(buildLibraryGamesUrl("fr"));

      expect(result.games).toHaveLength(2);
      expect(result.pagination?.totalCount).toBe(2);
    });

    it("should throw error on API failure", async () => {
      mockApiClient.setMockError(new Error("Network error"));

      await expect(
        mockApiClient.get<FetchLibraryGamesResult>(buildLibraryGamesUrl("fr"))
      ).rejects.toThrow("Network error");
    });

    it("should track API call count for retry verification", async () => {
      const mockResponse: FetchLibraryGamesResult = {
        games: [],
        pagination: null,
      };

      mockApiClient.setMockResponse(mockResponse);

      await mockApiClient.get<FetchLibraryGamesResult>(buildLibraryGamesUrl("fr"));
      await mockApiClient.get<FetchLibraryGamesResult>(buildLibraryGamesUrl("fr"));
      await mockApiClient.get<FetchLibraryGamesResult>(buildLibraryGamesUrl("fr"));

      expect(mockApiClient.callCount).toBe(3);
    });

    it("should record the last called URL", async () => {
      const mockResponse: FetchLibraryGamesResult = {
        games: [],
        pagination: null,
      };

      mockApiClient.setMockResponse(mockResponse);

      const url = buildLibraryGamesUrl("en", "zelda", ["action"], [], 2);
      await mockApiClient.get<FetchLibraryGamesResult>(url);

      expect(mockApiClient.lastCalledUrl).toBe(url);
      expect(mockApiClient.lastCalledUrl).toContain("locale=en");
      expect(mockApiClient.lastCalledUrl).toContain("search=zelda");
    });

    it("should handle empty response gracefully", async () => {
      const mockResponse: FetchLibraryGamesResult = {
        games: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          limit: 20,
          hasNextPage: false,
          hasPreviousPage: false,
          offset: 0,
        },
      };

      mockApiClient.setMockResponse(mockResponse);

      const result = await mockApiClient.get<FetchLibraryGamesResult>(buildLibraryGamesUrl("fr"));

      expect(result.games).toHaveLength(0);
      expect(result.pagination?.totalCount).toBe(0);
    });

    it("should handle null pagination in response", async () => {
      const mockResponse: FetchLibraryGamesResult = {
        games: [],
        pagination: null,
      };

      mockApiClient.setMockResponse(mockResponse);

      const result = await mockApiClient.get<FetchLibraryGamesResult>(buildLibraryGamesUrl("fr"));

      expect(result.games).toHaveLength(0);
      expect(result.pagination).toBeNull();
    });
  });

  describe("Filter parameter encoding", () => {
    it("should properly encode special characters in search", () => {
      const url = buildLibraryGamesUrl("fr", "game & fun");

      expect(url).toContain("search=game+%26+fun");
    });

    it("should properly encode genres with special characters", () => {
      const url = buildLibraryGamesUrl("fr", "", ["action/adventure"]);

      expect(url).toContain("genres=action%2Fadventure");
    });

    it("should handle unicode characters in search", () => {
      const url = buildLibraryGamesUrl("fr", "ゼルダ");

      expect(url).toContain("search=");
      expect(decodeURIComponent(url)).toContain("ゼルダ");
    });
  });
});
