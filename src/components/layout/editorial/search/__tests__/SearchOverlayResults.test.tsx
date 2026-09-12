import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import type { GlobalSearchResponse } from "@/types/global-search";

// Mock @/i18n/navigation
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) =>
    React.createElement(
      "a",
      { href, className, "data-testid": `link-${href}` },
      children
    ),
}));

// Mock next-intl with passthrough + interpolation
const editorialTranslations: Record<string, string> = {
  "globalSearch.overlay.resultsAriaLabel": "Search results",
  "globalSearch.overlay.noResults": "No results for “{query}”",
  "globalSearch.overlay.noResultsHint": "Try different keywords.",
  "globalSearch.overlay.seeAll": "See all {category} for “{query}” →",
  "globalSearch.overlay.groups.games": "Games",
  "globalSearch.overlay.groups.characters": "Characters",
  "globalSearch.overlay.groups.players": "Players",
  "globalSearch.overlay.groups.teams": "Esport teams",
  "globalSearch.overlay.groups.proPlayers": "Pro players",
  "globalSearch.overlay.groups.coaches": "Coaches",
};
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string, params?: Record<string, string>) => {
    const fullKey = `${namespace}.${key}`;
    let value = editorialTranslations[fullKey] ?? fullKey;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, v);
      }
    }
    return value;
  },
}));

import { SearchOverlayResults } from "@/components/layout/editorial/search/SearchOverlayResults";

function emptyResponse(): GlobalSearchResponse {
  return {
    games: [],
    characters: [],
    players: [],
    teams: [],
    proPlayers: [],
    coaches: [],
    counts: {
      games: 0,
      characters: 0,
      players: 0,
      teams: 0,
      proPlayers: 0,
      coaches: 0,
    },
  };
}

describe("SearchOverlayResults", () => {
  it("renders nothing when results is null", () => {
    const { container } = render(
      <SearchOverlayResults
        results={null}
        activeIndex={-1}
        query="zelda"
        onSelect={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the empty-results message when no group has any item", () => {
    render(
      <SearchOverlayResults
        results={emptyResponse()}
        activeIndex={-1}
        query="absolutely-nothing"
        onSelect={() => {}}
      />
    );
    expect(screen.getByText('No results for “absolutely-nothing”')).toBeDefined();
    expect(screen.getByText("Try different keywords.")).toBeDefined();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("renders one group per non-empty category, in canonical order", () => {
    const response: GlobalSearchResponse = {
      games: [{ id: "g1", slug: "z", title: "Zelda", source: "local" }],
      characters: [{ id: "c1", slug: "link", name: "Link" }],
      players: [],
      teams: [{ id: 100, name: "G2", slug: "g2" }],
      proPlayers: [],
      coaches: [
        { id: "c1", username: "topcoach", averageRating: 4.5, totalReviews: 10, isVerified: true },
      ],
      counts: { games: 1, characters: 1, players: 0, teams: 1, proPlayers: 0, coaches: 1 },
    };

    const { container } = render(
      <SearchOverlayResults
        results={response}
        activeIndex={-1}
        query="zelda"
        onSelect={() => {}}
      />
    );

    // 4 groups should be rendered (games, characters, teams, coaches)
    const groups = container.querySelectorAll(".search-overlay-group");
    expect(groups).toHaveLength(4);

    const groupKeys = Array.from(groups).map((g) => g.getAttribute("data-group"));
    expect(groupKeys).toEqual(["games", "characters", "teams", "coaches"]);
  });

  it("does not render the players or proPlayers group when those arrays are empty", () => {
    const response: GlobalSearchResponse = {
      games: [{ id: "g1", slug: "z", title: "Zelda", source: "local" }],
      characters: [],
      players: [],
      teams: [],
      proPlayers: [],
      coaches: [],
      counts: { games: 1, characters: 0, players: 0, teams: 0, proPlayers: 0, coaches: 0 },
    };

    const { container } = render(
      <SearchOverlayResults
        results={response}
        activeIndex={-1}
        query="zelda"
        onSelect={() => {}}
      />
    );

    expect(container.querySelector('[data-group="players"]')).toBeNull();
    expect(container.querySelector('[data-group="proPlayers"]')).toBeNull();
  });

  it("renders the listbox role with the i18n aria-label", () => {
    const response: GlobalSearchResponse = {
      ...emptyResponse(),
      games: [{ id: "g1", slug: "z", title: "Zelda", source: "local" }],
    };
    response.counts.games = 1;

    render(
      <SearchOverlayResults
        results={response}
        activeIndex={-1}
        query="zelda"
        onSelect={() => {}}
      />
    );
    expect(screen.getByRole("listbox", { name: "Search results" })).toBeDefined();
  });

  it("calls onSelect with the right item when an item is clicked", () => {
    const response: GlobalSearchResponse = {
      ...emptyResponse(),
      games: [{ id: "g1", slug: "zelda", title: "Zelda", source: "local" }],
    };
    response.counts.games = 1;

    const onSelect = vi.fn();
    render(
      <SearchOverlayResults
        results={response}
        activeIndex={-1}
        query="zelda"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText("Zelda"));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ type: "game", slug: "zelda" })
    );
  });

  it("marks the active item with aria-selected=true", () => {
    const response: GlobalSearchResponse = {
      ...emptyResponse(),
      games: [
        { id: "g1", slug: "a", title: "A", source: "local" },
        { id: "g2", slug: "b", title: "B", source: "local" },
      ],
    };
    response.counts.games = 2;

    render(
      <SearchOverlayResults
        results={response}
        activeIndex={1}
        query="x"
        onSelect={() => {}}
      />
    );

    const options = screen.getAllByRole("option");
    expect(options[0].getAttribute("aria-selected")).toBe("false");
    expect(options[1].getAttribute("aria-selected")).toBe("true");
  });

  it('"See all" link points to /games?q=... for the games group', () => {
    const response: GlobalSearchResponse = {
      ...emptyResponse(),
      games: [{ id: "g1", slug: "zelda", title: "Zelda", source: "local" }],
    };
    response.counts.games = 1;

    render(
      <SearchOverlayResults
        results={response}
        activeIndex={-1}
        query="zelda BOTW"
        onSelect={() => {}}
      />
    );

    const link = screen.getByTestId("link-/games?q=zelda%20BOTW");
    expect(link).toBeDefined();
  });

  it('"See all" link points to /esport/teams for the teams group', () => {
    const response: GlobalSearchResponse = {
      ...emptyResponse(),
      teams: [{ id: 100, name: "G2", slug: "g2" }],
    };
    response.counts.teams = 1;

    render(
      <SearchOverlayResults
        results={response}
        activeIndex={-1}
        query="g2"
        onSelect={() => {}}
      />
    );
    expect(screen.getByTestId("link-/esport/teams?q=g2")).toBeDefined();
  });

  it('"See all" link points to /coaching for the coaches group', () => {
    const response: GlobalSearchResponse = {
      ...emptyResponse(),
      coaches: [
        { id: "c1", username: "topcoach", averageRating: 4.5, totalReviews: 10, isVerified: true },
      ],
    };
    response.counts.coaches = 1;

    render(
      <SearchOverlayResults
        results={response}
        activeIndex={-1}
        query="top"
        onSelect={() => {}}
      />
    );
    expect(screen.getByTestId("link-/coaching?q=top")).toBeDefined();
  });
});
