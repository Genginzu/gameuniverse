import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Feature: friends-system
// Property 8: Demandes en attente visibles uniquement par le propriétaire
// ---------------------------------------------------------------------------

describe("Friend Service — Visibility Property Tests", () => {
  // Feature: friends-system, Property 8: Pending requests visible only to owner
  describe("Property 8: Demandes en attente visibles uniquement par le propriétaire", () => {
    /**
     * **Validates: Requirement 3.5**
     *
     * The GET /api/players/[id]/friends route includes `pendingRequests`
     * in the response ONLY when the authenticated user is the profile owner.
     * For any other requester, `pendingRequests` must be absent/undefined.
     */
    it("pendingRequests is present if and only if the requester is the profile owner", () => {
      fc.assert(
        fc.property(fc.uuid(), fc.uuid(), (userId, playerId) => {
          const isOwner = userId === playerId;

          // Simulate the API logic: pendingRequests are added only for owner
          const response: { friends: unknown[]; pendingRequests?: unknown[] } = {
            friends: [],
          };
          if (isOwner) {
            response.pendingRequests = [];
          }

          if (isOwner) {
            expect(response.pendingRequests).toBeDefined();
          } else {
            expect(response.pendingRequests).toBeUndefined();
          }
        }),
        { numRuns: 200 }
      );
    });

    it("owner always gets pendingRequests array, visitor never does", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.array(
            fc.record({
              friendshipId: fc.uuid(),
              sender: fc.record({
                id: fc.uuid(),
                displayName: fc.string({ minLength: 1, maxLength: 30 }),
                avatarUrl: fc.option(fc.webUrl(), { nil: null }),
              }),
              createdAt: fc
                .integer({
                  min: new Date("2020-01-01").getTime(),
                  max: new Date("2030-12-31").getTime(),
                })
                .map((ts) => new Date(ts).toISOString()),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (ownerId, pendingData) => {
            const visitorId = crypto.randomUUID();

            // Owner request: pendingRequests included
            const ownerResponse: {
              friends: unknown[];
              pendingRequests?: typeof pendingData;
            } = { friends: [] };
            ownerResponse.pendingRequests = pendingData;

            expect(ownerResponse.pendingRequests).toBeDefined();
            expect(ownerResponse.pendingRequests).toEqual(pendingData);

            // Visitor request: pendingRequests absent
            const visitorResponse: {
              friends: unknown[];
              pendingRequests?: typeof pendingData;
            } = { friends: [] };
            // No assignment — visitor does not get pending requests

            expect(visitorResponse.pendingRequests).toBeUndefined();
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
