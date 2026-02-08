import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import * as fc from "fast-check";
import {
  BaseService,
  FetchOptions,
  PaginatedResponse,
  EntityMetadata,
} from "../../../../src/lib/services/baseService";

// Feature: code-refactoring, Property 1: Service Backward Compatibility
// **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

// Test implementation of BaseService for testing purposes
interface TestEntityDetails {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
}

interface TestEntitySummary {
  id: string;
  slug: string;
  title: string;
}

class TestService extends BaseService<TestEntityDetails, TestEntitySummary> {
  protected readonly entityName = "test";
  protected readonly apiPath = "/api/test";

  protected buildMetadata(entity: TestEntityDetails, locale: string): EntityMetadata {
    return {
      title: `${entity.title} - Test`,
      description: entity.description,
      openGraph: {
        title: entity.title,
        description: entity.description,
        images: entity.coverImage ? [entity.coverImage] : [],
      },
    };
  }
}

// Generators for property-based testing
const entityDetailsGenerator = fc.record({
  id: fc.uuid(),
  slug: fc.stringMatching(/^[a-z0-9-]{1,50}$/),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
  coverImage: fc.option(fc.webUrl()),
});

const entitySummaryGenerator = fc.record({
  id: fc.uuid(),
  slug: fc.stringMatching(/^[a-z0-9-]{1,50}$/),
  title: fc.string({ minLength: 1, maxLength: 100 }),
});

const paginationGenerator = fc.record({
  currentPage: fc.integer({ min: 1, max: 100 }),
  totalPages: fc.integer({ min: 1, max: 100 }),
  totalCount: fc.integer({ min: 0, max: 10000 }),
  hasNextPage: fc.boolean(),
  hasPreviousPage: fc.boolean(),
});

const localeGenerator = fc.constantFrom("fr", "en");

// Valid identifier generator (alphanumeric with dashes, no special chars)
const identifierGenerator = fc.stringMatching(/^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$/);

