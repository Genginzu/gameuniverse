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

const SAMPLE_EVENT: ActivityEvent = {
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
};

const SAMPLE_EVENTS: ActivityEvent[] = [
  SAMPLE_EVENT,
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
    render(<ActivityFeed playerId="p1" locale="fr" />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("should show empty state when no events and not loading", () => {
    setHookState({ events: [], isLoading: false });
    render(<ActivityFeed playerId="p1" locale="fr" />);
    expect(screen.getByText("empty")).toBeInTheDocument();
  });

  it("should show skeleton during initial loading", () => {
    setHookState({ isLoading: true });
    const { container } = render(<ActivityFeed playerId="p1" locale="fr" />);
    // No articles should be visible during loading
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    // Skeleton renders animated placeholder divs
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should have role='feed' on the feed container", () => {
    render(<ActivityFeed playerId="p1" locale="fr" />);
    expect(screen.getByRole("feed")).toBeInTheDocument();
  });

  it("should set aria-busy=true while loading", () => {
    setHookState({ isLoading: true });
    render(<ActivityFeed playerId="p1" locale="fr" />);
    expect(screen.getByRole("feed")).toHaveAttribute("aria-busy", "true");
  });

  it("should set aria-busy=false when not loading", () => {
    setHookState({ isLoading: false, isLoadingMore: false });
    render(<ActivityFeed playerId="p1" locale="fr" />);
    expect(screen.getByRole("feed")).toHaveAttribute("aria-busy", "false");
  });

  it("should have aria-label on the feed", () => {
    render(<ActivityFeed playerId="p1" locale="fr" />);
    expect(screen.getByRole("feed")).toHaveAttribute("aria-label", "feedLabel");
  });

  it("should render filter buttons", () => {
    render(<ActivityFeed playerId="p1" locale="fr" />);
    // ActivityFilters renders a group of buttons
    const filterGroup = screen.getByRole("group");
    expect(filterGroup).toBeInTheDocument();
    // 7 filter buttons: all, review, comment, library, playtime, favorite, collection
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(7);
  });

  it("should pass playerId and locale to the hook", () => {
    render(<ActivityFeed playerId="player-42" locale="en" />);
    expect(mockUsePlayerActivity).toHaveBeenCalledWith("player-42", "en");
  });

  it("should display error message when error occurs", () => {
    setHookState({ error: "Network error" });
    render(<ActivityFeed playerId="p1" locale="fr" />);
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });
});
