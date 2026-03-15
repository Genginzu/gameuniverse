import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { countPendingRequests } from "@/lib/utils/friendUtils";

/**
 * Feature: friends-management-page, Property 2: Compteur de demandes en attente
 * **Validates: Requirement 4.1**
 */
describe("Friends Page Property-Based Tests", () => {
  describe("Property 2: Pending request counting", () => {
    const statusArb = fc.oneof(
      fc.constant("pending"),
      fc.constant("accepted"),
      fc.constant("declined")
    );

    const friendshipArb = fc.record({
      receiver_id: fc.uuid(),
      status: statusArb,
    });

    it("countPendingRequests equals manual count of pending received", () => {
      fc.assert(
        fc.property(fc.array(friendshipArb), fc.uuid(), (friendships, userId) => {
          const result = countPendingRequests(friendships, userId);

          const expected = friendships.filter(
            (f) => f.receiver_id === userId && f.status === "pending"
          ).length;

          expect(result).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });
  });
});
