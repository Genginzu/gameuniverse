import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import React from "react";

/**
 * Feature: library-games-view
 * Task 8.2: Unit tests for error handling
 *
 * Tests for:
 * - Error message display (toast on filter change errors)
 * - Retry functionality (API calls include retry config)
 * - Authentication redirect (handled by DashboardLayout)
 */

// Mock next/navigation
const mockRouterPush = mock(() => {});
mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mock(() => {}),
    prefetch: mock(() => {}),
    back: mock(() => {}),
    forward: mock(() => {}),
  }),
  usePathname: () => "/fr/library",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-intl navigation
mock.module("@/i18n/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mock(() => {}),
    prefetch: mock(() => {}),
    back: mock(() => {}),
    forward: mock(() => {}),
  }),
  usePathname: () => "/fr/library",
  Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

// Mock next-intl
mock.module("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      heroTitle: "Ma Bibliothèque",
      heroTitleHighlight: "de Jeux",
      heroSubtitle: "Gérez votre collection de jeux",
      "stats.gamesOwned": "Jeux possédés",
      "stats.inLibrary": "dans la bibliothèque",
      "stats.gamesCompleted": "Jeux terminés",
      "stats.completedPercent": "terminés",
      "stats.playTime": "Temps de jeu",
      "stats.totalPlayed": "heures jouées",
      "stats.averageRating": "Note moyenne",
      "stats.yourRatings": "vos notes",
      "empty.title": "Bibliothèque vide",
      "empty.description": "Commencez à ajouter des jeux",
      "empty.noGamesFound": "Aucun jeu trouvé",
      "empty.modifySearch": "Modifiez votre recherche",
      "empty.clearFilters": "Effacer les filtres",
      "empty.exploreGames": "Explorer les jeux",
      loadingError: "Erreur de chargement",
      loadingErrorDescription: "Impossible de charger les jeux",
      placeholder: "Rechercher...",
    };
    return translations[key] || key;
  },
}));

// Mock next/link
mock.module("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

// Mock useAuth hook
mock.module("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
    isAuthenticated: true,
    isLoading: false,
    signOut: mock(() => Promise.resolve()),
  }),
}));

// Mock useGameLibraryStatus hook
mock.module("@/hooks/useGameLibraryStatus", () => ({
  useGameLibraryStatus: () => ({
    isInLibrary: true,
    isLoading: false,
    addToLibrary: mock(() => Promise.resolve()),
    removeFromLibrary: mock(() => Promise.resolve()),
  }),
}));

// Mock useImageLoading hook
mock.module("@/hooks/useImageLoading", () => ({
  useImageLoading: () => ({
    isLoading: false,
    hasError: false,
  }),
}));

// Mock API client - will be configured per test
const mockGet = mock(() => Promise.resolve({ games: [], pagination: null, genres: [] }));
mock.module("@/lib/api-client", () => ({
  useApiClient: () => ({
    get: mockGet,
  }),
}));

// Mock toast to capture error messages
const mockToast = mock(() => {});
mock.module("@/hooks/use-toast", () => ({
  toast: mockToast,
}));

// Track API call count to simulate error on subsequent calls
let apiCallCount = 0;
let shouldFailOnFilterChange = false;

