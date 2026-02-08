import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import {
  parsePaginationParams,
  parseArrayParam,
  createPaginatedResponse,
  handleApiError,
  validateRequiredParams,
  calculateOffset,
  PaginationParams,
} from "../../../src/lib/api-utils";

/**
 * Feature: code-refactoring
 * Property 8: API Utilities Parameter Parsing
 * Property 9: API Response Formatting
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
 */

// Generators for property-based testing
const validPageGenerator = fc.integer({ min: 1, max: 1000 });
const validLimitGenerator = fc.integer({ min: 1, max: 50 });
const invalidNumberGenerator = fc.oneof(
  fc.constant(""),
  fc.constant("abc"),
  fc.constant("-1"),
  fc.constant("0"),
  fc.constant("NaN"),
  fc.constant("Infinity"),
  fc.constant("1.5"),
  fc.constant("  "),
  fc.constant(null)
);

const commaArrayGenerator = fc.array(fc.stringMatching(/^[a-z0-9]{1,20}$/), {
  minLength: 0,
  maxLength: 10,
});

const dataItemGenerator = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  value: fc.integer(),
});

describe("API Utilities Property-Based Tests", () => {
  describe("Property 8: API Utilities Parameter Parsing", () => {
    describe("parsePaginationParams", () => {
      it("returns valid page and limit for any valid input", () => {
        fc.assert(
          fc.property(validPageGenerator, validLimitGenerator, (page, limit) => {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", limit.toString());

            const result = parsePaginationParams(params);

            expect(result.page).toBe(page);
            expect(result.limit).toBe(limit);
            expect(result.page).toBeGreaterThanOrEqual(1);
            expect(result.limit).toBeGreaterThanOrEqual(1);
            expect(result.limit).toBeLessThanOrEqual(50);
          }),
          { numRuns: 100 }
        );
      });

      it("returns default page=1 for invalid page values", () => {
        fc.assert(
          fc.property(invalidNumberGenerator, (invalidPage) => {
            const params = new URLSearchParams();
            if (invalidPage !== null) {
              params.set("page", invalidPage);
            }

            const result = parsePaginationParams(params);

            expect(result.page).toBe(1);
          }),
          { numRuns: 100 }
        );
      });

      it("returns default limit=20 for non-numeric limit values", () => {
        // Test only truly non-numeric values (parseInt returns NaN for these)
        const nonNumericGenerator = fc.oneof(
          fc.constant(""),
          fc.constant("abc"),
          fc.constant("NaN"),
          fc.constant("Infinity"),
          fc.constant("  "),
          fc.constant(null)
        );

        fc.assert(
          fc.property(nonNumericGenerator, (invalidLimit) => {
            const params = new URLSearchParams();
            if (invalidLimit !== null) {
              params.set("limit", invalidLimit);
            }

            const result = parsePaginationParams(params);

            expect(result.limit).toBe(20);
          }),
          { numRuns: 100 }
        );
      });

      it("clamps limit between 1 and 50 for out-of-range values", () => {
        fc.assert(
          fc.property(
            fc.oneof(fc.integer({ min: -1000, max: 0 }), fc.integer({ min: 51, max: 1000 })),
            (outOfRangeLimit) => {
              const params = new URLSearchParams();
              params.set("limit", outOfRangeLimit.toString());

              const result = parsePaginationParams(params);

              expect(result.limit).toBeGreaterThanOrEqual(1);
              expect(result.limit).toBeLessThanOrEqual(50);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("returns empty params defaults for empty URLSearchParams", () => {
        const params = new URLSearchParams();
        const result = parsePaginationParams(params);

        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
      });

      it("respects custom defaults when provided", () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 100 }),
            fc.integer({ min: 1, max: 50 }),
            (defaultPage, defaultLimit) => {
              const params = new URLSearchParams();
              const result = parsePaginationParams(params, {
                page: defaultPage,
                limit: defaultLimit,
              });

              expect(result.page).toBe(defaultPage);
              expect(result.limit).toBe(defaultLimit);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe("parseArrayParam", () => {
      it("correctly splits comma-separated strings into arrays", () => {
        fc.assert(
          fc.property(commaArrayGenerator, (items) => {
            const input = items.join(",");
            const result = parseArrayParam(input);

            expect(result).toEqual(items);
          }),
          { numRuns: 100 }
        );
      });

      it("returns empty array for null input", () => {
        const result = parseArrayParam(null);
        expect(result).toEqual([]);
      });

      it("returns empty array for empty string input", () => {
        const result = parseArrayParam("");
        expect(result).toEqual([]);
      });

      it("returns empty array for whitespace-only input", () => {
        // Test various whitespace-only strings
        const whitespaceStrings = ["   ", "  ", " ", "\t", "\n", "  \t  "];
        for (const whitespace of whitespaceStrings) {
          const result = parseArrayParam(whitespace);
          expect(result).toEqual([]);
        }
      });

      it("trims whitespace from each value", () => {
        fc.assert(
          fc.property(
            fc.array(fc.stringMatching(/^[a-z0-9]{1,10}$/), { minLength: 1, maxLength: 5 }),
            (items) => {
              // Add random whitespace around items
              const inputWithSpaces = items.map((item) => `  ${item}  `).join(",");
              const result = parseArrayParam(inputWithSpaces);

              expect(result).toEqual(items);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("filters out empty strings after splitting", () => {
        const result = parseArrayParam("a,,b,,,c");
        expect(result).toEqual(["a", "b", "c"]);
      });
    });
  });

  describe("Property 9: API Response Formatting", () => {
    describe("createPaginatedResponse", () => {
      it("produces correct structure for any data and pagination", () => {
        fc.assert(
          fc.property(
            fc.array(dataItemGenerator, { minLength: 0, maxLength: 20 }),
            validPageGenerator,
            validLimitGenerator,
            fc.integer({ min: 0, max: 10000 }),
            (data, page, limit, totalCount) => {
              const result = createPaginatedResponse(data, { page, limit, totalCount });

              // Verify structure
              expect(result).toHaveProperty("data");
              expect(result).toHaveProperty("pagination");
              expect(Array.isArray(result.data)).toBe(true);
              expect(result.data).toEqual(data);

              // Verify pagination properties
              expect(result.pagination).toHaveProperty("currentPage");
              expect(result.pagination).toHaveProperty("totalPages");
              expect(result.pagination).toHaveProperty("totalCount");
              expect(result.pagination).toHaveProperty("hasNextPage");
              expect(result.pagination).toHaveProperty("hasPreviousPage");
            }
          ),
          { numRuns: 100 }
        );
      });

      it("calculates totalPages correctly", () => {
        fc.assert(
          fc.property(
            validLimitGenerator,
            fc.integer({ min: 0, max: 1000 }),
            (limit, totalCount) => {
              const result = createPaginatedResponse([], { page: 1, limit, totalCount });

              const expectedTotalPages = Math.ceil(totalCount / limit);
              expect(result.pagination.totalPages).toBe(expectedTotalPages);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("calculates hasNextPage correctly", () => {
        fc.assert(
          fc.property(
            validPageGenerator,
            validLimitGenerator,
            fc.integer({ min: 0, max: 1000 }),
            (page, limit, totalCount) => {
              const result = createPaginatedResponse([], { page, limit, totalCount });

              const totalPages = Math.ceil(totalCount / limit);
              const expectedHasNext = page < totalPages;
              expect(result.pagination.hasNextPage).toBe(expectedHasNext);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("calculates hasPreviousPage correctly", () => {
        fc.assert(
          fc.property(validPageGenerator, (page) => {
            const result = createPaginatedResponse([], { page, limit: 20, totalCount: 100 });

            const expectedHasPrevious = page > 1;
            expect(result.pagination.hasPreviousPage).toBe(expectedHasPrevious);
          }),
          { numRuns: 100 }
        );
      });

      it("includes filters when provided", () => {
        fc.assert(
          fc.property(
            fc.record({
              search: fc.string({ minLength: 0, maxLength: 20 }),
              genres: fc.array(fc.string({ minLength: 1, maxLength: 10 })),
            }),
            (filters) => {
              const result = createPaginatedResponse(
                [],
                { page: 1, limit: 20, totalCount: 0 },
                filters
              );

              expect(result.filters).toEqual(filters);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("omits filters when not provided", () => {
        const result = createPaginatedResponse([], { page: 1, limit: 20, totalCount: 0 });
        expect(result.filters).toBeUndefined();
      });
    });

    describe("handleApiError", () => {
      it("returns error object with message for Error instances", () => {
        fc.assert(
          fc.property(fc.string({ minLength: 1, maxLength: 100 }), (message) => {
            const error = new Error(message);
            const result = handleApiError(error);

            expect(result).toHaveProperty("error");
            expect(typeof result.error).toBe("string");
          }),
          { numRuns: 100 }
        );
      });

      it("returns error object with message for string errors", () => {
        fc.assert(
          fc.property(fc.string({ minLength: 1, maxLength: 100 }), (message) => {
            const result = handleApiError(message);

            expect(result).toHaveProperty("error");
            expect(typeof result.error).toBe("string");
          }),
          { numRuns: 100 }
        );
      });

      it("returns default message for unknown error types", () => {
        fc.assert(
          fc.property(
            fc.oneof(fc.constant(null), fc.constant(undefined), fc.integer()),
            (unknownError) => {
              const result = handleApiError(unknownError, "Default error");

              expect(result.error).toBe("Default error");
            }
          ),
          { numRuns: 50 }
        );
      });

      it("includes error code when Error has custom name", () => {
        class CustomError extends Error {
          constructor(message: string) {
            super(message);
            this.name = "CustomError";
          }
        }

        const error = new CustomError("Test error");
        const result = handleApiError(error);

        expect(result.code).toBe("CustomError");
      });
    });

    describe("validateRequiredParams", () => {
      it("returns valid=true when all required params are present", () => {
        fc.assert(
          fc.property(
            fc.uniqueArray(fc.stringMatching(/^[a-z][a-z0-9]{0,19}$/), {
              minLength: 1,
              maxLength: 5,
            }),
            (keys) => {
              const params: Record<string, unknown> = {};
              keys.forEach((key) => {
                params[key] = "value";
              });

              const result = validateRequiredParams(params, keys);

              expect(result.valid).toBe(true);
              expect(result.missing).toEqual([]);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("returns valid=false with missing keys when params are absent", () => {
        // Use unique identifier-like keys to avoid reserved property names
        fc.assert(
          fc.property(
            fc.uniqueArray(fc.stringMatching(/^[a-z][a-z0-9]{0,19}$/), {
              minLength: 1,
              maxLength: 5,
            }),
            (keys) => {
              const params: Record<string, unknown> = {};
              // Don't add any params

              const result = validateRequiredParams(params, keys);

              expect(result.valid).toBe(false);
              expect(result.missing.sort()).toEqual(keys.sort());
            }
          ),
          { numRuns: 100 }
        );
      });

      it("treats null, undefined, and empty string as missing", () => {
        const params = {
          a: null,
          b: undefined,
          c: "",
          d: "valid",
        };

        const result = validateRequiredParams(params, ["a", "b", "c", "d"]);

        expect(result.valid).toBe(false);
        expect(result.missing.sort()).toEqual(["a", "b", "c"]);
      });
    });

    describe("calculateOffset", () => {
      it("calculates correct offset for any page and limit", () => {
        fc.assert(
          fc.property(validPageGenerator, validLimitGenerator, (page, limit) => {
            const result = calculateOffset(page, limit);

            const expected = (page - 1) * limit;
            expect(result).toBe(expected);
          }),
          { numRuns: 100 }
        );
      });

      it("returns 0 for page 1", () => {
        fc.assert(
          fc.property(validLimitGenerator, (limit) => {
            const result = calculateOffset(1, limit);
            expect(result).toBe(0);
          }),
          { numRuns: 100 }
        );
      });
    });
  });
});
