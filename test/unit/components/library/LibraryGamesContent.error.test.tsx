import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup, act } from "@testing-library/react";
import React from "react";

/**
 * Feature: library-games-view
 * Task 8.2: Unit tests for error handling
 */

const { mockGet, mockToast } = vi.hoisted(() => ({
  mockGet: vi.fn(() => Promise.resolve({ games: [], pagination: null, genres: [] })),
  mockToast: vi.fn(() => {}),
}));

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

vi.mock("@/lib/api-client", () => ({
  useApiClient: () => ({ get: mockGet }),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: mockToast,
}));

let apiCallCount = 0;
let shouldFailOnFilterChange = false;

vi.mock("@/components/providers/ErrorProvider", () => ({
  useAsyncError: () => ({
    executeAsync: async (fn: () => Promise<unknown>, context?: string) => {
      apiCallCount++;
      if (shouldFailOnFilterChange && context === "fetchLibraryGames" && apiCallCount > 3) {
        return null;
      }
      try {
        return await fn();
      } catch {
        return null;
      }
    },
  }),
}));

import { LibraryGamesContent } from "@/components/library/LibraryGamesContent";

/** Shared mock setup for stats + genres + games */
function mockStatsAndGenres(totalGames: number, completedGames: number, totalPlayTime: number) {
  mockGet.mockImplementation((url: string) => {
    if (url.includes("/api/library/stats")) {
      return Promise.resolve({ totalGames, completedGames, totalPlayTime });
    }
    if (url.includes("/api/genres")) {
      return Promise.resolve({ genres: [] });
    }
    return Promise.resolve({ games: [], pagination: null });
  });
}

/** Render and wait for initial load to complete (stats visible) */
async function renderAndWaitForStats(statValue: string) {
  await act(async () => {
    render(<LibraryGamesContent locale="fr" />);
  });
  await waitFor(() => {
    expect(screen.getByText(statValue)).toBeTruthy();
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
  // Advance past GameSearchBar debounce (300ms)
  await act(async () => {
    vi.advanceTimersByTime(350);
  });
  // Advance past LibraryGamesContent filter debounce (300ms)
  await act(async () => {
    vi.advanceTimersByTime(350);
  });
  vi.useRealTimers();
}

describe("LibraryGamesContent Error Handling", () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockToast.mockClear();
    apiCallCount = 0;
    shouldFailOnFilterChange = false;
  });

  afterEach(() => {
    cleanup();
  });

  describe("Error Message Display", () => {
    it("should display toast notification when filter change API call fails", async () => {
      shouldFailOnFilterChange = true;
      mockStatsAndGenres(10, 5, 100);
      await renderAndWaitForStats("10");

      await typeSearchWithFakeTimers("test search");

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      const toastCall = mockToast.mock.calls[0]?.[0] as { variant?: string } | undefined;
      expect(toastCall?.variant).toBe("destructive");
    });

    it("should display error toast with correct title on filter error", async () => {
      shouldFailOnFilterChange = true;
      mockStatsAndGenres(5, 2, 50);
      await renderAndWaitForStats("5");

      await typeSearchWithFakeTimers("query");

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      const toastCall = mockToast.mock.calls[0]?.[0] as { title?: string } | undefined;
      expect(toastCall?.title).toBe("Erreur de chargement");
    });

    it("should display error toast with description on filter error", async () => {
      shouldFailOnFilterChange = true;
      mockStatsAndGenres(5, 2, 50);
      await renderAndWaitForStats("5");

      await typeSearchWithFakeTimers("search");

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      const toastCall = mockToast.mock.calls[0]?.[0] as { description?: string } | undefined;
      expect(toastCall?.description).toBe("Impossible de charger les jeux");
    });
  });

  describe("Retry Functionality", () => {
    it("should call games API with retry configuration", async () => {
      mockStatsAndGenres(10, 5, 100);
      await renderAndWaitForStats("10");

      const gamesCall = mockGet.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("/api/games")
      );
      expect(gamesCall).toBeTruthy();
      const callOptions = gamesCall?.[1] as { retryConfig?: { maxAttempts?: number } } | undefined;
      expect(callOptions?.retryConfig?.maxAttempts).toBe(3);
    });

    it("should call stats API with retry configuration", async () => {
      mockStatsAndGenres(5, 2, 50);
      await renderAndWaitForStats("5");

      const statsCall = mockGet.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("/api/library/stats")
      );
      expect(statsCall).toBeTruthy();
      const callOptions = statsCall?.[1] as { retryConfig?: { maxAttempts?: number } } | undefined;
      expect(callOptions?.retryConfig?.maxAttempts).toBe(2);
    });

    it("should call genres API with retry configuration", async () => {
      mockStatsAndGenres(5, 2, 50);
      await renderAndWaitForStats("5");

      const genresCall = mockGet.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("/api/genres")
      );
      expect(genresCall).toBeTruthy();
      const callOptions = genresCall?.[1] as { retryConfig?: { maxAttempts?: number } } | undefined;
      expect(callOptions?.retryConfig?.maxAttempts).toBe(2);
    });
  });

  describe("Error State Preservation", () => {
    it("should preserve stats display when games API fails", async () => {
      mockGet.mockImplementation((url: string) => {
        if (url.includes("/api/library/stats")) {
          return Promise.resolve({
            totalGames: 15,
            completedGames: 8,
            totalPlayTime: 200,
            averageRating: 4.5,
          });
        }
        if (url.includes("/api/genres")) {
          return Promise.resolve({ genres: [] });
        }
        return Promise.reject(new Error("Failed to load games"));
      });

      await act(async () => {
        render(<LibraryGamesContent locale="fr" />);
      });

      await waitFor(() => {
        expect(screen.getByText("15")).toBeTruthy();
      });
      expect(screen.getByText("8")).toBeTruthy();
      expect(screen.getByText("200h")).toBeTruthy();
    });

    it("should show empty state when no games returned", async () => {
      mockStatsAndGenres(0, 0, 0);

      await act(async () => {
        render(<LibraryGamesContent locale="fr" />);
      });

      await waitFor(() => {
        expect(screen.getByText("Bibliothèque vide")).toBeTruthy();
      });
    });
  });

  describe("Authentication Redirect", () => {
    it("should render content when user is authenticated", async () => {
      mockStatsAndGenres(5, 2, 50);
      await renderAndWaitForStats("5");

      expect(screen.getByText("Jeux possédés")).toBeTruthy();
      expect(screen.getByText("Jeux terminés")).toBeTruthy();
    });

    it("should display library interface elements for authenticated user", async () => {
      mockStatsAndGenres(3, 1, 25);

      await act(async () => {
        render(<LibraryGamesContent locale="fr" />);
      });

      await waitFor(() => {
        expect(screen.getByText("Jeux possédés")).toBeTruthy();
      });
      expect(screen.getByRole("textbox")).toBeTruthy();
      expect(screen.getByRole("button", { name: /filtrer/i })).toBeTruthy();
    });
  });
});
