import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { formatBadgeCount } from "@/components/friends/NotificationBadge";
import { countPendingRequests } from "@/lib/utils/friendUtils";

/**
 * Feature: friends-management-page, Property 1: Formatage du badge de notification
 * **Validates: Requirements 3.1, 3.2, 3.3, 10.5**
 */

describe("Friends Page Property-Based Tests", () => {
  // Feature: friends-management-page, Property 1: Formatage du badge de notification
  describe("Property 1: Badge formatting", () => {
    it("returns null for count 0, string of count for 1-9, '9+' for >9", () => {
      fc.assert(
        fc.property(fc.nat(), (count) => {
          const result = formatBadgeCount(count);

          if (count === 0) {
            expect(result).toBeNull();
          } else if (count <= 9) {
            expect(result).toBe(String(count));
          } else {
            expect(result).toBe("9+");
          }
        }),
        { numRuns: 100 }
      );
    });

    it("for count > 0, result is never null", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10000 }), (count) => {
          expect(formatBadgeCount(count)).not.toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: friends-management-page, Property 2: Compteur de demandes en attente
   * **Validates: Requirement 4.1**
   */
  // Feature: friends-management-page, Property 2: Compteur de demandes en attente
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
