import { describe, it, expect } from "vitest";
import { filterFriendsByName, getButtonState, getAriaLabel } from "@/lib/utils/friendUtils";
import type { FriendSummary } from "@/types/friendship";

function makeFriend(overrides: Partial<FriendSummary> = {}): FriendSummary {
  return {
    id: "1",
    friendshipId: "f1",
    displayName: "Player",
    avatarUrl: null,
    level: 1,
    acceptedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("filterFriendsByName", () => {
  const friends = [
    makeFriend({ displayName: "Alice" }),
    makeFriend({ displayName: "Bob" }),
    makeFriend({ displayName: "Charlie" }),
  ];

  it("returns all friends when query is empty", () => {
    expect(filterFriendsByName(friends, "")).toEqual(friends);
  });

  it("returns all friends when query is whitespace", () => {
    expect(filterFriendsByName(friends, "   ")).toEqual(friends);
  });

  it("filters case-insensitively", () => {
    const result = filterFriendsByName(friends, "alice");
    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe("Alice");
  });

  it("returns empty array when no match", () => {
    expect(filterFriendsByName(friends, "Zara")).toEqual([]);
  });
});

describe("getButtonState", () => {
  it("returns hidden when not authenticated", () => {
    expect(getButtonState("none", false)).toBe("hidden");
    expect(getButtonState("accepted", false)).toBe("hidden");
  });

  it("returns add_friend for status none", () => {
    expect(getButtonState("none", true)).toBe("add_friend");
  });

  it("returns request_sent for pending_sent", () => {
    expect(getButtonState("pending_sent", true)).toBe("request_sent");
  });

  it("returns accept_decline for pending_received", () => {
    expect(getButtonState("pending_received", true)).toBe("accept_decline");
  });

  it("returns remove_friend for accepted", () => {
    expect(getButtonState("accepted", true)).toBe("remove_friend");
  });
});

describe("getAriaLabel", () => {
  it("includes the player name", () => {
    const label = getAriaLabel("Accept", "Alice");
    expect(label).toContain("Alice");
  });

  it("includes the action", () => {
    const label = getAriaLabel("Decline", "Bob");
    expect(label).toBe("Decline Bob");
  });
});
