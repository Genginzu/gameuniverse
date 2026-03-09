import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import type { FriendSummary, RelationshipStatus } from "@/types/friendship";
import {
  computePagination,
  filterFriendsByName,
  getButtonState,
  getAriaLabel,
  countAcceptedFriends,
  sortFriendsByDate,
} from "@/lib/utils/friendUtils";

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const isoDateArb = fc
  .integer({
    min: new Date("2020-01-01T00:00:00Z").getTime(),
    max: new Date("2030-12-31T23:59:59Z").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

const friendSummaryArb: fc.Arbitrary<FriendSummary> = fc.record({
  id: fc.uuid(),
  friendshipId: fc.uuid(),
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
  avatarUrl: fc.option(fc.webUrl(), { nil: null }),
  level: fc.integer({ min: 0, max: 100 }),
  acceptedAt: isoDateArb,
});

const friendSummaryListArb = fc.array(friendSummaryArb, {
  minLength: 0,
  maxLength: 50,
});

const relationshipStatusArb: fc.Arbitrary<RelationshipStatus> = fc.constantFrom(
  "none",
  "pending_sent",
  "pending_received",
  "accepted"
);

const friendshipStatusArb = fc.constantFrom("pending", "accepted", "declined");

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe("Friend Service — Property-Based Tests", () => {
  // Feature: friends-system, Property 7: Pagination correctness
  describe("Property 7: Correction de la pagination", () => {
    /**
     * **Validates: Requirements 3.3, 3.4**
     */
    it("pagination metadata is correct for any totalCount, page, and limit", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 1, max: 30 }),
          fc.integer({ min: 1, max: 50 }),
          (totalCount, page, limit) => {
            const result = computePagination(totalCount, page, limit);
            const expectedTotalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / limit);

            expect(result.currentPage).toBe(page);
            expect(result.totalPages).toBe(expectedTotalPages);
            expect(result.hasNextPage).toBe(page < expectedTotalPages);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  // Feature: friends-system, Property 9: Client-side friend search filtering
  describe("Property 9: Filtrage de recherche côté client", () => {
    /**
     * **Validates: Requirement 4.6**
     */
    it("filtered list only contains matching friends and has no false negatives", () => {
      fc.assert(
        fc.property(
          friendSummaryListArb,
          fc.string({ minLength: 0, maxLength: 20 }),
          (friends, query) => {
            const filtered = filterFriendsByName(friends, query);

            if (!query.trim()) {
              expect(filtered).toEqual(friends);
              return;
            }

            const lowerQuery = query.toLowerCase();

            // No false positives
            for (const f of filtered) {
              expect(f.displayName.toLowerCase()).toContain(lowerQuery);
            }

            // No false negatives
            const expected = friends.filter((f) =>
              f.displayName.toLowerCase().includes(lowerQuery)
            );
            expect(filtered.length).toBe(expected.length);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  // Feature: friends-system, Property 10: Relationship status → button state mapping
  describe("Property 10: Mapping statut → état du bouton", () => {
    /**
     * **Validates: Requirements 6.1, 6.3, 6.4, 6.5, 6.6**
     */
    it("maps every status/auth combination to the correct button state", () => {
      fc.assert(
        fc.property(relationshipStatusArb, fc.boolean(), (status, isAuthenticated) => {
          const result = getButtonState(status, isAuthenticated);

          if (!isAuthenticated) {
            expect(result).toBe("hidden");
            return;
          }

          const expectedMap: Record<RelationshipStatus, string> = {
            none: "add_friend",
            pending_sent: "request_sent",
            pending_received: "accept_decline",
            accepted: "remove_friend",
          };
          expect(result).toBe(expectedMap[status]);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: friends-system, Property 13: Aria-label includes player name
  describe("Property 13: Aria-label inclut le nom du joueur", () => {
    /**
     * **Validates: Requirement 10.2**
     */
    it("returned label contains the player name", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (action, playerName) => {
            const label = getAriaLabel(action, playerName);
            expect(label).toContain(playerName);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: friends-system, Property 5: Chronological descending sort
  describe("Property 5: Tri chronologique décroissant", () => {
    /**
     * **Validates: Requirement 3.1**
     */
    it("sorted friends are in descending order by acceptedAt", () => {
      fc.assert(
        fc.property(friendSummaryListArb, (friends) => {
          const sorted = sortFriendsByDate(friends);

          for (let i = 0; i < sorted.length - 1; i++) {
            const current = new Date(sorted[i].acceptedAt).getTime();
            const next = new Date(sorted[i + 1].acceptedAt).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }),
        { numRuns: 200 }
      );
    });

    it("sorting preserves all elements (no loss, no duplication)", () => {
      fc.assert(
        fc.property(friendSummaryListArb, (friends) => {
          const sorted = sortFriendsByDate(friends);
          expect(sorted.length).toBe(friends.length);
          const inputIds = friends.map((f) => f.id).sort();
          const outputIds = sorted.map((f) => f.id).sort();
          expect(outputIds).toEqual(inputIds);
        }),
        { numRuns: 100 }
      );
    });

    it("does not mutate the original array", () => {
      fc.assert(
        fc.property(friendSummaryListArb, (friends) => {
          const original = [...friends];
          sortFriendsByDate(friends);
          expect(friends).toEqual(original);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: friends-system, Property 6: Friend data completeness
  describe("Property 6: Complétude des données d'un ami", () => {
    /**
     * **Validates: Requirements 3.2, 4.2**
     */
    it("every generated FriendSummary has all required fields with correct types", () => {
      fc.assert(
        fc.property(friendSummaryArb, (friend) => {
          expect(typeof friend.id).toBe("string");
          expect(friend.id.length).toBeGreaterThan(0);
          expect(typeof friend.displayName).toBe("string");
          expect(friend.displayName.length).toBeGreaterThan(0);
          expect(friend.avatarUrl === null || typeof friend.avatarUrl === "string").toBe(true);
          expect(Number.isInteger(friend.level)).toBe(true);
          expect(friend.level).toBeGreaterThanOrEqual(0);
          // acceptedAt must be a valid ISO 8601 string
          expect(isNaN(new Date(friend.acceptedAt).getTime())).toBe(false);
        }),
        { numRuns: 200 }
      );
    });
  });

  // Feature: friends-system, Property 11: Friend count equals accepted friendships
  describe("Property 11: Compteur = nombre d'amis acceptés", () => {
    /**
     * **Validates: Requirement 7.1**
     */
    it("countAcceptedFriends returns exact count of accepted items", () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({ status: friendshipStatusArb }), { minLength: 0, maxLength: 50 }),
          (friendships) => {
            const result = countAcceptedFriends(friendships);
            const expected = friendships.filter((f) => f.status === "accepted").length;
            expect(result).toBe(expected);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  // Feature: friends-system, Property 12: Error propagation with descriptive message
  describe("Property 12: Propagation d'erreur avec message descriptif", () => {
    /**
     * **Validates: Requirement 8.2**
     */
    const mockFetch = vi.fn();
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      globalThis.fetch = mockFetch as unknown as typeof fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      mockFetch.mockReset();
    });

    it("FriendService throws an error with the server error message on non-ok response", async () => {
      const { FriendService } = await import("@/lib/services/friendService");

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 400, max: 599 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (status, errorMessage) => {
            mockFetch.mockResolvedValueOnce({
              ok: false,
              status,
              json: async () => ({ error: errorMessage }),
            });

            try {
              await FriendService.getFriends("player-123");
              expect.unreachable("Should have thrown");
            } catch (err) {
              expect(err).toBeInstanceOf(Error);
              const message = (err as Error).message;
              expect(message.length).toBeGreaterThan(0);
              expect(message).toContain(errorMessage);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
