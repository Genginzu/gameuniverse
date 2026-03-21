import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// IntersectionObserver stub for jsdom
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor() {}
}
globalThis.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

const mockHookReturn = {
  reviews: [] as Array<{
    id: string;
    gameId: string;
    gameSlug: string;
    gameName: string;
    gameCoverUrl: string | null;
    rating: number;
    content: string;
    positivePoints: string[];
    negativePoints: string[];
    createdAt: string;
    updatedAt: string;
  }>,
  stats: null as null | {
    totalCount: number;
    averageRating: number | null;
    distribution: Array<{ range: string; count: number; percentage: number }>;
  },
  isLoading: false,
  isLoadingMore: false,
  hasNextPage: false,
  sortOption: "date_desc" as const,
  error: null as string | null,
  setSort: vi.fn(),
  loadMore: vi.fn(),
};

const mockUsePlayerReviews = vi.fn(() => mockHookReturn);

vi.mock("@/hooks/usePlayerReviews", () => ({
  usePlayerReviews: (...args: unknown[]) => mockUsePlayerReviews(...args),
}));

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

import { PlayerReviewsFeed } from "@/components/players/reviews/PlayerReviewsFeed";

const SAMPLE_REVIEW = {
  id: "review-1",
  gameId: "game-1",
  gameSlug: "zelda",
  gameName: "Zelda",
  gameCoverUrl: "/covers/zelda.jpg",
  rating: 18,
  content: "<p>Excellent game</p>",
  positivePoints: ["Great story"],
  negativePoints: ["Too short"],
  createdAt: "2024-03-01T12:00:00Z",
  updatedAt: "2024-03-01T12:00:00Z",
};

const SAMPLE_STATS = {
  totalCount: 1,
  averageRating: 18,
  distribution: [
    { range: "0-5", count: 0, percentage: 0 },
    { range: "6-10", count: 0, percentage: 0 },
    { range: "11-15", count: 0, percentage: 0 },
    { range: "16-20", count: 1, percentage: 100 },
  ],
};

function setHookState(overrides: Partial<typeof mockHookReturn>) {
  mockUsePlayerReviews.mockReturnValue({ ...mockHookReturn, ...overrides });
}

describe("PlayerReviewsFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlayerReviews.mockReturnValue({ ...mockHookReturn });
  });

  it("renders reviews when data is available", () => {
    setHookState({ reviews: [SAMPLE_REVIEW], stats: SAMPLE_STATS });
    render(<PlayerReviewsFeed playerId="player-1" locale="fr" />);
    expect(screen.getByText("Zelda")).toBeInTheDocument();
  });

  it("shows empty state when no reviews", () => {
    setHookState({ reviews: [], isLoading: false });
    render(<PlayerReviewsFeed playerId="player-1" locale="fr" />);
    expect(screen.getByText("empty")).toBeInTheDocument();
  });

  it("shows skeleton during loading", () => {
    setHookState({ isLoading: true });
    const { container } = render(<PlayerReviewsFeed playerId="player-1" locale="fr" />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("has correct ARIA attributes", () => {
    render(<PlayerReviewsFeed playerId="player-1" locale="fr" />);
    const feed = screen.getByRole("feed");
    expect(feed).toBeInTheDocument();
    expect(feed).toHaveAttribute("aria-label", "feedLabel");
    expect(feed).toHaveAttribute("aria-busy", "false");
  });

  it("shows sort selector when reviews exist", () => {
    setHookState({ reviews: [SAMPLE_REVIEW], stats: SAMPLE_STATS });
    render(<PlayerReviewsFeed playerId="player-1" locale="fr" />);
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
  });

  it("sets aria-busy to true when loading", () => {
    setHookState({ isLoading: true });
    render(<PlayerReviewsFeed playerId="player-1" locale="fr" />);
    expect(screen.getByRole("feed")).toHaveAttribute("aria-busy", "true");
  });
});
