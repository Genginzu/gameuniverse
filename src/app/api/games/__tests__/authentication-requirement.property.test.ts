import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

/**
 * Feature: library-games-view
 * Property 10: Authentication requirement
 * **Validates: Requirements 4.4**
 *
 * For any request to the library page without valid authentication,
 * the system should redirect to the authentication page (return 401).
 *
 * This test validates the authentication logic that ensures when inLibrary=true,
 * unauthenticated requests are rejected with a 401 status.
 */

// Types representing authentication states
interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  authError: string | null;
}

interface ApiRequest {
  inLibrary: boolean;
  search?: string;
  genres?: string[];
  page?: number;
}

interface ApiResponse {
  status: number;
  error?: string;
  games?: unknown[];
}

// Pure function that simulates the authentication check logic
function checkAuthenticationRequirement(authState: AuthState, request: ApiRequest): ApiResponse {
  // If library filtering is requested, authentication is required
  if (request.inLibrary) {
    if (!authState.isAuthenticated || !authState.userId || authState.authError) {
      return {
        status: 401,
        error: "Authentication required",
      };
    }
  }

  // If authenticated or not requesting library, proceed with success
  return {
    status: 200,
    games: [],
  };
}

// Generators for property-based testing
const userIdGenerator = fc.uuid();

const authenticatedStateGenerator = fc.record({
  isAuthenticated: fc.constant(true),
  userId: userIdGenerator,
  authError: fc.constant(null),
});

const unauthenticatedStateGenerator = fc.oneof(
  // No user at all
  fc.record({
    isAuthenticated: fc.constant(false),
    userId: fc.constant(null),
    authError: fc.constant(null),
  }),
  // Auth error present
  fc.record({
    isAuthenticated: fc.constant(false),
    userId: fc.constant(null),
    authError: fc.constantFrom("Not authenticated", "Session expired", "Invalid token"),
  }),
  // User null with error
  fc.record({
    isAuthenticated: fc.constant(true),
    userId: fc.constant(null),
    authError: fc.constantFrom("User not found", "Session invalid"),
  })
);

const searchQueryGenerator = fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 50 }));

const genresGenerator = fc.array(
  fc.constantFrom("action", "rpg", "adventure", "strategy", "puzzle"),
  { minLength: 0, maxLength: 3 }
);

const pageGenerator = fc.integer({ min: 1, max: 100 });

const libraryRequestGenerator = fc.record({
  inLibrary: fc.constant(true),
  search: searchQueryGenerator,
  genres: genresGenerator,
  page: pageGenerator,
});

const nonLibraryRequestGenerator = fc.record({
  inLibrary: fc.constant(false),
  search: searchQueryGenerator,
  genres: genresGenerator,
  page: pageGenerator,
});

describe("Library Games API Authentication Property-Based Tests", () => {
  describe("Property 10: Authentication requirement", () => {
    it("unauthenticated requests with inLibrary=true return 401", () => {
      fc.assert(
        fc.property(
          unauthenticatedStateGenerator,
          libraryRequestGenerator,
          (authState, request) => {
            const response = checkAuthenticationRequirement(authState, request);

            // Property: unauthenticated library requests must return 401
            expect(response.status).toBe(401);
            expect(response.error).toBe("Authentication required");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("authenticated requests with inLibrary=true return 200", () => {
      fc.assert(
        fc.property(authenticatedStateGenerator, libraryRequestGenerator, (authState, request) => {
          const response = checkAuthenticationRequirement(authState, request);

          // Property: authenticated library requests should succeed
          expect(response.status).toBe(200);
          expect(response.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it("unauthenticated requests without inLibrary=true return 200", () => {
      fc.assert(
        fc.property(
          unauthenticatedStateGenerator,
          nonLibraryRequestGenerator,
          (authState, request) => {
            const response = checkAuthenticationRequirement(authState, request);

            // Property: non-library requests don't require authentication
            expect(response.status).toBe(200);
            expect(response.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("authentication check is independent of other request parameters", () => {
      fc.assert(
        fc.property(
          unauthenticatedStateGenerator,
          searchQueryGenerator,
          genresGenerator,
          pageGenerator,
          (authState, search, genres, page) => {
            // Create requests with various parameter combinations
            const request: ApiRequest = {
              inLibrary: true,
              search,
              genres,
              page,
            };

            const response = checkAuthenticationRequirement(authState, request);

            // Property: regardless of search/genres/page, auth check should fail
            expect(response.status).toBe(401);
            expect(response.error).toBe("Authentication required");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("authentication requirement is consistent across multiple checks", () => {
      fc.assert(
        fc.property(
          fc.oneof(authenticatedStateGenerator, unauthenticatedStateGenerator),
          libraryRequestGenerator,
          fc.integer({ min: 2, max: 10 }),
          (authState, request, numChecks) => {
            // Perform multiple checks with the same state
            const responses: ApiResponse[] = [];
            for (let i = 0; i < numChecks; i++) {
              responses.push(checkAuthenticationRequirement(authState, request));
            }

            // Property: all responses should be identical (deterministic)
            const firstResponse = responses[0];
            for (const response of responses) {
              expect(response.status).toBe(firstResponse.status);
              expect(response.error).toBe(firstResponse.error);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("null userId with inLibrary=true always returns 401", () => {
      fc.assert(
        fc.property(
          fc.record({
            isAuthenticated: fc.boolean(),
            userId: fc.constant(null),
            authError: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 50 })),
          }),
          libraryRequestGenerator,
          (authState, request) => {
            const response = checkAuthenticationRequirement(authState, request);

            // Property: null userId should always result in 401 for library requests
            expect(response.status).toBe(401);
            expect(response.error).toBe("Authentication required");
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