mock.module("@/components/providers/ErrorProvider", () => ({
  useAsyncError: () => ({
    executeAsync: async (fn: () => Promise<unknown>, context?: string) => {
      apiCallCount++;
      // Fail on filter change (calls after initial load)
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

// Import after mocks
import { LibraryGamesContent } from "../LibraryGamesContent";

describe("LibraryGamesContent Error Handling", () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockToast.mockClear();
    mockRouterPush.mockClear();
    apiCallCount = 0;
    shouldFailOnFilterChange = false;
  });

  afterEach(() => {
    cleanup();
  });

  describe("Error Message Display", () => {
    /**
     * Task 8.2: Test error message display
     * Toast is called when fetchLibraryGames (filter change) returns null
     */
    it("should display toast notification when filter change API call fails", async () => {
      shouldFailOnFilterChange = true;

      mockGet.mockImplementation((url: string) => {
        if (url.includes("/api/library/stats")) {
          return Promise.resolve({ totalGames: 10, completedGames: 5, totalPlayTime: 100 });
        }
        if (url.includes("/api/genres")) {
          return Promise.resolve({ genres: [] });
        }
        return Promise.resolve({ games: [], pagination: null });
      });

      render(<LibraryGamesContent locale="fr" />);

      // Wait for initial load to complete
      await waitFor(() => {
        expect(screen.getByText("10")).toBeTruthy();
      });

      // Trigger a filter change by typing in search
      const searchInput = screen.getByRole("textbox");
      fireEvent.change(searchInput, { target: { value: "test search" } });

      // Wait for debounce and API call
      await waitFor(
        () => {
          expect(mockToast).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      // Verify toast was called with destructive variant
      const toastCall = mockToast.mock.calls[0]?.[0] as { variant?: string } | undefined;
      expect(toastCall?.variant).toBe("destructive");
    });

    /**
     * Task 8.2: Test error message display
     * Toast should have correct title when filter change fails
     */
    it("should display error toast with correct title on filter error", async () => {
      shouldFailOnFilterChange = true;

      mockGet.mockImplementation((url: string) => {
        if (url.includes("/api/library/stats")) {
          return Promise.resolve({ totalGames: 5, completedGames: 2, totalPlayTime: 50 });
        }
        if (url.includes("/api/genres")) {
          return Promise.resolve({ genres: [] });
        }
        return Promise.resolve({ games: [], pagination: null });
      });

      render(<LibraryGamesContent locale="fr" />);

      await waitFor(
        () => {
          expect(screen.getByText("5")).toBeTruthy();
        },
        { timeout: 3000 }
      );

      // Trigger filter change
      const searchInput = screen.getByRole("textbox");
      fireEvent.change(searchInput, { target: { value: "query" } });

      await waitFor(
        () => {
          expect(mockToast).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      const toastCall = mockToast.mock.calls[0]?.[0] as { title?: string } | undefined;
      expect(toastCall?.title).toBe("Erreur de chargement");
    });

    /**
     * Task 8.2: Test error message display
     * Toast should have description when filter change fails
     */
    it("should display error toast with description on filter error", async () => {
      shouldFailOnFilterChange = true;

      mockGet.mockImplementation((url: string) => {
        if (url.includes("/api/library/stats")) {
          return Promise.resolve({ totalGames: 5, completedGames: 2, totalPlayTime: 50 });
        }
        if (url.includes("/api/genres")) {
          return Promise.resolve({ genres: [] });
        }
        return Promise.resolve({ games: [], pagination: null });
      });

      render(<LibraryGamesContent locale="fr" />);

      await waitFor(
        () => {
          expect(screen.getByText("5")).toBeTruthy();
        },
        { timeout: 3000 }
      );

      const searchInput = screen.getByRole("textbox");
      fireEvent.change(searchInput, { target: { value: "search" } });

      await waitFor(
        () => {
          expect(mockToast).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      const toastCall = mockToast.mock.calls[0]?.[0] as { description?: string } | undefined;
      expect(toastCall?.description).toBe("Impossible de charger les jeux");
    });
  });

  describe("Retry Functionality", () => {
    /**
     * Task 8.2: Test retry functionality
     * Games API should be called with retry configuration
     */
    it("should call games API with retry configuration", async () => {
      mockGet.mockImplementation((url: string) => {
        if (url.includes("/api/library/stats")) {
          return Promise.resolve({ totalGames: 10, completedGames: 5, totalPlayTime: 100 });
        }
        if (url.includes("/api/genres")) {
          return Promise.resolve({ genres: [] });
        }
        return Promise.resolve({ games: [], pagination: null });
      });

      render(<LibraryGamesContent locale="fr" />);

      await waitFor(
        () => {
          expect(screen.getByText("10")).toBeTruthy();
        },
        { timeout: 3000 }
      );

      // Verify API was called with retry config
      const gamesCall = mockGet.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("/api/games")
      );
      expect(gamesCall).toBeTruthy();

      const callOptions = gamesCall?.[1] as { retryConfig?: { maxAttempts?: number } } | undefined;
      expect(callOptions?.retryConfig).toBeTruthy();
      expect(callOptions?.retryConfig?.maxAttempts).toBe(3);
    });

    /**
     * Task 8.2: Test retry functionality
     * Stats API should have retry configuration
     */
    it("should call stats API with retry configuration", async () => {
      mockGet.mockImplementation((url: string) => {
        if (url.includes("/api/library/stats")) {
          return Promise.resolve({ totalGames: 5, completedGames: 2, totalPlayTime: 50 });
        }
        if (url.includes("/api/genres")) {
          return Promise.resolve({ genres: [] });
        }
        return Promise.resolve({ games: [], pagination: null });
      });

      render(<LibraryGamesContent locale="fr" />);

      await waitFor(
        () => {
          expect(screen.getByText("5")).toBeTruthy();
        },
        { timeout: 3000 }
      );

      const statsCall = mockGet.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("/api/library/stats")
      );
      expect(statsCall).toBeTruthy();

      const callOptions = statsCall?.[1] as { retryConfig?: { maxAttempts?: number } } | undefined;
      expect(callOptions?.retryConfig).toBeTruthy();
      expect(callOptions?.retryConfig?.maxAttempts).toBe(2);
    });

    /**
     * Task 8.2: Test retry functionality
     * Genres API should have retry configuration
     */
    it("should call genres API with retry configuration", async () => {
      mockGet.mockImplementation((url: string) => {
        if (url.includes("/api/library/stats")) {
          return Promise.resolve({ totalGames: 5, completedGames: 2, totalPlayTime: 50 });
        }
        if (url.includes("/api/genres")) {
          return Promise.resolve({ genres: [] });
        }
        return Promise.resolve({ games: [], pagination: null });
      });

      render(<LibraryGamesContent locale="fr" />);

      await waitFor(
        () => {
          expect(screen.getByText("5")).toBeTruthy();
        },
        { timeout: 3000 }
      );

      const genresCall = mockGet.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("/api/genres")
      );
      expect(genresCall).toBeTruthy();

      const callOptions = genresCall?.[1] as { retryConfig?: { maxAttempts?: number } } | undefined;
      expect(callOptions?.retryConfig).toBeTruthy();
      expect(callOptions?.retryConfig?.maxAttempts).toBe(2);
    });
  });

  describe("Error State Preservation", () => {
    /**
     * Task 8.2: Test error handling
     * Stats should remain visible even when games API fails
     */
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
        // Games API fails
        return Promise.reject(new Error("Failed to load games"));
      });

      render(<LibraryGamesContent locale="fr" />);

      // Stats should still be displayed even if games fail
      await waitFor(
        () => {
          expect(screen.getByText("15")).toBeTruthy();
        },
        { timeout: 2000 }
      );

      expect(screen.getByText("8")).toBeTruthy();
      expect(screen.getByText("200h")).toBeTruthy();
    });

    /**
     * Task 8.2: Test error handling
     * Component should show empty state when no games returned
     */
    it("should show empty state when no games are returned", async () => {
      mockGet.mockImplementation((url: string) => {
        if (url.includes("/api/library/stats")) {
          return Promise.resolve({ totalGames: 0, completedGames: 0, totalPlayTime: 0 });
        }
        if (url.includes("/api/genres")) {
          return Promise.resolve({ genres: [] });
        }
        return Promise.resolve({ games: [], pagination: null });
      });

      render(<LibraryGamesContent locale="fr" />);

      await waitFor(
        () => {
          expect(screen.getByText("Bibliothèque vide")).toBeTruthy();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Authentication Redirect", () => {
    /**
     * Task 8.2: Test authentication redirect
     * Note: Authentication redirect is handled by DashboardLayout wrapper
     * This test verifies the component renders correctly for authenticated users
     */
    it("should render content when user is authenticated", async () => {
      mockGet.mockImplementation((url: string) => {
        if (url.includes("/api/library/stats")) {
          return Promise.resolve({ totalGames: 5, completedGames: 2, totalPlayTime: 50 });
        }
        if (url.includes("/api/genres")) {
          return Promise.resolve({ genres: [] });
        }
        return Promise.resolve({ games: [], pagination: null });
      });

      render(<LibraryGamesContent locale="fr" />);

      await waitFor(
        () => {
          expect(screen.getByText("Ma Bibliothèque")).toBeTruthy();
        },
        { timeout: 3000 }
      );

      // Verify stats are displayed
      expect(screen.getByText("5")).toBeTruthy();
      expect(screen.getByText("Jeux possédés")).toBeTruthy();
    });

    /**
     * Task 8.2: Test authentication redirect
     * Verify the component expects to be wrapped in DashboardLayout for auth
     */
    it("should display library interface elements for authenticated user", async () => {
      mockGet.mockImplementation((url: string) => {
        if (url.includes("/api/library/stats")) {
          return Promise.resolve({ totalGames: 3, completedGames: 1, totalPlayTime: 25 });
        }
        if (url.includes("/api/genres")) {
          return Promise.resolve({ genres: [] });
        }
        return Promise.resolve({ games: [], pagination: null });
      });

      render(<LibraryGamesContent locale="fr" />);

      await waitFor(
        () => {
          expect(screen.getByText("Ma Bibliothèque")).toBeTruthy();
        },
        { timeout: 3000 }
      );

      // Search bar should be present
      expect(screen.getByRole("textbox")).toBeTruthy();

      // Filter button should be present
      expect(screen.getByRole("button", { name: /filtrer/i })).toBeTruthy();
    });
  });
});
