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
  collections: [] as Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isPublic: boolean;
    gamesCount: number;
    updatedAt: string;
    coverImages: string[];
    coverImageUrl: string | null;
  }>,
  stats: null as null | {
    totalCollections: number;
    totalGames: number;
    largestCollection: string | null;
  },
  isLoading: false,
  isLoadingMore: false,
  hasNextPage: false,
  sortOption: "updated_at_desc" as const,
  error: null as string | null,
  setSort: vi.fn(),
  loadMore: vi.fn(),
};

const mockUsePlayerCollections = vi.fn(() => mockHookReturn);

vi.mock("@/hooks/usePlayerCollections", () => ({
  usePlayerCollections: (...args: unknown[]) => mockUsePlayerCollections(...args),
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

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("img", { src: props.src as string, alt: props.alt as string }),
}));

import { PlayerCollectionsFeed } from "@/components/players/PlayerCollectionsFeed";

const SAMPLE_COLLECTION = {
  id: "col-1",
  name: "RPG Favorites",
  slug: "rpg-favorites",
  description: "My favorite RPGs",
  isPublic: true,
  gamesCount: 12,
  updatedAt: "2024-03-01T12:00:00Z",
  coverImages: ["/covers/zelda.jpg"],
  coverImageUrl: null,
};

const SAMPLE_STATS = {
  totalCollections: 5,
  totalGames: 42,
  largestCollection: "RPG Favorites",
};

function setHookState(overrides: Partial<typeof mockHookReturn>) {
  mockUsePlayerCollections.mockReturnValue({ ...mockHookReturn, ...overrides });
}

describe("PlayerCollectionsFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlayerCollections.mockReturnValue({ ...mockHookReturn });
  });

  it("renders collections when data is available", () => {
    setHookState({ collections: [SAMPLE_COLLECTION], stats: SAMPLE_STATS });
    render(<PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />);
    // "RPG Favorites" appears in both stats and card — use getAllByText
    const matches = screen.getAllByText("RPG Favorites");
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // Verify the collection card link is rendered
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/fr/players/player-1/collections/rpg-favorites"
    );
  });

  it("shows empty state when no collections", () => {
    setHookState({ collections: [], isLoading: false });
    render(<PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />);
    expect(screen.getByText("empty")).toBeInTheDocument();
  });

  it("shows skeleton during initial loading", () => {
    setHookState({ isLoading: true });
    const { container } = render(
      <PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />
    );
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("has role='feed' with correct aria-label", () => {
    render(<PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />);
    const feed = screen.getByRole("feed");
    expect(feed).toBeInTheDocument();
    expect(feed).toHaveAttribute("aria-label", "ariaLabel");
  });

  it("sets aria-busy to false when not loading", () => {
    setHookState({ isLoading: false, isLoadingMore: false });
    render(<PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />);
    expect(screen.getByRole("feed")).toHaveAttribute("aria-busy", "false");
  });

  it("sets aria-busy to true during initial loading", () => {
    setHookState({ isLoading: true });
    render(<PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />);
    expect(screen.getByRole("feed")).toHaveAttribute("aria-busy", "true");
  });

  it("sets aria-busy to true when loading more", () => {
    setHookState({ collections: [SAMPLE_COLLECTION], isLoadingMore: true });
    render(<PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />);
    expect(screen.getByRole("feed")).toHaveAttribute("aria-busy", "true");
  });

  it("shows sort selector when collections exist", () => {
    setHookState({ collections: [SAMPLE_COLLECTION], stats: SAMPLE_STATS });
    render(<PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />);
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
  });

  it("renders responsive grid with correct CSS classes", () => {
    setHookState({ collections: [SAMPLE_COLLECTION], stats: SAMPLE_STATS });
    const { container } = render(
      <PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />
    );
    const grid = container.querySelector(".grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-4");
    expect(grid).toBeInTheDocument();
  });
});
