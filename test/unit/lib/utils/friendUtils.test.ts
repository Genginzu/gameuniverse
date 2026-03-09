import { describe, it, expect } from "vitest";
import {
  computePagination,
  filterFriendsByName,
  getButtonState,
  getAriaLabel,
  countAcceptedFriends,
  sortFriendsByDate,
} from "@/lib/utils/friendUtils";
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

describe("computePagination", () => {
  it("returns totalPages=1 when totalCount is 0", () => {
    const result = computePagination(0, 1, 20);
    expect(result).toEqual({ currentPage: 1, totalPages: 1, hasNextPage: false });
  });

  it("computes correct pages for exact multiple", () => {
    const result = computePagination(40, 1, 20);
    expect(result).toEqual({ currentPage: 1, totalPages: 2, hasNextPage: true });
  });

  it("computes correct pages for non-exact multiple", () => {
    const result = computePagination(25, 2, 20);
    expect(result).toEqual({ currentPage: 2, totalPages: 2, hasNextPage: false });
  });

  it("hasNextPage is false on last page", () => {
    const result = computePagination(10, 1, 20);
    expect(result.hasNextPage).toBe(false);
  });
});

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

describe("countAcceptedFriends", () => {
  it("returns 0 for empty array", () => {
    expect(countAcceptedFriends([])).toBe(0);
  });

  it("counts only accepted friendships", () => {
    const friendships = [
      { status: "accepted" },
      { status: "pending" },
      { status: "accepted" },
      { status: "declined" },
    ];
    expect(countAcceptedFriends(friendships)).toBe(2);
  });
});

describe("sortFriendsByDate", () => {
  it("sorts by acceptedAt descending", () => {
    const friends = [
      makeFriend({ id: "1", acceptedAt: "2024-01-01T00:00:00Z" }),
      makeFriend({ id: "2", acceptedAt: "2024-03-01T00:00:00Z" }),
      makeFriend({ id: "3", acceptedAt: "2024-02-01T00:00:00Z" }),
    ];
    const sorted = sortFriendsByDate(friends);
    expect(sorted.map((f) => f.id)).toEqual(["2", "3", "1"]);
  });

  it("does not mutate the original array", () => {
    const friends = [
      makeFriend({ acceptedAt: "2024-02-01T00:00:00Z" }),
      makeFriend({ acceptedAt: "2024-01-01T00:00:00Z" }),
    ];
    const original = [...friends];
    sortFriendsByDate(friends);
    expect(friends).toEqual(original);
  });
});
