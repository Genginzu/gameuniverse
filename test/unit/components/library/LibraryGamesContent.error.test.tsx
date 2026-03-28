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
import { createSWRWrapper } from "../../../helpers/swr-wrapper";

const SWRWrapper = createSWRWrapper();

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

  vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    let body: unknown;
    if (url.includes("/api/library/stats")) {
      body = { totalGames, completedGames, totalPlayTime };
    } else if (url.includes("/api/genres")) {
      body = { genres: [] };
    } else {
      body = { games: [], pagination: null };
    }
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });
}

/** Render and wait for initial load to complete (stats visible) */
async function renderAndWaitForStats(statValue: string) {
  await act(async () => {
    render(
      <SWRWrapper>
        <LibraryGamesContent locale="fr" />
      </SWRWrapper>
    );
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
    vi.restoreAllMocks();
  });

  describe("Error Message Display", () => {
    it("should still render component when API returns error", async () => {
      // With SWR, errors are handled gracefully — component renders with default values
      vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: "Server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await act(async () => {
        render(
          <SWRWrapper>
            <LibraryGamesContent locale="fr" />
          </SWRWrapper>
        );
      });

      // Component should still render with default stats (0)
      await waitFor(() => {
        expect(screen.getByText("Jeux possédés")).toBeTruthy();
      });
    });
  });

  describe("Retry Functionality", () => {
    it("should use SWR for data fetching (no manual retry config)", async () => {
      // SWR handles retries internally — verify fetch is called
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockImplementation((input: RequestInfo | URL) => {
          const url = typeof input === "string" ? input : input.toString();
          let body: unknown;
          if (url.includes("/api/library/stats")) {
            body = { totalGames: 10, completedGames: 5, totalPlayTime: 100 };
          } else if (url.includes("/api/genres")) {
            body = { genres: [] };
          } else {
            body = { games: [], pagination: null };
          }
          return Promise.resolve(
            new Response(JSON.stringify(body), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        });

      await act(async () => {
        render(
          <SWRWrapper>
            <LibraryGamesContent locale="fr" />
          </SWRWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText("10")).toBeTruthy();
      });

      // Verify fetch was called for the APIs
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe("Error State Preservation", () => {
    it("should preserve stats display when games API fails", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("/api/library/stats")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                totalGames: 15,
                completedGames: 8,
                totalPlayTime: 200,
                averageRating: 4.5,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );
        }
        if (url.includes("/api/genres")) {
          return Promise.resolve(
            new Response(JSON.stringify({ genres: [] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        }
        // Games API fails
        return Promise.resolve(
          new Response(JSON.stringify({ error: "Failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        );
      });

      await act(async () => {
        render(
          <SWRWrapper>
            <LibraryGamesContent locale="fr" />
          </SWRWrapper>
        );
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
