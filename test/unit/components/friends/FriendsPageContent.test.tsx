import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// --- Mutable mock state ---
let mockUser: { id: string } | null = { id: "user-1" };
let mockAuthLoading = false;

let mockUseFriendsReturn = {
  friends: [] as Array<{
    id: string;
    friendshipId: string;
    displayName: string;
    avatarUrl: string | null;
    level: number;
    acceptedAt: string;
  }>,
  pendingRequests: [] as Array<{
    friendshipId: string;
    sender: { id: string; displayName: string; avatarUrl: string | null };
    createdAt: string;
  }>,
  friendCount: 0,
  isLoading: false,
  isLoadingMore: false,
  hasNextPage: false,
  error: null as string | null,
  sendRequest: vi.fn(),
  acceptRequest: vi.fn(),
  declineRequest: vi.fn(),
  removeFriend: vi.fn(),
  loadMore: vi.fn(),
  relationshipStatus: "none" as const,
  relationshipFriendshipId: null as string | null,
};

let mockPendingCount = { count: 0, isLoading: false, decrement: vi.fn(), refresh: vi.fn() };

// --- Mocks ---
vi.mock("next-intl", () => {
  const createTranslator = () => {
    const t = (key: string, params?: Record<string, unknown>) => {
      if (params) return `${key} ${JSON.stringify(params)}`;
      return key;
    };
    t.rich = (key: string) => key;
    t.raw = (key: string) => key;
    t.markup = (key: string) => key;
    t.has = () => true;
    return t;
  };
  return {
    useTranslations: () => createTranslator(),
    useLocale: () => "en",
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser, loading: mockAuthLoading }),
}));

vi.mock("@/hooks/useFriends", () => ({
  useFriends: () => mockUseFriendsReturn,
}));

vi.mock("@/hooks/usePendingRequestCount", () => ({
  usePendingRequestCount: () => mockPendingCount,
}));

vi.mock("@/lib/utils/friendUtils", () => ({
  filterFriendsByName: (friends: unknown[]) => friends,
}));

vi.mock("@/components/players/FriendRequestList", () => ({
  FriendRequestList: (props: { requests: unknown[] }) => (
    <div data-testid="friend-request-list" data-count={props.requests.length} />
  ),
}));

vi.mock("@/components/players/FriendSearchBar", () => ({
  FriendSearchBar: () => <div data-testid="friend-search-bar" />,
}));

vi.mock("@/components/friends/FriendsPageFriendCard", () => ({
  FriendsPageFriendCard: () => <div data-testid="friend-card" />,
}));

vi.mock("@/components/friends/FriendsEmptyState", () => ({
  FriendsEmptyState: () => <div data-testid="friends-empty-state" />,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

import { FriendsPageContent } from "@/components/friends/FriendsPageContent";

const mockFriend = {
  id: "friend-1",
  friendshipId: "fs-1",
  displayName: "Alice",
  avatarUrl: null,
  level: 5,
  acceptedAt: "2024-01-01T00:00:00Z",
};

const mockRequest = {
  friendshipId: "req-1",
  sender: { id: "sender-1", displayName: "Bob", avatarUrl: null },
  createdAt: "2024-01-01T00:00:00Z",
};

describe("FriendsPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "user-1" };
    mockAuthLoading = false;
    mockUseFriendsReturn = {
      friends: [],
      pendingRequests: [],
      friendCount: 0,
      isLoading: false,
      isLoadingMore: false,
      hasNextPage: false,
      error: null,
      sendRequest: vi.fn(),
      acceptRequest: vi.fn(),
      declineRequest: vi.fn(),
      removeFriend: vi.fn(),
      loadMore: vi.fn(),
      relationshipStatus: "none" as const,
      relationshipFriendshipId: null,
    };
    mockPendingCount = { count: 0, isLoading: false, decrement: vi.fn(), refresh: vi.fn() };

    global.IntersectionObserver = class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      constructor() {}
    } as unknown as typeof IntersectionObserver;
  });

  it("renders nothing when auth is loading", () => {
    mockAuthLoading = true;
    const { container } = render(<FriendsPageContent />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when user is not authenticated", () => {
    mockUser = null;
    const { container } = render(<FriendsPageContent />);
    expect(container.innerHTML).toBe("");
  });

  it("shows loading skeletons when friends are loading", () => {
    mockUseFriendsReturn.isLoading = true;
    render(<FriendsPageContent />);
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders translated title as h1", () => {
    render(<FriendsPageContent />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("title");
  });

  it("renders FriendRequestList when there are pending requests", () => {
    mockUseFriendsReturn.pendingRequests = [mockRequest];
    render(<FriendsPageContent />);
    expect(screen.getByTestId("friend-request-list")).toBeInTheDocument();
  });

  it("does NOT render FriendRequestList when no pending requests", () => {
    mockUseFriendsReturn.pendingRequests = [];
    render(<FriendsPageContent />);
    expect(screen.queryByTestId("friend-request-list")).not.toBeInTheDocument();
  });

  it("renders friend cards when friends exist", () => {
    mockUseFriendsReturn.friends = [mockFriend];
    mockUseFriendsReturn.friendCount = 1;
    render(<FriendsPageContent />);
    expect(screen.getByTestId("friend-card")).toBeInTheDocument();
  });

  it("renders empty state when no friends", () => {
    mockUseFriendsReturn.friends = [];
    mockUseFriendsReturn.friendCount = 0;
    render(<FriendsPageContent />);
    expect(screen.getByTestId("friends-empty-state")).toBeInTheDocument();
  });

  it("has ARIA section landmarks", () => {
    mockUseFriendsReturn.friends = [mockFriend];
    mockUseFriendsReturn.friendCount = 1;
    render(<FriendsPageContent />);
    const sections = screen.getAllByRole("region");
    expect(sections.length).toBeGreaterThanOrEqual(1);
    sections.forEach((section) => {
      expect(section).toHaveAttribute("aria-label");
    });
  });
});
