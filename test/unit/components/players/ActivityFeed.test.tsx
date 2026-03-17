import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import type { ActivityEvent } from "@/types/activity";
import type { UsePlayerActivityReturn } from "@/hooks/usePlayerActivity";

// IntersectionObserver stub for jsdom
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor() {}
}
globalThis.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

const mockHookReturn: UsePlayerActivityReturn = {
  events: [],
  isLoading: false,
  isLoadingMore: false,
  hasNextPage: false,
  activeFilter: "all",
  error: null,
  setFilter: vi.fn(),
  loadMore: vi.fn(),
};

const mockUsePlayerActivity = vi.fn(() => mockHookReturn);

vi.mock("@/hooks/usePlayerActivity", () => ({
  usePlayerActivity: (...args: unknown[]) => mockUsePlayerActivity(...args),
}));

vi.mock("@/hooks/usePlayerPosts", () => ({
  usePlayerPosts: () => ({
    posts: [],
    isLoading: false,
    isLoadingMore: false,
    isCreating: false,
    hasNextPage: false,
    error: null,
    searchTerm: "",
    setSearchTerm: vi.fn(),
    loadMore: vi.fn(),
    createPost: vi.fn(),
    deletePost: vi.fn(),
  }),
}));

// Override the global next-intl mock to add useFormatter and t.rich support
vi.mock("next-intl", () => {
  const createTranslator = () => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    t.raw = (key: string) => key;
    t.markup = (key: string) => key;
    t.has = () => true;
    return t;
  };
  return {
    useTranslations: () => createTranslator(),
    useLocale: () => "fr",
    useMessages: () => ({}),
    useFormatter: () => ({
      relativeTime: () => "il y a 2 heures",
      dateTime: () => "01/03/2024",
      number: (n: number) => String(n),
    }),
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { ActivityFeed } from "@/components/players/ActivityFeed";

const SAMPLE_EVENTS: ActivityEvent[] = [
  {
    id: "evt-1",
    type: "review",
    date: "2024-03-01T12:00:00Z",
    data: {
      type: "review",
      gameId: "g1",
      gameSlug: "zelda",
      gameName: "Zelda",
      rating: 18,
      contentExcerpt: "Excellent jeu",
    },
  },
  {
    id: "evt-2",
    type: "comment",
    date: "2024-02-28T10:00:00Z",
    data: {
      type: "comment",
      characterId: "c1",
      characterSlug: "link",
      characterName: "Link",
      contentExcerpt: "Super personnage",
    },
  },
];

const defaultProps = {
  playerId: "p1",
  playerName: "TestPlayer",
  playerAvatar: null,
  locale: "fr",
  isOwner: false,
};

function setHookState(overrides: Partial<UsePlayerActivityReturn>) {
  mockUsePlayerActivity.mockReturnValue({ ...mockHookReturn, ...overrides });
}

describe("ActivityFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlayerActivity.mockReturnValue({ ...mockHookReturn });
  });

  it("should render events when data is available", () => {
    setHookState({ events: SAMPLE_EVENTS });
    render(<ActivityFeed {...defaultProps} />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("should show empty state when no events and not loading", () => {
    setHookState({ events: [], isLoading: false });
    render(<ActivityFeed {...defaultProps} />);
    // Both activity and posts columns show empty state
    const emptyTexts = screen.getAllByText("empty");
    expect(emptyTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("should show skeleton during initial loading", () => {
    setHookState({ isLoading: true });
    const { container } = render(<ActivityFeed {...defaultProps} />);
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should have role='feed' on the feed containers", () => {
    render(<ActivityFeed {...defaultProps} />);
    // Two columns: activity feed + posts feed
    const feeds = screen.getAllByRole("feed");
    expect(feeds.length).toBe(2);
  });

  it("should set aria-busy=true on activity feed while loading", () => {
    setHookState({ isLoading: true });
    render(<ActivityFeed {...defaultProps} />);
    const feeds = screen.getAllByRole("feed");
    // First feed is the activity column
    expect(feeds[0]).toHaveAttribute("aria-busy", "true");
  });

  it("should set aria-busy=false when not loading", () => {
    setHookState({ isLoading: false, isLoadingMore: false });
    render(<ActivityFeed {...defaultProps} />);
    const feeds = screen.getAllByRole("feed");
    expect(feeds[0]).toHaveAttribute("aria-busy", "false");
  });

  it("should have aria-label on the feed containers", () => {
    render(<ActivityFeed {...defaultProps} />);
    const feeds = screen.getAllByRole("feed");
    expect(feeds[0]).toHaveAttribute("aria-label", "feedLabel");
  });

  it("should pass playerId and locale to the activity hook", () => {
    render(<ActivityFeed {...defaultProps} playerId="player-42" locale="en" />);
    expect(mockUsePlayerActivity).toHaveBeenCalledWith("player-42", "en");
  });

  it("should display error message when error occurs", () => {
    setHookState({ error: "Network error" });
    render(<ActivityFeed {...defaultProps} />);
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });
});
