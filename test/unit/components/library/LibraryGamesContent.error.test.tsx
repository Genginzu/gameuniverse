import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import React from "react";

/**
 * Feature: library-games-view
 * Task 8.2: Unit tests for error handling
 */

// vi.hoisted ensures mock fns are available when vi.mock factories run
const { mockGet, mockToast } = vi.hoisted(() => ({
  mockGet: vi.fn(() => Promise.resolve({ games: [], pagination: null, genres: [] })),
  mockToast: vi.fn(() => {}),
}));

// Mock next-intl navigation
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
  useImageLoading: () => ({
    isLoading: false,
    hasError: false,
  }),
}));

vi.mock("@/lib/api-client", () => ({
  useApiClient: () => ({
    get: mockGet,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: mockToast,
}));

// Track API call count to simulate error on subsequent calls
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

// Import after mocks
import { LibraryGamesContent } from "../../../../src/components/library/LibraryGamesContent";

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
      await waitFor(() => {
        expect(screen.getByText("10")).toBeTruthy();
      });

      const searchInput = screen.getByRole("textbox");
      fireEvent.change(searchInput, { target: { value: "test search" } });

      await waitFor(
        () => {
          expect(mockToast).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      const toastCall = mockToast.mock.calls[0]?.[0] as { variant?: string } | undefined;
      expect(toastCall?.variant).toBe("destructive");
    });

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

      const gamesCall = mockGet.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("/api/games")
      );
      expect(gamesCall).toBeTruthy();
      const callOptions = gamesCall?.[1] as { retryConfig?: { maxAttempts?: number } } | undefined;
      expect(callOptions?.retryConfig).toBeTruthy();
      expect(callOptions?.retryConfig?.maxAttempts).toBe(3);
    });

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

      render(<LibraryGamesContent locale="fr" />);
      await waitFor(
        () => {
          expect(screen.getByText("15")).toBeTruthy();
        },
        { timeout: 2000 }
      );
      expect(screen.getByText("8")).toBeTruthy();
      expect(screen.getByText("200h")).toBeTruthy();
    });

    it("should show empty state when no games returned", async () => {
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
      expect(screen.getByText("5")).toBeTruthy();
      expect(screen.getByText("Jeux possédés")).toBeTruthy();
    });

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
      expect(screen.getByRole("textbox")).toBeTruthy();
      expect(screen.getByRole("button", { name: /filtrer/i })).toBeTruthy();
    });
  });
});
