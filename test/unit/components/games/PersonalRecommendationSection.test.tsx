import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PersonalRecommendationSection } from "@/components/games/details/PersonalRecommendationSection";
import type { GameRecommendation } from "@/types/recommendation";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const messages: Record<string, string> = {
      personalTitle: "Recommended for you",
      basedOnGames: `Based on ${params?.count ?? 0} games`,
      emptyLibrary: "Add games to your library to get personalized recommendations",
    };
    return messages[key] ?? key;
  },
}));

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
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

const mockRecommendations: GameRecommendation[] = [
  {
    id: "g1",
    slug: "game-one",
    title: "Game One",
    coverImage: null,
    genres: [{ id: "genre-1", name: "RPG" }],
    developer: "Dev A",
    combinedScore: 0.9,
  },
  {
    id: "g2",
    slug: "game-two",
    title: "Game Two",
    coverImage: null,
    genres: [{ id: "genre-2", name: "Action" }],
    developer: "Dev B",
    combinedScore: 0.7,
  },
];

const mockHookReturn = {
  recommendations: [] as GameRecommendation[],
  basedOnGameCount: 0,
  loading: false,
  error: null as string | null,
  refetch: vi.fn(),
};

vi.mock("@/hooks/usePersonalRecommendations", () => ({
  usePersonalRecommendations: () => mockHookReturn,
}));

describe("PersonalRecommendationSection", () => {
  beforeEach(() => {
    mockHookReturn.recommendations = [];
    mockHookReturn.basedOnGameCount = 0;
    mockHookReturn.loading = false;
    mockHookReturn.error = null;
  });

  it("renders the title", () => {
    render(<PersonalRecommendationSection locale="en" />);
    expect(screen.getByText("Recommended for you")).toBeDefined();
  });

  it("shows skeletons while loading", () => {
    mockHookReturn.loading = true;
    const { container } = render(<PersonalRecommendationSection locale="en" />);
    // Skeletons are rendered as children of the grid
    const grid = container.querySelector(".grid");
    expect(grid).toBeDefined();
    expect(grid?.children.length).toBe(4);
  });

  it("shows empty library message when no recommendations", () => {
    render(<PersonalRecommendationSection locale="en" />);
    expect(
      screen.getByText("Add games to your library to get personalized recommendations")
    ).toBeDefined();
  });

  it("renders recommendation cards when data is available", () => {
    mockHookReturn.recommendations = mockRecommendations;
    mockHookReturn.basedOnGameCount = 5;
    render(<PersonalRecommendationSection locale="en" />);
    expect(screen.getByText("Game One")).toBeDefined();
    expect(screen.getByText("Game Two")).toBeDefined();
  });

  it("shows based-on-games count badge", () => {
    mockHookReturn.recommendations = mockRecommendations;
    mockHookReturn.basedOnGameCount = 5;
    render(<PersonalRecommendationSection locale="en" />);
    expect(screen.getByText("Based on 5 games")).toBeDefined();
  });

  it("returns null on error", () => {
    mockHookReturn.error = "Something went wrong";
    const { container } = render(<PersonalRecommendationSection locale="en" />);
    expect(container.innerHTML).toBe("");
  });
});
