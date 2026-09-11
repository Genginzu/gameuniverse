import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  truncatePreview,
  sortConversationsByRecent,
  formatMessageDate,
  canonicalParticipants,
} from "@/lib/utils/discussion-utils";
import type { ConversationSummary } from "@/types/discussion";

describe("truncatePreview", () => {
  it("returns content as-is when within limit", () => {
    expect(truncatePreview("Hello", 80)).toBe("Hello");
  });

  it("returns content as-is when exactly at limit", () => {
    const text = "a".repeat(80);
    expect(truncatePreview(text, 80)).toBe(text);
  });

  it("truncates and adds ellipsis when exceeding limit", () => {
    const text = "a".repeat(100);
    const result = truncatePreview(text, 80);
    expect(result).toBe("a".repeat(80) + "…");
    expect(result.length).toBe(81); // 80 chars + ellipsis
  });

  it("uses default maxLength of 80", () => {
    const text = "a".repeat(81);
    expect(truncatePreview(text)).toBe("a".repeat(80) + "…");
  });

  it("handles empty string", () => {
    expect(truncatePreview("")).toBe("");
  });

  it("respects custom maxLength", () => {
    expect(truncatePreview("Hello World", 5)).toBe("Hello…");
  });
});

describe("sortConversationsByRecent", () => {
  const makeConversation = (id: string, lastMessageDate: string | null): ConversationSummary => ({
    id,
    friend: { id: "f1", displayName: "Friend", avatarUrl: null },
    lastMessage: lastMessageDate
      ? { content: "msg", senderId: "s1", createdAt: lastMessageDate }
      : null,
    unreadCount: 0,
  });

  it("sorts conversations by most recent first", () => {
    const conversations = [
      makeConversation("1", "2024-01-01T00:00:00Z"),
      makeConversation("2", "2024-03-01T00:00:00Z"),
      makeConversation("3", "2024-02-01T00:00:00Z"),
    ];
    const sorted = sortConversationsByRecent(conversations);
    expect(sorted.map((c) => c.id)).toEqual(["2", "3", "1"]);
  });

  it("places conversations without lastMessage at the end", () => {
    const conversations = [
      makeConversation("1", null),
      makeConversation("2", "2024-01-01T00:00:00Z"),
      makeConversation("3", null),
    ];
    const sorted = sortConversationsByRecent(conversations);
    expect(sorted[0].id).toBe("2");
    expect(sorted[1].lastMessage).toBeNull();
    expect(sorted[2].lastMessage).toBeNull();
  });

  it("does not mutate the original array", () => {
    const conversations = [
      makeConversation("1", "2024-03-01T00:00:00Z"),
      makeConversation("2", "2024-01-01T00:00:00Z"),
    ];
    const original = [...conversations];
    sortConversationsByRecent(conversations);
    expect(conversations).toEqual(original);
  });

  it("handles empty array", () => {
    expect(sortConversationsByRecent([])).toEqual([]);
  });
});

describe("formatMessageDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "À l\'instant" for less than 1 minute ago', () => {
    expect(formatMessageDate("2024-06-15T11:59:30Z")).toBe("À l'instant");
  });

  it('returns "il y a X min" for less than 60 minutes ago', () => {
    expect(formatMessageDate("2024-06-15T11:30:00Z")).toBe("il y a 30 min");
  });

  it('returns "il y a X h" for less than 24 hours ago', () => {
    expect(formatMessageDate("2024-06-15T06:00:00Z")).toBe("il y a 6 h");
  });

  it("returns DD/MM/YYYY for older dates", () => {
    expect(formatMessageDate("2024-01-05T10:00:00Z")).toBe("05/01/2024");
  });

  it("handles exactly 1 minute ago", () => {
    expect(formatMessageDate("2024-06-15T11:59:00Z")).toBe("il y a 1 min");
  });

  it("handles exactly 1 hour ago", () => {
    expect(formatMessageDate("2024-06-15T11:00:00Z")).toBe("il y a 1 h");
  });
});

describe("canonicalParticipants", () => {
  it("returns [min, max] when a < b", () => {
    expect(canonicalParticipants("aaa", "bbb")).toEqual(["aaa", "bbb"]);
  });

  it("returns [min, max] when a > b", () => {
    expect(canonicalParticipants("bbb", "aaa")).toEqual(["aaa", "bbb"]);
  });

  it("returns same order for equal strings", () => {
    expect(canonicalParticipants("abc", "abc")).toEqual(["abc", "abc"]);
  });

  it("works with UUIDs", () => {
    const a = "550e8400-e29b-41d4-a716-446655440000";
    const b = "123e4567-e89b-12d3-a456-426614174000";
    const [p1, p2] = canonicalParticipants(a, b);
    expect(p1 <= p2).toBe(true);
    expect(p1).toBe(b);
    expect(p2).toBe(a);
  });
});
