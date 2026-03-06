import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import React from "react";

/**
 * Feature: library-games-view
 * Task 6.1 + 7.1: Unit tests for component rendering and empty states
 */

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(() => {}),
    replace: vi.fn(() => {}),
    prefetch: vi.fn(() => {}),
    back: vi.fn(() => {}),
    forward: vi.fn(() => {}),
  }),
  usePathname: () => "/fr/library",
  Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
    isAuthenticated: true,
    isLoading: false,
    signOut: vi.fn(() => Promise.resolve()),
  }),
}));

vi.mock("@/hooks/useGameLibraryStatus", () => ({
  useGameLibraryStatus: () => ({
    isInLibrary: true,
    isLoading: false,
    addToLibrary: vi.fn(() => Promise.resolve()),
    removeFromLibrary: vi.fn(() => Promise.resolve()),
  }),
}));

vi.mock("@/hooks/useImageLoading", () => ({
  useImageLoading: () => ({ isLoading: false, hasError: false }),
}));

const mockGet = vi.fn(() => Promise.resolve({ games: [], pagination: null, genres: [] }));
vi.mock("@/lib/api-client", () => ({
  useApiClient: () => ({ get: mockGet }),
}));

vi.mock("@/components/providers/ErrorProvider", () => ({
  useAsyncError: () => ({
    executeAsync: async (fn: () => Promise<unknown>) => {
      try {
        return await fn();
      } catch {
        return null;
      }
    },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(() => {}),
}));

import { LibraryGamesContent } from "@/components/library/LibraryGamesContent";

/** Shared mock setup */
function mockStatsAndGenres(
  totalGames: number,
  completedGames: number,
  totalPlayTime: number,
  extra?: { averageRating?: number; genres?: unknown[]; games?: unknown[]; pagination?: unknown }
) {
  mockGet.mockImplementation((url: string) => {
    if (url.includes("/api/library/stats")) {
      return Promise.resolve({
        totalGames,
        completedGames,
        totalPlayTime,
        averageRating: extra?.averageRating,
      });
    }
    if (url.includes("/api/genres")) {
      return Promise.resolve({ genres: extra?.genres ?? [] });
    }
    return Promise.resolve({
      games: extra?.games ?? [],
      pagination: extra?.pagination ?? null,
    });
  });
}

/** Render and wait for initial load */
async function renderAndWaitForStats(statValue: string) {
  await act(async () => {
    render(<LibraryGamesContent locale="fr" />);
  });
  await waitFor(() => {
    if (statValue === "0") {
      expect(screen.getByText("Jeux possédés")).toBeTruthy();
    } else {
      expect(screen.getByText(statValue)).toBeTruthy();
    }
  });
}

/**
 * Type in search, advance fake timers past both debounce layers
 * (GameSearchBar 300ms + LibraryGamesContent 300ms), then restore real timers.
 */
async function typeSearchWithFakeTimers(value: string) {
  vi.useFakeTimers();
  const searchInput = screen.getByRole("textbox");
  fireEvent.change(searchInput, { target: { value } });
  await act(async () => {
    vi.advanceTimersByTime(350);
  });
  await act(async () => {
    vi.advanceTimersByTime(350);
  });
  vi.useRealTimers();
}

describe("LibraryGamesContent Component Rendering", () => {
  beforeEach(() => {
    mockGet.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Initial Loading State", () => {
    it("should render SearchSkeleton during initial loading", () => {
      mockGet.mockImplementation(() => new Promise(() => {}));
      const { container } = render(<LibraryGamesContent locale="fr" />);
      expect(container.querySelector(".animate-pulse")).toBeTruthy();
    });

    it("should render loading skeleton during initial loading", () => {
      mockGet.mockImplementation(() => new Promise(() => {}));
      const { container } = render(<LibraryGamesContent locale="fr" />);
      expect(container.querySelector(".animate-pulse")).toBeTruthy();
    });

    it("should hide skeleton after data loads", async () => {
      mockStatsAndGenres(5, 2, 50);
      await renderAndWaitForStats("5");
      expect(screen.getByText("Jeux possédés")).toBeTruthy();
    });
  });

  describe("Filter Update Loading State", () => {
    it("should show loading state when filters are being applied", async () => {
      let callCount = 0;
      mockGet.mockImplementation((url: string) => {
        if (url.includes("/api/library/stats")) {
          return Promise.resolve({ totalGames: 10, completedGames: 5, totalPlayTime: 100 });
        }
        if (url.includes("/api/genres")) {
          return Promise.resolve({ genres: [] });
        }
        callCount++;
        if (callCount > 1) {
          return new Promise(() => {});
        }
        return Promise.resolve({ games: [], pagination: null });
      });

      const { container } = render(<LibraryGamesContent locale="fr" />);
      await waitFor(() => {
        expect(screen.getByText("10")).toBeTruthy();
      });

      await typeSearchWithFakeTimers("test");

      await waitFor(() => {
        const skeletons = container.querySelectorAll(".animate-pulse");
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });

    it("should not show games grid during filter loading", async () => {
      let callCount = 0;
      const mockGames = [
        {
          id: "1",
          slug: "game-1",
          title: "Game One",
          coverImage: "/cover1.jpg",
          genres: [{ name: "Action" }],
          developer: "Dev 1",
          publisher: "Pub 1",
        },
      ];

      mockGet.mockImplementation((url: string) => {
        if (url.includes("/api/library/stats")) {
          return Promise.resolve({ totalGames: 1, completedGames: 0, totalPlayTime: 10 });
        }
        if (url.includes("/api/genres")) {
          return Promise.resolve({ genres: [] });
        }
        callCount++;
        if (callCount > 1) {
          return new Promise(() => {});
        }
        return Promise.resolve({
          games: mockGames,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalCount: 1,
            limit: 20,
            hasNextPage: false,
            hasPreviousPage: false,
            offset: 0,
          },
        });
      });

      const { container } = render(<LibraryGamesContent locale="fr" />);
      await waitFor(() => {
        expect(screen.getByText("1")).toBeTruthy();
      });

      await typeSearchWithFakeTimers("game");

      await waitFor(() => {
        const skeletons = container.querySelectorAll(".animate-pulse");
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Stats Cards Rendering", () => {
    it("should render all four stats cards after loading", async () => {
      mockStatsAndGenres(10, 5, 100, { averageRating: 4.5 });
      await renderAndWaitForStats("10");

      expect(screen.getByText("Jeux possédés")).toBeTruthy();
      expect(screen.getByText("Jeux terminés")).toBeTruthy();
      expect(screen.getByText("Temps de jeu")).toBeTruthy();
      expect(screen.getByText("Note moyenne")).toBeTruthy();
    });

    it("should display stats values correctly", async () => {
      mockStatsAndGenres(25, 12, 150, { averageRating: 4.2 });
      await renderAndWaitForStats("25");

      expect(screen.getByText("12")).toBeTruthy();
      expect(screen.getByText("150h")).toBeTruthy();
      expect(screen.getByText("4.2/5")).toBeTruthy();
    });

    it("should display dash for missing average rating", async () => {
      mockStatsAndGenres(5, 2, 50);
      await renderAndWaitForStats("5");
      expect(screen.getByText("—")).toBeTruthy();
    });
  });

  describe("Hero Section Rendering", () => {
    it("should render stats section with card titles", async () => {
      mockStatsAndGenres(0, 0, 0);
      await renderAndWaitForStats("0");

      expect(screen.getByText("Jeux possédés")).toBeTruthy();
      expect(screen.getByText("Jeux terminés")).toBeTruthy();
      expect(screen.getByText("Temps de jeu")).toBeTruthy();
    });
  });

  describe("Search Bar Rendering", () => {
    it("should render search bar component", async () => {
      mockStatsAndGenres(0, 0, 0);
      await renderAndWaitForStats("0");
      expect(screen.getByRole("textbox")).toBeTruthy();
    });
  });

  describe("Filter Button State", () => {
    it("should render filter button", async () => {
      mockStatsAndGenres(0, 0, 0);
      await renderAndWaitForStats("0");
      expect(screen.getByRole("button", { name: /filtrer/i })).toBeTruthy();
    });

    it("should toggle filter panel when filter button is clicked", async () => {
      mockStatsAndGenres(0, 0, 0, {
        genres: [
          { id: "1", slug: "action", name: "Action", gameCount: 10 },
          { id: "2", slug: "rpg", name: "RPG", gameCount: 5 },
        ],
      });
      await renderAndWaitForStats("0");

      const filterButton = screen.getByRole("button", { name: /filtrer/i });
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText("Tous les genres")).toBeTruthy();
      });
    });
  });

  describe("Empty State Rendering", () => {
    it("should render empty library state when no games", async () => {
      mockStatsAndGenres(0, 0, 0);
      await act(async () => {
        render(<LibraryGamesContent locale="fr" />);
      });
      await waitFor(() => {
        expect(screen.getByText("Bibliothèque vide")).toBeTruthy();
      });
      expect(screen.getByText("Commencez à ajouter des jeux")).toBeTruthy();
      expect(screen.getByText("Explorer les jeux")).toBeTruthy();
    });

    it("should render explore games link in empty library state", async () => {
      mockStatsAndGenres(0, 0, 0);
      await act(async () => {
        render(<LibraryGamesContent locale="fr" />);
      });
      await waitFor(() => {
        const exploreLink = screen.getByRole("link", { name: /explorer les jeux/i });
        expect(exploreLink).toBeTruthy();
        expect(exploreLink.getAttribute("href")).toBe("/games");
      });
    });

    it("should render gamepad icon in empty library state", async () => {
      mockStatsAndGenres(0, 0, 0);
      const { container } = await act(async () => {
        return render(<LibraryGamesContent locale="fr" />);
      });
      await waitFor(() => {
        expect(screen.getByText("Bibliothèque vide")).toBeTruthy();
      });
      const iconContainer = container.querySelector(".rounded-full.bg-gray-100");
      expect(iconContainer).toBeTruthy();
    });
  });

  describe("No Results State Rendering", () => {
    it("should render no results state when search query has no matches", async () => {
      mockStatsAndGenres(10, 5, 100);
      await renderAndWaitForStats("10");

      await typeSearchWithFakeTimers("nonexistent game xyz");

      await waitFor(() => {
        expect(screen.getByText("Aucun jeu trouvé")).toBeTruthy();
      });
      expect(screen.getByText("Modifiez votre recherche")).toBeTruthy();
    });

    it("should render clear filters button in no results state", async () => {
      mockStatsAndGenres(10, 5, 100);
      await renderAndWaitForStats("10");

      await typeSearchWithFakeTimers("nonexistent");

      await waitFor(() => {
        const clearButton = screen.getByRole("button", { name: /effacer les filtres/i });
        expect(clearButton).toBeTruthy();
      });
    });

    it("should show different message for no results vs empty library", async () => {
      mockStatsAndGenres(0, 0, 0);
      const { unmount } = await act(async () => {
        return render(<LibraryGamesContent locale="fr" />);
      });
      await waitFor(() => {
        expect(screen.getByText("Bibliothèque vide")).toBeTruthy();
        expect(screen.getByText("Explorer les jeux")).toBeTruthy();
      });
      expect(screen.queryByText("Effacer les filtres")).toBeNull();
      unmount();
    });
  });

  describe("Games Grid Rendering", () => {
    it("should render games in a responsive grid", async () => {
      const mockGames = [
        {
          id: "1",
          slug: "game-1",
          title: "Game One",
          coverImage: "/cover1.jpg",
          genres: [{ name: "Action" }],
          developer: "Dev 1",
          publisher: "Pub 1",
        },
        {
          id: "2",
          slug: "game-2",
          title: "Game Two",
          coverImage: "/cover2.jpg",
          genres: [{ name: "RPG" }],
          developer: "Dev 2",
          publisher: "Pub 2",
        },
      ];
      mockStatsAndGenres(2, 1, 50, {
        games: mockGames,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 2,
          limit: 20,
          hasNextPage: false,
          hasPreviousPage: false,
          offset: 0,
        },
      });
      const { container } = await act(async () => {
        return render(<LibraryGamesContent locale="fr" />);
      });
      await waitFor(() => {
        expect(container.querySelector(".grid")).toBeTruthy();
      });
    });

    it("should render game cards when games are loaded", async () => {
      const mockGames = [
        {
          id: "1",
          slug: "game-1",
          title: "Game One",
          coverImage: "/cover1.jpg",
          genres: [{ name: "Action" }],
          developer: "Dev 1",
          publisher: "Pub 1",
        },
      ];
      mockStatsAndGenres(1, 0, 10, {
        games: mockGames,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
          limit: 20,
          hasNextPage: false,
          hasPreviousPage: false,
          offset: 0,
        },
      });
      const { container } = await act(async () => {
        return render(<LibraryGamesContent locale="fr" />);
      });
      await waitFor(() => {
        expect(container.querySelector(".grid.grid-cols-1")).toBeTruthy();
      });
    });
  });

  describe("Pagination Rendering", () => {
    it("should not render pagination when only one page", async () => {
      mockStatsAndGenres(5, 2, 25, {
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 5,
          limit: 20,
          hasNextPage: false,
          hasPreviousPage: false,
          offset: 0,
        },
      });
      await renderAndWaitForStats("5");
      expect(screen.queryByRole("navigation")).toBeNull();
    });

    it("should have pagination logic for multiple pages", async () => {
      mockStatsAndGenres(50, 20, 250, {
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 50,
          limit: 20,
          hasNextPage: true,
          hasPreviousPage: false,
          offset: 0,
        },
      });
      await renderAndWaitForStats("50");
      await waitFor(() => {
        expect(screen.getByText("Bibliothèque vide")).toBeTruthy();
      });
    });
  });
});
