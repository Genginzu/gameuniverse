import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSWRConfig, type ScopedMutator } from "swr";

import { createSWRWrapper } from "@/test-helpers/swr-wrapper";
import type { GameSummary, GamesApiResponse } from "@/types/game";
import type { Pagination } from "@/types/pagination";

const mocks = vi.hoisted(() => ({ fetcher: vi.fn() }));

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
  useTranslations:
    (namespace: string) => (key: string, params?: Record<string, string | number>) => {
      let value = translations[`${namespace}.${key}`] ?? `${namespace}.${key}`;
      for (const [k, v] of Object.entries(params ?? {})) value = value.replace(`{${k}}`, String(v));
      return value;
    },
}));

vi.mock("@/lib/swr/fetcher", () => ({ fetcher: (url: string) => mocks.fetcher(url) }));

vi.mock("@/components/games/GameCard", () => ({
  GameCard: ({ game }: { game: GameSummary }) =>
    React.createElement(
      "a",
      { "data-testid": "editorial-card", "data-game-id": game.id },
      game.title
    ),
}));

vi.mock("@/components/games/GameSortMenu", () => ({
  GameSortMenu: ({ value, onChange }: { value: string; onChange: (next: string) => void }) =>
    React.createElement(
      "button",
      { "data-testid": "sort-menu", "data-value": value, onClick: () => onChange("popularity") },
      "Sort"
    ),
}));

vi.mock("@/components/shared/FilterButton", () => ({
  FilterButton: ({ hasFilters, filterCount }: { hasFilters: boolean; filterCount: number }) =>
    React.createElement("button", {
      "data-testid": "filter-button",
      "data-has-filters": String(hasFilters),
      "data-filter-count": filterCount,
    }),
}));

vi.mock("@/components/shared/EmptyState", () => ({
  EmptyState: ({
    title,
    description,
    action,
  }: {
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
            { onClick: action.onClick, "data-testid": "empty-action" },
            action.label
          )
        : null
    ),
}));

vi.mock("@/components/games/GameFilters", () => ({
  GameFilters: ({
    onGenreChange,
    onEsportChange,
    onClearFilters,
  }: {
    onGenreChange: (next: string[]) => void;
    onEsportChange: (next: boolean | null) => void;
    onClearFilters: () => void;
  }) =>
    React.createElement(
      "div",
      { "data-testid": "game-filters" },
      React.createElement("button", {
        onClick: () => onGenreChange(["RPG"]),
        "data-testid": "pick-genre",
      }),
      React.createElement("button", {
        onClick: () => onEsportChange(true),
        "data-testid": "pick-esport",
      }),
      React.createElement("button", { onClick: onClearFilters, "data-testid": "filters-clear" })
    ),
}));

vi.mock("@/components/shared/Pagination", () => ({
  Pagination: ({
    currentPage,
    onPageChange,
  }: {
    currentPage: number;
    onPageChange: (next: number) => void;
  }) =>
    React.createElement("button", {
      "data-testid": "next-page",
      onClick: () => onPageChange(currentPage + 1),
    }),
}));

vi.mock("@/components/providers/LibraryStatusProvider", () => ({
  LibraryStatusProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "library-status-provider" }, children),
}));

import { GamesListingEditorial } from "@/components/games/GamesListingEditorial";
import { gamesListing } from "@/lib/listing/resources/games";
import { buildDefaultListingUrl } from "@/lib/listing/url";