describe("BaseService Property-Based Tests", () => {
  let service: TestService;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    service = new TestService();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("Property 1: Service Backward Compatibility", () => {
    it("fetchDetails returns entity details or null for any valid identifier and locale", async () => {
      // Generate test cases synchronously
      const testCases = fc.sample(
        fc.tuple(identifierGenerator, localeGenerator, entityDetailsGenerator, fc.boolean()),
        100
      );

      for (const [identifier, locale, mockEntity, shouldExist] of testCases) {
        // Set up mock before each test case
        global.fetch = mock(() =>
          Promise.resolve({
            ok: shouldExist,
            status: shouldExist ? 200 : 404,
            statusText: shouldExist ? "OK" : "Not Found",
            json: () => Promise.resolve(mockEntity),
            text: () => Promise.resolve("Not found"),
          } as Response)
        );

        const result = await service.fetchDetails(identifier, locale);

        if (shouldExist) {
          expect(result).toEqual(mockEntity);
        } else {
          expect(result).toBeNull();
        }
      }
    });

    it("fetchList returns paginated response with correct structure for any valid options", async () => {
      const testCases = fc.sample(
        fc.tuple(
          fc.array(entitySummaryGenerator, { minLength: 0, maxLength: 20 }),
          paginationGenerator,
          fc.record({
            search: fc.option(fc.stringMatching(/^[a-z0-9 ]{0,20}$/)),
            page: fc.option(fc.integer({ min: 1, max: 100 })),
            limit: fc.option(fc.integer({ min: 1, max: 100 })),
            locale: fc.option(localeGenerator),
          })
        ),
        100
      );

      for (const [items, pagination, options] of testCases) {
        const mockResponse: PaginatedResponse<TestEntitySummary> = {
          items,
          pagination,
        };

        global.fetch = mock(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve(mockResponse),
          } as Response)
        );

        const result = await service.fetchList(options as FetchOptions);

        // Verify response structure
        expect(result).toHaveProperty("items");
        expect(result).toHaveProperty("pagination");
        expect(Array.isArray(result.items)).toBe(true);
        expect(result.pagination).toHaveProperty("currentPage");
        expect(result.pagination).toHaveProperty("totalPages");
        expect(result.pagination).toHaveProperty("totalCount");
        expect(result.pagination).toHaveProperty("hasNextPage");
        expect(result.pagination).toHaveProperty("hasPreviousPage");
      }
    });

    it("exists returns boolean for any valid identifier and locale", async () => {
      const testCases = fc.sample(
        fc.tuple(identifierGenerator, localeGenerator, entityDetailsGenerator, fc.boolean()),
        100
      );

      for (const [identifier, locale, mockEntity, shouldExist] of testCases) {
        global.fetch = mock(() =>
          Promise.resolve({
            ok: shouldExist,
            status: shouldExist ? 200 : 404,
            statusText: shouldExist ? "OK" : "Not Found",
            json: () => Promise.resolve(mockEntity),
            text: () => Promise.resolve("Not found"),
          } as Response)
        );

        const result = await service.exists(identifier, locale);

        expect(typeof result).toBe("boolean");
        expect(result).toBe(shouldExist);
      }
    });

    it("generateMetadata returns valid metadata structure for any entity", async () => {
      const testCases = fc.sample(
        fc.tuple(identifierGenerator, localeGenerator, entityDetailsGenerator, fc.boolean()),
        100
      );

      for (const [identifier, locale, mockEntity, shouldExist] of testCases) {
        global.fetch = mock(() =>
          Promise.resolve({
            ok: shouldExist,
            status: shouldExist ? 200 : 404,
            statusText: shouldExist ? "OK" : "Not Found",
            json: () => Promise.resolve(mockEntity),
            text: () => Promise.resolve("Not found"),
          } as Response)
        );

        const result = await service.generateMetadata(identifier, locale);

        // Verify metadata structure
        expect(result).toHaveProperty("title");
        expect(typeof result.title).toBe("string");
        expect(result.title.length).toBeGreaterThan(0);

        if (shouldExist) {
          // When entity exists, should have full metadata
          expect(result.openGraph).toBeDefined();
          expect(result.openGraph?.title).toBe(mockEntity.title);
        }
      }
    });
  });

  describe("Property 1 Extended: Error Handling", () => {
    it("fetchDetails throws on network errors", async () => {
      const testCases = fc.sample(fc.tuple(identifierGenerator, localeGenerator), 50);

      for (const [identifier, locale] of testCases) {
        global.fetch = mock(() => Promise.reject(new Error("Network error")));

        await expect(service.fetchDetails(identifier, locale)).rejects.toThrow();
      }
    });

    it("exists returns false on network errors", async () => {
      const testCases = fc.sample(fc.tuple(identifierGenerator, localeGenerator), 50);

      for (const [identifier, locale] of testCases) {
        global.fetch = mock(() => Promise.reject(new Error("Network error")));

        const result = await service.exists(identifier, locale);
        expect(result).toBe(false);
      }
    });

    it("generateMetadata returns error metadata on failures", async () => {
      const testCases = fc.sample(fc.tuple(identifierGenerator, localeGenerator), 50);

      for (const [identifier, locale] of testCases) {
        global.fetch = mock(() => Promise.reject(new Error("Network error")));

        const result = await service.generateMetadata(identifier, locale);

        expect(result).toHaveProperty("title");
        expect(result.title).toBe(locale === "fr" ? "Erreur" : "Error");
      }
    });
  });

  describe("Property 1 Extended: URL Construction", () => {
    it("fetchDetails constructs correct URL with identifier and locale", async () => {
      const testCases = fc.sample(
        fc.tuple(identifierGenerator, localeGenerator, entityDetailsGenerator),
        50
      );

      for (const [identifier, locale, mockEntity] of testCases) {
        let capturedUrl = "";
        global.fetch = mock((url: string) => {
          capturedUrl = url;
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve(mockEntity),
          } as Response);
        });

        await service.fetchDetails(identifier, locale);

        expect(capturedUrl).toContain(`/api/test/${identifier}`);
        expect(capturedUrl).toContain(`locale=${locale}`);
      }
    });

    it("fetchList constructs correct URL with search params", async () => {
      const testCases = fc.sample(
        fc.record({
          search: fc.option(fc.stringMatching(/^[a-z0-9]{1,20}$/)),
          page: fc.option(fc.integer({ min: 1, max: 100 })),
          limit: fc.option(fc.integer({ min: 1, max: 100 })),
        }),
        50
      );

      for (const options of testCases) {
        let capturedUrl = "";
        global.fetch = mock((url: string) => {
          capturedUrl = url;
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () =>
              Promise.resolve({
                items: [],
                pagination: {
                  currentPage: 1,
                  totalPages: 1,
                  totalCount: 0,
                  hasNextPage: false,
                  hasPreviousPage: false,
                },
              }),
          } as Response);
        });

        await service.fetchList(options as FetchOptions);

        expect(capturedUrl).toContain("/api/test");
        if (options.search) {
          expect(capturedUrl).toContain("search=");
        }
        if (options.page) {
          expect(capturedUrl).toContain(`page=${options.page}`);
        }
        if (options.limit) {
          expect(capturedUrl).toContain(`limit=${options.limit}`);
        }
      }
    });
  });
});
