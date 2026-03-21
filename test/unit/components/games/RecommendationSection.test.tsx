import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import type { GameRecommendation } from "@/types/recommendation";

// Mock useRecommendations hook
const mockUseRecommendations = vi.fn();
vi.mock("@/hooks/useRecommendations", () => ({
  useRecommendations: (...args: unknown[]) => mockUseRecommendations(...args),
}));

// Mock useAuth (used by GameCard)
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

// Mock useGameLibraryStatus (used by GameCard)
vi.mock("@/hooks/useGameLibraryStatus", () => ({
  useGameLibraryStatus: () => ({
    inLibrary: false,
    loading: false,
    adding: false,
    addToLibrary: vi.fn(),
    removeFromLibrary: vi.fn(),
  }),
}));

import { RecommendationSection } from "@/components/games/details/RecommendationSection";

const mockRecommendations: GameRecommendation[] = [
  {
    id: "game-1",
    slug: "zelda-totk",
    title: "Zelda TOTK",
    coverImage: "https://example.com/zelda.jpg",
    genres: [{ id: "g1", name: "Action" }],
    developer: "Nintendo",
    combinedScore: 0.95,
  },
  {
    id: "game-2",
    slug: "elden-ring",
    title: "Elden Ring",
    coverImage: null,
    genres: [{ id: "g2", name: "RPG" }],
    developer: "FromSoftware",
    combinedScore: 0.88,
  },
];

describe("RecommendationSection", () => {
  beforeEach(() => {
    mockUseRecommendations.mockReset();
  });

  it("renders skeleton placeholders while loading", () => {
    mockUseRecommendations.mockReturnValue({
      recommendations: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = render(<RecommendationSection gameSlug="test-game" />);

    // Title should be visible
    expect(screen.getByText("title")).toBeDefined();

    // Skeletons should be rendered (5 skeleton cards — matches MAX_RECOMMENDATIONS)
    const skeletons = container.querySelectorAll(".aspect-3\\/4");
    expect(skeletons.length).toBe(5);
  });

  it("renders empty message when no recommendations", () => {
    mockUseRecommendations.mockReturnValue({
      recommendations: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<RecommendationSection gameSlug="test-game" />);

    expect(screen.getByText("title")).toBeDefined();
    expect(screen.getByText("empty")).toBeDefined();
  });

  it("renders game cards when recommendations are available", () => {
    mockUseRecommendations.mockReturnValue({
      recommendations: mockRecommendations,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<RecommendationSection gameSlug="test-game" locale="fr" />);

    expect(screen.getByText("title")).toBeDefined();
    expect(screen.getByText("Zelda TOTK")).toBeDefined();
    expect(screen.getByText("Elden Ring")).toBeDefined();
  });

  it("renders nothing when there is an error", () => {
    mockUseRecommendations.mockReturnValue({
      recommendations: [],
      loading: false,
      error: "Failed to fetch",
      refetch: vi.fn(),
    });

    const { container } = render(<RecommendationSection gameSlug="test-game" />);

    // Component returns null on error
    expect(container.innerHTML).toBe("");
  });

  it("passes gameSlug to useRecommendations", () => {
    mockUseRecommendations.mockReturnValue({
      recommendations: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<RecommendationSection gameSlug="my-game-slug" />);

    expect(mockUseRecommendations).toHaveBeenCalledWith("my-game-slug");
  });

  it("renders links to game detail pages", () => {
    mockUseRecommendations.mockReturnValue({
      recommendations: mockRecommendations,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<RecommendationSection gameSlug="test-game" locale="fr" />);

    // GameCard renders links via next/link (mocked as <a>)
    const links = screen.getAllByRole("link");
    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/fr/games/zelda-totk");
    expect(hrefs).toContain("/fr/games/elden-ring");
  });
});
