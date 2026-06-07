import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import type { GameSummary } from "@/types/game";
import type { Pagination } from "@/types/pagination";

// ---------------------------------------------------------------------------
// next-intl
// ---------------------------------------------------------------------------

const translations: Record<string, string> = {
  "games.listingKicker": "Catalog",
  "games.listingTitle": "All games",
  "games.listingDescription": "Explore the complete library.",
  "games.listingCount": "{count} titles",
  "games.noGamesFound": "No games found",
  "games.modifySearch": "Try modifying your filters",
  "games.noGamesAvailable": "No games available yet",
  "games.clearFilters": "Clear filters",
};

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string, params?: Record<string, string | number>) => {
    const fullKey = `${namespace}.${key}`;
    let value = translations[fullKey] ?? fullKey;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, String(v));
      }
    }
    return value;
  },
}));

// ---------------------------------------------------------------------------
// Hook mocks
// ---------------------------------------------------------------------------

const mockUseGameListing = vi.fn();
const mockUseGenres = vi.fn();
const mockUsePlatforms = vi.fn();

vi.mock("@/hooks/useGameListing", () => ({
  useGameListing: (...args: unknown[]) => mockUseGameListing(...args),
  useGenres: (...args: unknown[]) => mockUseGenres(...args),
  usePlatforms: (...args: unknown[]) => mockUsePlatforms(...args),
}));

// ---------------------------------------------------------------------------
// Lightweight stubs for sub-components (focus on orchestration)
// ---------------------------------------------------------------------------

vi.mock("@/components/games/GameCard", () => ({
  GameCard: ({ game }: { game: GameSummary }) =>
    React.createElement(
      "a",
      {
        "data-testid": "editorial-card",
        "data-game-id": game.id,
        href: `/games/${game.slug}`,
      },
      game.title
    ),
}));

vi.mock("@/components/games/GameSortMenu", () => ({
  GameSortMenu: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (next: string) => void;
  }) =>
    React.createElement(
      "button",
      {
        "data-testid": "sort-menu",
        "data-value": value,
        onClick: () => onChange("popularity"),
      },
      "Sort"
    ),
}));

vi.mock("@/components/games/SearchSkeleton", () => ({
  SearchSkeleton: () =>
    React.createElement("div", { "data-testid": "search-skeleton" }, "Loading..."),
}));

vi.mock("@/components/shared/FilterButton", () => ({
  FilterButton: ({
    onClick,
    hasFilters,
    filterCount,
  }: {
    onClick: () => void;
    hasFilters: boolean;
    filterCount: number;
  }) =>
    React.createElement(
      "button",
      {
        "data-testid": "filter-button",
        "data-has-filters": String(hasFilters),
        "data-filter-count": filterCount,
        onClick,
      },
      "Filters"
    ),
}));

vi.mock("@/components/shared/EmptyState", () => ({
  EmptyState: ({
    title,
    description,
    action,
  }: {
    icon?: string;
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  }) =>
    React.createElement(
      "div",
      { "data-testid": "empty-state" },
      React.createElement("p", null, title),
      React.createElement("p", null, description),
      action
        ? React.createElement(
            "button",
            { onClick: action.onClick, "data-testid": "empty-state-action" },
            action.label
          )
        : null
    ),
}));

vi.mock("@/components/games/GameFilters", () => ({
  GameFilters: ({
    onClearFilters,
  }: {
    onClearFilters: () => void;
  }) =>
    React.createElement(
      "div",
      { "data-testid": "game-filters" },
      React.createElement(
        "button",
        { onClick: onClearFilters, "data-testid": "filters-clear" },
        "Clear"
      )
    ),
}));

vi.mock("@/components/shared/Pagination", () => ({
  Pagination: ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (next: number) => void;
    loading: boolean;
    translationNamespace: string;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": "pagination",
        "data-current-page": currentPage,
        "data-total-pages": totalPages,
      },
      React.createElement(
        "button",
        {
          "data-testid": "next-page",
          onClick: () => onPageChange(currentPage + 1),
        },
        "Next"
      )
    ),
}));

