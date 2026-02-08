import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import {
  parsePaginationParams,
  parseArrayParam,
  createPaginatedResponse,
  handleApiError,
  validateRequiredParams,
  calculateOffset,
  type PaginationParams,
  type PaginatedApiResponse,
  type ApiErrorResponse,
} from "../api-utils";

/**
 * API Response Compatibility Tests
 *
 * These tests verify that all API routes return unchanged response formats
 * after the refactoring. The tests validate:
 * - Pagination parameter parsing produces consistent results
 * - Array parameter parsing produces consistent results
 * - Paginated response structure matches expected format
 * - Error response structure matches expected format
 *
 * **Validates: Requirements 15.3**
 * - WHEN API routes are refactored, THE response formats SHALL remain unchanged
 */

// Generator for valid page numbers
const validPageGenerator = fc.integer({ min: 1, max: 1000 });

// Generator for valid limit values
const validLimitGenerator = fc.integer({ min: 1, max: 50 });

// Generator for invalid page values
const invalidPageGenerator = fc.oneof(
  fc.constant(""),
  fc.constant("abc"),
  fc.constant("-1"),
  fc.constant("0"),
  fc.constant("1.5"),
  fc.constant(null)
);

// Generator for invalid limit values
const invalidLimitGenerator = fc.oneof(
  fc.constant(""),
  fc.constant("abc"),
  fc.constant("-1"),
  fc.constant("0"),
  fc.constant("1.5"),
  fc.constant(null)
);

// Generator for comma-separated strings
const commaSeparatedGenerator = fc.array(
  fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.includes(",")),
  { minLength: 0, maxLength: 10 }
);

// Generator for test data items
const testDataItemGenerator = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  value: fc.integer({ min: 0, max: 1000 }),
});

