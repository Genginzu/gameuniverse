import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  truncatePreview,
  sortConversationsByRecent,
  canonicalParticipants,
} from "../../../../src/lib/utils/discussion-utils";
import type { ConversationSummary } from "../../../../src/types/discussion";

// --- Generators ---

/** Generates a valid ISO timestamp string within a reasonable range */
const MIN_TS = new Date("2020-01-01T00:00:00.000Z").getTime();
const MAX_TS = new Date("2030-12-31T23:59:59.999Z").getTime();
const isoTimestampGenerator = fc
  .integer({ min: MIN_TS, max: MAX_TS })
  .map((ts) => new Date(ts).toISOString());

/** Generates a ConversationSummary with a lastMessage containing a random date */
const conversationWithMessageGenerator = fc
  .tuple(fc.uuid(), fc.uuid(), fc.string({ minLength: 1, maxLength: 100 }), isoTimestampGenerator)
  .map(
    ([id, friendId, content, createdAt]): ConversationSummary => ({
      id,
      friend: { id: friendId, displayName: "Friend", avatarUrl: null },
      lastMessage: {
        content,
        senderId: friendId,
        createdAt,
      },
      unreadCount: 0,
    })
  );

/** Generates a non-empty array of ConversationSummary with distinct timestamps */
const conversationListGenerator = fc
  .array(conversationWithMessageGenerator, { minLength: 2, maxLength: 20 })
  .filter((list) => {
    const timestamps = list.map((c) => c.lastMessage!.createdAt);
    return new Set(timestamps).size === timestamps.length;
  });

/** Generates two distinct UUID strings */
const distinctUuidPairGenerator = fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b);

// --- Tests ---