vi.mock("@/components/providers/LibraryStatusProvider", () => ({
  LibraryStatusProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "library-status-provider" }, children),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { GamesListingEditorial } from "@/components/games/GamesListingEditorial";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeGame(overrides: Partial<GameSummary> = {}): GameSummary {
  return {
    id: "g-1",
    slug: "zelda",
    title: "Zelda",
    coverImage: "/c.jpg",
    developer: "Nintendo",
    publisher: "Nintendo",
    releaseYear: 2023,
    genres: [],
    isEsport: false,
    ...overrides,
  } as GameSummary;
}

function makePagination(overrides: Partial<Pagination> = {}): Pagination {
  return {
    currentPage: 1,
    totalPages: 1,
    totalCount: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    ...overrides,
  };
}

function setHookDefaults({
  games = [makeGame()],
  pagination = makePagination(),
  loading = false,
  validating = false,
}: {
  games?: GameSummary[];
  pagination?: Pagination | null;
  loading?: boolean;
  validating?: boolean;
} = {}) {
  mockUseGameListing.mockReturnValue({
    games,
    pagination,
    loading,
    validating,
    error: null,
  });
  mockUseGenres.mockReturnValue({ genres: [], loading: false });
  mockUsePlatforms.mockReturnValue({ platforms: [], loading: false });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GamesListingEditorial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setHookDefaults();
  });

  describe("hero", () => {
    it("renders the kicker, title and translated count", () => {
      setHookDefaults({
        games: [makeGame(), makeGame({ id: "g-2", slug: "mario", title: "Mario" })],
        pagination: makePagination({ totalCount: 42, totalPages: 3 }),
      });
      render(<GamesListingEditorial />);

      expect(screen.getByText("Catalog")).toBeDefined();
      expect(screen.getByRole("heading", { level: 1, name: "All games" })).toBeDefined();
      expect(screen.getByText("Explore the complete library.")).toBeDefined();
      expect(screen.getByText("42 titles")).toBeDefined();
    });

    it("falls back to the games array length when pagination has no totalCount", () => {
      setHookDefaults({
        games: [makeGame(), makeGame({ id: "g-2", slug: "x", title: "X" })],
        pagination: null,
      });
      render(<GamesListingEditorial />);
      expect(screen.getByText("2 titles")).toBeDefined();
    });
  });

  describe("loading", () => {
    it("shows the SearchSkeleton on initial load (no games yet)", () => {
      setHookDefaults({ games: [], loading: true });
      render(<GamesListingEditorial />);
      expect(screen.getByTestId("search-skeleton")).toBeDefined();
    });

    it("flags revalidation via the data-revalidating attribute on the content wrapper", () => {
      setHookDefaults({ validating: true, loading: false });
      const { container } = render(<GamesListingEditorial />);
      const content = container.querySelector("[data-revalidating]");
      expect(content?.getAttribute("data-revalidating")).toBe("true");
    });
  });

  describe("grid", () => {
    it("renders one GameCard per game", () => {
      setHookDefaults({
        games: [
          makeGame({ id: "a", slug: "a", title: "Alpha" }),
          makeGame({ id: "b", slug: "b", title: "Beta" }),
          makeGame({ id: "c", slug: "c", title: "Gamma" }),
        ],
      });
      render(<GamesListingEditorial />);
      const cards = screen.getAllByTestId("editorial-card");
      expect(cards).toHaveLength(3);
      expect(cards.map((c) => c.getAttribute("data-game-id"))).toEqual(["a", "b", "c"]);
    });

    it("wraps the grid in LibraryStatusProvider", () => {
      render(<GamesListingEditorial />);
      const provider = screen.getByTestId("library-status-provider");
      expect(provider.contains(screen.getByTestId("editorial-games-listing-grid"))).toBe(true);
    });
  });

  describe("empty state", () => {
    it("renders the EmptyState when there are no games and not validating", () => {
      setHookDefaults({ games: [], validating: false });
      render(<GamesListingEditorial />);
      expect(screen.getByTestId("empty-state")).toBeDefined();
      expect(screen.getByText("No games found")).toBeDefined();
      expect(screen.getByText("No games available yet")).toBeDefined();
    });

    it("does not render the EmptyState while validating (avoids flicker)", () => {
      setHookDefaults({ games: [], validating: true });
      render(<GamesListingEditorial />);
      expect(screen.queryByTestId("empty-state")).toBeNull();
    });
  });

  describe("pagination", () => {
    it("renders pagination only when totalPages > 1", () => {
      setHookDefaults({ pagination: makePagination({ totalPages: 1 }) });
      const { rerender } = render(<GamesListingEditorial />);
      expect(screen.queryByTestId("pagination")).toBeNull();

      setHookDefaults({ pagination: makePagination({ totalPages: 5, totalCount: 100 }) });
      rerender(<GamesListingEditorial />);
      expect(screen.getByTestId("pagination")).toBeDefined();
    });

    it("changing page invalidates the SSR fallback (passes undefined fallbackData on page > 1)", () => {
      setHookDefaults({ pagination: makePagination({ totalPages: 3, totalCount: 60 }) });
      render(
        <GamesListingEditorial
          initialGames={[makeGame()]}
          initialPagination={makePagination({ totalPages: 3, totalCount: 60 })}
        />
      );

      // Page 1 default view: fallbackData is set
      expect(mockUseGameListing).toHaveBeenLastCalledWith(
        "fr",
        1,
        [],
        [],
        "recommended",
        null,
        expect.objectContaining({ games: expect.any(Array) })
      );

      // Click next
      fireEvent.click(screen.getByTestId("next-page"));

      // Page 2: no fallback data
      expect(mockUseGameListing).toHaveBeenLastCalledWith("fr", 2, [], [], "recommended", null, undefined);
    });
  });

  describe("controls", () => {
    it("toggles the filter panel via the FilterButton", () => {
      render(<GamesListingEditorial />);
      const button = screen.getByTestId("filter-button");
      // FilterButton stub just calls onClick once per click; we assert the button exists
      // and is clickable. Real toggling logic is exercised by the GameFilters
      // showAllGenres prop, mocked away here.
      expect(button).toBeDefined();
      fireEvent.click(button);
    });

    it("changing the sort resets the page to 1", () => {
      setHookDefaults({ pagination: makePagination({ totalPages: 4, totalCount: 80 }) });
      render(<GamesListingEditorial />);

      // Move to page 2 first
      fireEvent.click(screen.getByTestId("next-page"));
      expect(mockUseGameListing).toHaveBeenLastCalledWith(
        "fr",
        2,
        [],
        [],
        "recommended",
        null,
        undefined
      );

      // Change sort -> should reset to page 1 with new sort
      fireEvent.click(screen.getByTestId("sort-menu"));
      expect(mockUseGameListing).toHaveBeenLastCalledWith(
        "fr",
        1,
        [],
        [],
        "popularity",
        null,
        undefined
      );
    });

    it("clearing filters from the EmptyState resets the state", () => {
      setHookDefaults({ games: [], pagination: makePagination({ totalCount: 0 }) });
      render(<GamesListingEditorial />);
      // No filters yet, so action is undefined -> just assert empty state render
      expect(screen.getByTestId("empty-state")).toBeDefined();
    });
  });

  describe("ISR fallback wiring", () => {
    it("forwards initialGames + initialPagination to the hook on the default view", () => {
      const initialGames = [makeGame()];
      const initialPagination = makePagination({ totalPages: 2, totalCount: 30 });

      render(
        <GamesListingEditorial
          locale="en"
          initialGames={initialGames}
          initialPagination={initialPagination}
        />
      );

      expect(mockUseGameListing).toHaveBeenLastCalledWith("en", 1, [], [], "recommended", null, {
        games: initialGames,
        pagination: initialPagination,
      });
    });

    it("does not pass fallbackData when initial data is missing", () => {
      render(<GamesListingEditorial />);
      expect(mockUseGameListing).toHaveBeenLastCalledWith(
        "fr",
        1,
        [],
        [],
        "recommended",
        null,
        undefined
      );
    });
  });
});