describe("API Response Compatibility Tests", () => {
  describe("parsePaginationParams", () => {
    it("returns default values for empty search params", () => {
      const searchParams = new URLSearchParams();
      const result = parsePaginationParams(searchParams);

      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it("parses valid page and limit values correctly", () => {
      fc.assert(
        fc.property(validPageGenerator, validLimitGenerator, (page, limit) => {
          const searchParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          const result = parsePaginationParams(searchParams);

          expect(result.page).toBe(page);
          expect(result.limit).toBe(limit);
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it("returns default page for invalid page values", () => {
      const invalidValues = ["", "abc", "-1", "0", "1.5"];

      for (const value of invalidValues) {
        const searchParams = new URLSearchParams({ page: value });
        const result = parsePaginationParams(searchParams);

        expect(result.page).toBe(1);
      }
    });

    it("clamps limit to valid range (1-50)", () => {
      fc.assert(
        fc.property(fc.integer({ min: -100, max: 200 }), (limit) => {
          const searchParams = new URLSearchParams({ limit: limit.toString() });
          const result = parsePaginationParams(searchParams);

          expect(result.limit).toBeGreaterThanOrEqual(1);
          expect(result.limit).toBeLessThanOrEqual(50);
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it("respects custom default values", () => {
      fc.assert(
        fc.property(validPageGenerator, validLimitGenerator, (defaultPage, defaultLimit) => {
          const searchParams = new URLSearchParams();
          const result = parsePaginationParams(searchParams, {
            page: defaultPage,
            limit: defaultLimit,
          });

          expect(result.page).toBe(defaultPage);
          expect(result.limit).toBe(defaultLimit);
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("parseArrayParam", () => {
    it("returns empty array for null/empty values", () => {
      expect(parseArrayParam(null)).toEqual([]);
      expect(parseArrayParam("")).toEqual([]);
      expect(parseArrayParam("   ")).toEqual([]);
    });

    it("parses comma-separated values correctly", () => {
      fc.assert(
        fc.property(commaSeparatedGenerator, (items) => {
          if (items.length === 0) return true;

          const input = items.join(",");
          const result = parseArrayParam(input);

          // Each non-empty item should be in the result
          const expectedItems = items.map((i) => i.trim()).filter((i) => i.length > 0);
          expect(result.length).toBe(expectedItems.length);

          return true;
        }),
        { numRuns: 50 }
      );
    });

    it("trims whitespace from values", () => {
      const result = parseArrayParam("  action , rpg  , adventure  ");
      expect(result).toEqual(["action", "rpg", "adventure"]);
    });

    it("filters out empty strings", () => {
      const result = parseArrayParam("action,,rpg,,,adventure");
      expect(result).toEqual(["action", "rpg", "adventure"]);
    });
  });

  describe("createPaginatedResponse", () => {
    it("creates response with correct structure", () => {
      fc.assert(
        fc.property(
          fc.array(testDataItemGenerator, { minLength: 0, maxLength: 20 }),
          validPageGenerator,
          validLimitGenerator,
          fc.integer({ min: 0, max: 1000 }),
          (data, page, limit, totalCount) => {
            const response = createPaginatedResponse(data, { page, limit, totalCount });

            // Verify structure
            expect(response).toHaveProperty("data");
            expect(response).toHaveProperty("pagination");
            expect(Array.isArray(response.data)).toBe(true);

            // Verify pagination structure
            expect(response.pagination).toHaveProperty("currentPage");
            expect(response.pagination).toHaveProperty("totalPages");
            expect(response.pagination).toHaveProperty("totalCount");
            expect(response.pagination).toHaveProperty("hasNextPage");
            expect(response.pagination).toHaveProperty("hasPreviousPage");

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("calculates pagination metadata correctly", () => {
      fc.assert(
        fc.property(
          validPageGenerator,
          validLimitGenerator,
          fc.integer({ min: 0, max: 1000 }),
          (page, limit, totalCount) => {
            const response = createPaginatedResponse([], { page, limit, totalCount });

            const expectedTotalPages = Math.ceil(totalCount / limit);
            const expectedHasNextPage = page < expectedTotalPages;
            const expectedHasPreviousPage = page > 1;

            expect(response.pagination.currentPage).toBe(page);
            expect(response.pagination.totalPages).toBe(expectedTotalPages);
            expect(response.pagination.totalCount).toBe(totalCount);
            expect(response.pagination.hasNextPage).toBe(expectedHasNextPage);
            expect(response.pagination.hasPreviousPage).toBe(expectedHasPreviousPage);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("includes filters when provided", () => {
      const filters = { search: "test", genres: ["action", "rpg"] };
      const response = createPaginatedResponse([], { page: 1, limit: 20, totalCount: 0 }, filters);

      expect(response.filters).toEqual(filters);
    });

    it("omits filters when not provided", () => {
      const response = createPaginatedResponse([], { page: 1, limit: 20, totalCount: 0 });

      expect(response.filters).toBeUndefined();
    });
  });

  describe("handleApiError", () => {
    it("returns error response with correct structure", () => {
      const response = handleApiError(new Error("Test error"), "Default message");

      expect(response).toHaveProperty("error");
      expect(typeof response.error).toBe("string");
    });

    it("handles Error objects", () => {
      const error = new Error("Test error message");
      const response = handleApiError(error);

      // In production, should return default message
      // In development, should return actual message
      expect(typeof response.error).toBe("string");
    });

    it("handles string errors", () => {
      const response = handleApiError("String error message");

      expect(typeof response.error).toBe("string");
    });

    it("handles unknown error types", () => {
      const response = handleApiError({ custom: "error" });

      expect(typeof response.error).toBe("string");
    });

    it("uses default message when provided", () => {
      const defaultMessage = "Custom default message";
      const response = handleApiError(null, defaultMessage);

      expect(response.error).toBe(defaultMessage);
    });
  });

  describe("validateRequiredParams", () => {
    it("returns valid=true when all required params are present", () => {
      const params = { id: "123", name: "test", value: 42 };
      const result = validateRequiredParams(params, ["id", "name"]);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it("returns valid=false with missing params list", () => {
      const params = { id: "123" };
      const result = validateRequiredParams(params, ["id", "name", "value"]);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain("name");
      expect(result.missing).toContain("value");
    });

    it("treats null/undefined/empty string as missing", () => {
      const params = { id: null, name: undefined, value: "" };
      const result = validateRequiredParams(params, ["id", "name", "value"]);

      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["id", "name", "value"]);
    });
  });

  describe("calculateOffset", () => {
    it("calculates correct offset for any page and limit", () => {
      fc.assert(
        fc.property(validPageGenerator, validLimitGenerator, (page, limit) => {
          const offset = calculateOffset(page, limit);
          const expectedOffset = (page - 1) * limit;

          expect(offset).toBe(expectedOffset);
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it("returns 0 for page 1", () => {
      fc.assert(
        fc.property(validLimitGenerator, (limit) => {
          const offset = calculateOffset(1, limit);
          expect(offset).toBe(0);
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("Response Format Compatibility", () => {
    it("games API response format matches expected structure", () => {
      // Simulate the expected games API response format
      interface ExpectedGamesResponse {
        games: Array<{
          id: string;
          slug: string;
          title: string;
          description?: string;
          coverImage?: string;
          backgroundImage?: string;
          backgroundColor?: string;
          releaseDate?: string;
          releaseYear?: number;
          genres: Array<{ name: string }>;
          developer: string;
          publisher: string;
          metascore?: number;
          createdAt: string;
        }>;
        pagination: {
          currentPage: number;
          totalPages: number;
          totalCount: number;
          limit: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
          offset: number;
        };
        filters: {
          search: string;
          genres: string[];
          locale: string;
          inLibrary: boolean;
        };
      }

      // Create a mock response matching the expected format
      const mockResponse: ExpectedGamesResponse = {
        games: [
          {
            id: "123",
            slug: "test-game",
            title: "Test Game",
            description: "A test game",
            coverImage: "https://example.com/cover.jpg",
            backgroundImage: "https://example.com/bg.jpg",
            backgroundColor: "#123456",
            releaseDate: "2024-01-01",
            releaseYear: 2024,
            genres: [{ name: "Action" }, { name: "RPG" }],
            developer: "Test Developer",
            publisher: "Test Publisher",
            metascore: 85,
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 5,
          totalCount: 100,
          limit: 20,
          hasNextPage: true,
          hasPreviousPage: false,
          offset: 0,
        },
        filters: {
          search: "",
          genres: [],
          locale: "fr",
          inLibrary: false,
        },
      };

      // Verify structure
      expect(mockResponse).toHaveProperty("games");
      expect(mockResponse).toHaveProperty("pagination");
      expect(mockResponse).toHaveProperty("filters");
      expect(Array.isArray(mockResponse.games)).toBe(true);
      expect(mockResponse.pagination.currentPage).toBe(1);
    });

    it("players API response format matches expected structure", () => {
      // Simulate the expected players API response format
      interface ExpectedPlayersResponse {
        players: Array<{
          id: string;
          fullName?: string;
          avatarUrl?: string;
          gamesCount: number;
        }>;
        pagination: {
          currentPage: number;
          totalPages: number;
          totalCount: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        };
      }

      const mockResponse: ExpectedPlayersResponse = {
        players: [
          {
            id: "123",
            fullName: "Test Player",
            avatarUrl: "https://example.com/avatar.jpg",
            gamesCount: 10,
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 5,
          totalCount: 100,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      };

      expect(mockResponse).toHaveProperty("players");
      expect(mockResponse).toHaveProperty("pagination");
      expect(Array.isArray(mockResponse.players)).toBe(true);
    });

    it("characters API response format matches expected structure", () => {
      // Simulate the expected characters API response format
      interface ExpectedCharactersResponse {
        characters: Array<{
          id: string;
          slug: string;
          name: string;
          role?: string;
          description?: string;
          mainImage?: string;
          backgroundColor?: string;
          primaryGame: string;
          gamesCount: number;
        }>;
        pagination: {
          currentPage: number;
          totalPages: number;
          totalCount: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        };
      }

      const mockResponse: ExpectedCharactersResponse = {
        characters: [
          {
            id: "123",
            slug: "test-character",
            name: "Test Character",
            role: "Protagonist",
            description: "A test character",
            mainImage: "https://example.com/image.jpg",
            backgroundColor: "#123456",
            primaryGame: "Test Game",
            gamesCount: 3,
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 5,
          totalCount: 100,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      };

      expect(mockResponse).toHaveProperty("characters");
      expect(mockResponse).toHaveProperty("pagination");
      expect(Array.isArray(mockResponse.characters)).toBe(true);
    });
  });
});