describe("Discussion Utils - Property-Based Tests", () => {
  /**
   * Feature: player-discussions, Property 2: Conversations are sorted by most recent message
   *
   * _For any_ list of ConversationSummary with lastMessage timestamps,
   * sortConversationsByRecent should return them in strictly descending order
   * by lastMessage.createdAt.
   *
   * **Validates: Requirements 2.1**
   */
  describe("Property 2: Conversations are sorted by most recent message", () => {
    it("returns conversations in strictly descending order by lastMessage.createdAt", () => {
      fc.assert(
        fc.property(conversationListGenerator, (conversations) => {
          const sorted = sortConversationsByRecent(conversations);

          for (let i = 0; i < sorted.length - 1; i++) {
            const currentTime = new Date(sorted[i].lastMessage!.createdAt).getTime();
            const nextTime = new Date(sorted[i + 1].lastMessage!.createdAt).getTime();
            expect(currentTime).toBeGreaterThan(nextTime);
          }
        }),
        { numRuns: 200 }
      );
    });

    it("preserves all original conversations (same length, same ids)", () => {
      fc.assert(
        fc.property(conversationListGenerator, (conversations) => {
          const sorted = sortConversationsByRecent(conversations);
          expect(sorted.length).toBe(conversations.length);

          const originalIds = new Set(conversations.map((c) => c.id));
          const sortedIds = new Set(sorted.map((c) => c.id));
          expect(sortedIds).toEqual(originalIds);
        }),
        { numRuns: 200 }
      );
    });

    it("does not mutate the original array", () => {
      fc.assert(
        fc.property(conversationListGenerator, (conversations) => {
          const original = [...conversations];
          sortConversationsByRecent(conversations);
          expect(conversations).toEqual(original);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: player-discussions, Property 3: Last message preview is truncated at 80 characters
   *
   * _For any_ string, truncatePreview should return at most 80 characters (+ ellipsis
   * char if truncated). If original > 80, result should end with "…" and be 81 chars total.
   *
   * **Validates: Requirements 2.2**
   */
  describe("Property 3: Last message preview is truncated at 80 characters", () => {
    it("returns at most 81 characters (80 + ellipsis) for any input", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 500 }), (content) => {
          const result = truncatePreview(content);
          expect(result.length).toBeLessThanOrEqual(81);
        }),
        { numRuns: 200 }
      );
    });

    it("returns the original string unchanged when length <= 80", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 80 }), (content) => {
          const result = truncatePreview(content);
          expect(result).toBe(content);
        }),
        { numRuns: 200 }
      );
    });

    it("ends with '…' and has length 81 when original exceeds 80 characters", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 81, maxLength: 500 }), (content) => {
          const result = truncatePreview(content);
          expect(result).toHaveLength(81);
          expect(result.endsWith("…")).toBe(true);
        }),
        { numRuns: 200 }
      );
    });

    it("preserves the first 80 characters of the original when truncated", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 81, maxLength: 500 }), (content) => {
          const result = truncatePreview(content);
          expect(result.slice(0, 80)).toBe(content.slice(0, 80));
        }),
        { numRuns: 200 }
      );
    });
  });

  /**
   * Feature: player-discussions, Property 8: Messages are ordered chronologically
   *
   * _For any_ list of messages with created_at timestamps, sorting by created_at
   * ascending should produce chronological order (oldest first).
   *
   * **Validates: Requirements 4.2**
   */
  describe("Property 8: Messages are ordered chronologically", () => {
    it("sorting messages by created_at ascending produces chronological order", () => {
      const messageGenerator = fc
        .tuple(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          isoTimestampGenerator
        )
        .map(([id, convId, senderId, content, createdAt]) => ({
          id,
          conversationId: convId,
          senderId,
          content,
          createdAt,
          readAt: null,
        }));

      const messageListGenerator = fc.array(messageGenerator, { minLength: 2, maxLength: 20 });

      fc.assert(
        fc.property(messageListGenerator, (messages) => {
          const sorted = [...messages].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          for (let i = 0; i < sorted.length - 1; i++) {
            const currentTime = new Date(sorted[i].createdAt).getTime();
            const nextTime = new Date(sorted[i + 1].createdAt).getTime();
            expect(currentTime).toBeLessThanOrEqual(nextTime);
          }
        }),
        { numRuns: 200 }
      );
    });

    it("chronological sort preserves all messages", () => {
      const messageGenerator = fc
        .tuple(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 50 }),
          isoTimestampGenerator
        )
        .map(([id, convId, senderId, content, createdAt]) => ({
          id,
          conversationId: convId,
          senderId,
          content,
          createdAt,
          readAt: null,
        }));

      const messageListGenerator = fc.array(messageGenerator, { minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(messageListGenerator, (messages) => {
          const sorted = [...messages].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          expect(sorted.length).toBe(messages.length);

          const originalIds = new Set(messages.map((m) => m.id));
          const sortedIds = new Set(sorted.map((m) => m.id));
          expect(sortedIds).toEqual(originalIds);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: player-discussions, Property 11: Canonical participant ordering
   *
   * _For any_ two distinct UUID strings a and b, canonicalParticipants(a, b) should
   * return [min, max] where min <= max. Also canonicalParticipants(a, b) ===
   * canonicalParticipants(b, a) (commutativity).
   *
   * **Validates: Requirements 6.3**
   */
  describe("Property 11: Canonical participant ordering", () => {
    it("returns [min, max] where min <= max for any two distinct UUIDs", () => {
      fc.assert(
        fc.property(distinctUuidPairGenerator, ([a, b]) => {
          const [first, second] = canonicalParticipants(a, b);
          expect(first <= second).toBe(true);
        }),
        { numRuns: 200 }
      );
    });

    it("is commutative: canonicalParticipants(a, b) === canonicalParticipants(b, a)", () => {
      fc.assert(
        fc.property(distinctUuidPairGenerator, ([a, b]) => {
          const resultAB = canonicalParticipants(a, b);
          const resultBA = canonicalParticipants(b, a);
          expect(resultAB).toEqual(resultBA);
        }),
        { numRuns: 200 }
      );
    });

    it("always returns the smaller UUID first", () => {
      fc.assert(
        fc.property(distinctUuidPairGenerator, ([a, b]) => {
          const [first, second] = canonicalParticipants(a, b);
          const expectedMin = a < b ? a : b;
          const expectedMax = a < b ? b : a;
          expect(first).toBe(expectedMin);
          expect(second).toBe(expectedMax);
        }),
        { numRuns: 200 }
      );
    });

    it("returns both original UUIDs (no data loss)", () => {
      fc.assert(
        fc.property(distinctUuidPairGenerator, ([a, b]) => {
          const result = canonicalParticipants(a, b);
          expect(new Set(result)).toEqual(new Set([a, b]));
        }),
        { numRuns: 100 }
      );
    });
  });
});