function makeGame(overrides: Partial<GameSummary> = {}): GameSummary {
  return {
    id: "g-1",
    slug: "zelda",
    title: "Zelda",
    genres: [],
    developer: "",
    publisher: "",
    ...overrides,
  };
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

function respond(
  listing: GamesApiResponse | { games: GameSummary[]; pagination: null } | "pending"
) {
  mocks.fetcher.mockImplementation((url: string) => {
    if (url.startsWith("/api/genres")) return Promise.resolve({ genres: [] });
    if (url.startsWith("/api/platforms")) return Promise.resolve({ platforms: [] });
    return listing === "pending" ? new Promise(() => {}) : Promise.resolve(listing);
  });
}

const gamesUrls = () =>
  mocks.fetcher.mock.calls
    .map((call) => String(call[0]))
    .filter((url) => url.startsWith("/api/games"));

let swrMutate: ScopedMutator;
function CaptureMutate() {
  swrMutate = useSWRConfig().mutate;
  return null;
}

function renderListing(props: React.ComponentProps<typeof GamesListingEditorial> = {}) {
  return render(
    <>
      <CaptureMutate />
      <GamesListingEditorial {...props} />
    </>,
    { wrapper: createSWRWrapper() }
  );
}

describe("GamesListingEditorial", () => {
  beforeEach(() => {
    mocks.fetcher.mockReset();
    window.scrollTo = vi.fn();
    respond({ games: [makeGame()], pagination: makePagination() });
  });

  it("renders the hero with the translated total count", async () => {
    respond({ games: [makeGame()], pagination: makePagination({ totalCount: 42, totalPages: 3 }) });
    renderListing();
    expect(await screen.findByText("42 titles")).toBeDefined();
    expect(screen.getByText("Catalog")).toBeDefined();
    expect(screen.getByRole("heading", { level: 1, name: "All games" })).toBeDefined();
  });

  it("falls back to the games array length when pagination is missing", async () => {
    respond({ games: [makeGame(), makeGame({ id: "g-2" })], pagination: null });
    renderListing();
    expect(await screen.findByText("2 titles")).toBeDefined();
  });

  it("shows the listing skeleton on the initial load", () => {
    respond("pending");
    renderListing();
    expect(screen.getByTestId("games-listing-skeleton")).toBeDefined();
  });

  it("renders one GameCard per game inside LibraryStatusProvider", async () => {
    respond({
      games: [makeGame({ id: "a" }), makeGame({ id: "b" }), makeGame({ id: "c" })],
      pagination: makePagination(),
    });
    renderListing();
    const cards = await screen.findAllByTestId("editorial-card");
    expect(cards.map((c) => c.getAttribute("data-game-id"))).toEqual(["a", "b", "c"]);
    expect(
      screen
        .getByTestId("library-status-provider")
        .contains(screen.getByTestId("editorial-games-listing-grid"))
    ).toBe(true);
  });

  it("flags background revalidation on the content wrapper", async () => {
    const { container } = renderListing();
    await screen.findAllByTestId("editorial-card");
    respond("pending");

    act(() => {
      void swrMutate(buildDefaultListingUrl(gamesListing, { locale: "fr" }));
    });

    await waitFor(() =>
      expect(
        container.querySelector("[data-revalidating]")?.getAttribute("data-revalidating")
      ).toBe("true")
    );
  });

  it("renders the EmptyState when there are no games", async () => {
    respond({ games: [], pagination: makePagination({ totalCount: 0 }) });
    renderListing();
    expect(await screen.findByTestId("empty-state")).toBeDefined();
    expect(screen.getByText("No games available yet")).toBeDefined();
  });

  it("renders the EmptyState straight from an empty ISR payload", () => {
    respond("pending");
    renderListing({ initialData: { games: [], pagination: makePagination({ totalCount: 0 }) } });
    expect(screen.getByTestId("empty-state")).toBeDefined();
    expect(gamesUrls()).toHaveLength(0);
  });

  it("serves the ISR payload on the default view without refetching it", async () => {
    respond("pending");
    renderListing({
      locale: "en",
      initialData: { games: [makeGame({ id: "ssr" })], pagination: makePagination() },
    });

    expect(screen.getByTestId("editorial-card").getAttribute("data-game-id")).toBe("ssr");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(gamesUrls()).toHaveLength(0);
  });

  it("requests the next page and resets to page 1 when the sort changes", async () => {
    respond({ games: [makeGame()], pagination: makePagination({ totalPages: 4, totalCount: 80 }) });
    renderListing();

    fireEvent.click(await screen.findByTestId("next-page"));
    await waitFor(() => expect(gamesUrls().some((url) => url.includes("page=2"))).toBe(true));
    expect(window.scrollTo).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("sort-menu"));
    await waitFor(() =>
      expect(gamesUrls()).toContain(
        "/api/games?locale=fr&page=1&limit=20&fields=description&sort=popularity"
      )
    );
  });

  it("sends selected filters and keeps the filter count consistent with hasFilters", async () => {
    renderListing();

    fireEvent.click(await screen.findByTestId("pick-genre"));
    fireEvent.click(screen.getByTestId("pick-esport"));

    await waitFor(() =>
      expect(gamesUrls()).toContain(
        "/api/games?locale=fr&page=1&limit=20&fields=description&genres=RPG&esport=true"
      )
    );
    const button = screen.getByTestId("filter-button");
    expect(button.getAttribute("data-has-filters")).toBe("true");
    expect(button.getAttribute("data-filter-count")).toBe("2");

    fireEvent.click(screen.getByTestId("filters-clear"));
    expect(button.getAttribute("data-has-filters")).toBe("false");
    expect(button.getAttribute("data-filter-count")).toBe("0");
  });
});
