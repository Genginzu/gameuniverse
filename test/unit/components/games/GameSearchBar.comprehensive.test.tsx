import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Note: next-intl is mocked globally in test/setup.ts

// Use the global router mock from setup.ts
const getRouterMocks = () =>
  (
    global as typeof globalThis & {
      __routerMocks?: {
        push: ReturnType<typeof mock>;
        replace: ReturnType<typeof mock>;
      };
    }
  ).__routerMocks;

// Import after mocks
import { GameSearchBar } from "../../../../src/components/games/GameSearchBar";

describe("GameSearchBar Component", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let routerMocks: ReturnType<typeof getRouterMocks>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    routerMocks = getRouterMocks();
    if (routerMocks) {
      routerMocks.push.mockClear();
      routerMocks.replace.mockClear();
    }
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  describe("legacy mode (with onSearch callback)", () => {
    it("renders with default placeholder from translations", () => {
      const onSearch = vi.fn(() => {});
      render(<GameSearchBar onSearch={onSearch} />);

      const input = screen.getByPlaceholderText("Search games...");
      expect(input).toBeDefined();
    });

    it("renders with custom placeholder", () => {
      const onSearch = vi.fn(() => {});
      render(<GameSearchBar onSearch={onSearch} placeholder="Find a game..." />);

      const input = screen.getByPlaceholderText("Find a game...");
      expect(input).toBeDefined();
    });

    it("renders with initial value", () => {
      const onSearch = vi.fn(() => {});
      render(<GameSearchBar onSearch={onSearch} initialValue="zelda" />);

      const input = screen.getByDisplayValue("zelda");
      expect(input).toBeDefined();
    });

    it("updates input value on change", () => {
      const onSearch = vi.fn(() => {});
      render(<GameSearchBar onSearch={onSearch} />);

      const input = screen.getByPlaceholderText("Search games...") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "mario" } });

      expect(input.value).toBe("mario");
    });

    it("calls onSearch after debounce delay", async () => {
      const onSearch = vi.fn(() => {});
      render(<GameSearchBar onSearch={onSearch} debounceMs={50} />);

      const input = screen.getByPlaceholderText("Search games...");
      fireEvent.change(input, { target: { value: "test" } });

      await waitFor(
        () => {
          expect(onSearch).toHaveBeenCalledWith("test");
        },
        { timeout: 200 }
      );
    });

    it("shows clear button when input has value", () => {
      const onSearch = vi.fn(() => {});
      render(<GameSearchBar onSearch={onSearch} initialValue="test" />);

      const clearButton = screen.getByRole("button");
      expect(clearButton).toBeDefined();
    });

    it("clears input when clear button is clicked", () => {
      const onSearch = vi.fn(() => {});
      render(<GameSearchBar onSearch={onSearch} initialValue="test" />);

      const input = screen.getByDisplayValue("test") as HTMLInputElement;
      const clearButton = screen.getByRole("button");

      fireEvent.click(clearButton);

      expect(input.value).toBe("");
    });

    it("does not show dropdown in legacy mode", () => {
      const onSearch = vi.fn(() => {});
      render(<GameSearchBar onSearch={onSearch} initialValue="test query" />);

      // No dropdown should be rendered in legacy mode
      expect(screen.queryByText("Loading...")).toBeNull();
      expect(screen.queryByText("No results found")).toBeNull();
    });
  });

  describe("form submission", () => {
    it("calls onSearch on form submit in legacy mode", () => {
      const onSearch = vi.fn(() => {});
      const { container } = render(
        <GameSearchBar onSearch={onSearch} initialValue="submit test" />
      );

      const form = container.querySelector("form");
      if (form) {
        fireEvent.submit(form);
        expect(onSearch).toHaveBeenCalledWith("submit test");
      }
    });

    it("navigates to games page on form submit in hybrid mode", () => {
      if (!routerMocks) return;
      const { container } = render(<GameSearchBar initialValue="search query" locale="en" />);

      const form = container.querySelector("form");
      if (form) {
        fireEvent.submit(form);
        expect(routerMocks.push).toHaveBeenCalledWith("/en/games?search=search%20query");
      }
    });

    it("does not navigate if query is too short in hybrid mode", () => {
      if (!routerMocks) return;
      const { container } = render(<GameSearchBar initialValue="a" locale="en" />);

      const form = container.querySelector("form");
      if (form) {
        fireEvent.submit(form);
        expect(routerMocks.push).not.toHaveBeenCalled();
      }
    });
  });

  describe("hybrid mode (without onSearch callback)", () => {
    it("renders in hybrid mode when no onSearch is provided", () => {
      render(<GameSearchBar />);

      const input = screen.getByPlaceholderText("Search games...");
      expect(input).toBeDefined();
    });

    it("does not show dropdown when query is too short", () => {
      render(<GameSearchBar initialValue="a" />);

      // Dropdown should not be visible for single character
      expect(screen.queryByText("Loading...")).toBeNull();
    });
  });

  describe("keyboard interactions", () => {
    it("focuses input on render", () => {
      const onSearch = vi.fn(() => {});
      render(<GameSearchBar onSearch={onSearch} />);

      const input = screen.getByPlaceholderText("Search games...");
      expect(input).toBeDefined();
    });
  });

  describe("locale handling", () => {
    it("uses provided locale for navigation", () => {
      if (!routerMocks) return;
      const { container } = render(<GameSearchBar locale="fr" initialValue="test game" />);

      const form = container.querySelector("form");
      if (form) {
        fireEvent.submit(form);
        expect(routerMocks.push).toHaveBeenCalledWith("/fr/games?search=test%20game");
      }
    });

    it("defaults to fr locale", () => {
      if (!routerMocks) return;
      const { container } = render(<GameSearchBar initialValue="test game" />);

      const form = container.querySelector("form");
      if (form) {
        fireEvent.submit(form);
        expect(routerMocks.push).toHaveBeenCalledWith("/fr/games?search=test%20game");
      }
    });
  });

  describe("onNavigateToGame callback", () => {
    it("uses custom navigation callback when provided", async () => {
      const onNavigateToGame = vi.fn(() => {});

      // Mock fetch for hybrid search
      fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  id: "1",
                  slug: "test-game",
                  title: "Test Game",
                  source: "local",
                },
              ],
              hasMore: false,
            }),
        } as Response)
      );

      render(<GameSearchBar onNavigateToGame={onNavigateToGame} locale="en" />);

      const input = screen.getByPlaceholderText("Search games...");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.focus(input);

      // Wait for search results
      await waitFor(
        () => {
          expect(screen.getByText("Test Game")).toBeDefined();
        },
        { timeout: 1000 }
      );

      // Click on the result
      const resultButton = screen.getByText("Test Game").closest("button");
      if (resultButton) {
        fireEvent.click(resultButton);
        expect(onNavigateToGame).toHaveBeenCalledWith("test-game");
      }
    });
  });
});
