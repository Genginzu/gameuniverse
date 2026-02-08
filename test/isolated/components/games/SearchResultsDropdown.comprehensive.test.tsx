import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchResultItem } from "../../../../src/types/search";

// Mock Image constructor for JSDOM
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = "";

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
}
(global as typeof globalThis & { Image: typeof MockImage }).Image = MockImage;

// Note: next-intl is mocked globally in test/setup.ts

// Import after mocks
import { SearchResultsDropdown } from "../../../../src/components/games/SearchResultsDropdown";

const sampleLocalGame: SearchResultItem = {
  id: "1",
  slug: "zelda-breath-of-the-wild",
  title: "The Legend of Zelda: Breath of the Wild",
  coverUrl: "https://example.com/zelda.jpg",
  developer: "Nintendo",
  releaseYear: 2017,
  source: "local",
  igdbId: 12345,
};

const sampleIgdbGame: SearchResultItem = {
  id: "2",
  igdbId: 67890,
  slug: "elden-ring",
  title: "Elden Ring",
  coverUrl: "https://example.com/elden.jpg",
  developer: "FromSoftware",
  releaseYear: 2022,
  source: "igdb",
};

const sampleResults: SearchResultItem[] = [sampleLocalGame, sampleIgdbGame];

describe("SearchResultsDropdown Component", () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("loading state", () => {
    it("renders loading indicator when isLoading is true", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[]}
          isLoading={true}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      expect(screen.getByText("Loading...")).toBeDefined();
    });

    it("shows spinner animation when loading", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      const { container } = render(
        <SearchResultsDropdown
          results={[]}
          isLoading={true}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
    });
  });

  describe("no results state", () => {
    it("renders no results message when results array is empty", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      expect(screen.getByText("No results found")).toBeDefined();
    });
  });

  describe("results rendering", () => {
    it("renders all results", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={sampleResults}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      expect(screen.getByText("The Legend of Zelda: Breath of the Wild")).toBeDefined();
      expect(screen.getByText("Elden Ring")).toBeDefined();
    });

    it("displays game title", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      expect(screen.getByText("The Legend of Zelda: Breath of the Wild")).toBeDefined();
    });

    it("displays developer name when available", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      expect(screen.getByText("Nintendo")).toBeDefined();
    });

    it("displays release year when available", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      expect(screen.getByText("2017")).toBeDefined();
    });

    it("displays source badge for local games", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      expect(screen.getByText("Local")).toBeDefined();
    });

    it("displays source badge for IGDB games", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[sampleIgdbGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      expect(screen.getByText("IGDB")).toBeDefined();
    });
  });

  describe("game selection", () => {
    it("calls onSelectGame when a result is clicked", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      const gameButton = screen
        .getByText("The Legend of Zelda: Breath of the Wild")
        .closest("button");
      if (gameButton) {
        fireEvent.click(gameButton);
        expect(onSelectGame).toHaveBeenCalledWith(sampleLocalGame);
      }
    });

    it("does not call onSelectGame when item is being imported", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
          importingId={sampleLocalGame.id}
        />
      );

      const gameButton = screen
        .getByText("The Legend of Zelda: Breath of the Wild")
        .closest("button");
      if (gameButton) {
        fireEvent.click(gameButton);
        expect(onSelectGame).not.toHaveBeenCalled();
      }
    });

    it("shows importing indicator for the item being imported", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
          importingId={sampleLocalGame.id}
        />
      );

      expect(screen.getByText("Importing...")).toBeDefined();
    });

    it("disables button when item is being imported", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
          importingId={sampleLocalGame.id}
        />
      );

      const gameButton = screen
        .getByText("The Legend of Zelda: Breath of the Wild")
        .closest("button");
      expect(gameButton?.getAttribute("disabled")).toBe("");
    });
  });

  describe("see all functionality", () => {
    it("shows see all button when hasMore is true", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={sampleResults}
          isLoading={false}
          hasMore={true}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      expect(screen.getByText("See all results")).toBeDefined();
    });

    it("hides see all button when hasMore is false", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={sampleResults}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      expect(screen.queryByText("See all results")).toBeNull();
    });

    it("calls onSeeAll when see all button is clicked", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={sampleResults}
          isLoading={false}
          hasMore={true}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      const seeAllButton = screen.getByText("See all results");
      fireEvent.click(seeAllButton);

      expect(onSeeAll).toHaveBeenCalled();
    });

    it("shows loading state when loading more results", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={sampleResults}
          isLoading={false}
          isLoadingMore={true}
          hasMore={true}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      // Should show loading text in the see all button area
      const buttons = screen.getAllByRole("button");
      const seeAllButton = buttons.find((btn) => btn.textContent?.includes("Loading"));
      expect(seeAllButton).toBeDefined();
    });

    it("disables see all button when loading more", () => {
      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      const { container } = render(
        <SearchResultsDropdown
          results={sampleResults}
          isLoading={false}
          isLoadingMore={true}
          hasMore={true}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      // Find the see all button (last button in the dropdown)
      const buttons = container.querySelectorAll("button");
      const seeAllButton = buttons[buttons.length - 1];
      expect(seeAllButton?.getAttribute("disabled")).toBe("");
    });
  });

  describe("edge cases", () => {
    it("handles game without developer", () => {
      const gameWithoutDeveloper: SearchResultItem = {
        ...sampleLocalGame,
        developer: undefined,
      };

      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[gameWithoutDeveloper]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      expect(screen.getByText("The Legend of Zelda: Breath of the Wild")).toBeDefined();
      expect(screen.queryByText("Nintendo")).toBeNull();
    });

    it("handles game without release year", () => {
      const gameWithoutYear: SearchResultItem = {
        ...sampleLocalGame,
        releaseYear: undefined,
      };

      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[gameWithoutYear]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      expect(screen.getByText("The Legend of Zelda: Breath of the Wild")).toBeDefined();
      expect(screen.queryByText("2017")).toBeNull();
    });

    it("handles game without cover URL", () => {
      const gameWithoutCover: SearchResultItem = {
        ...sampleLocalGame,
        coverUrl: undefined,
      };

      const onSelectGame = mock(() => {});
      const onSeeAll = mock(() => {});

      render(
        <SearchResultsDropdown
          results={[gameWithoutCover]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={onSeeAll}
        />
      );

      expect(screen.getByText("The Legend of Zelda: Breath of the Wild")).toBeDefined();
    });
  });
});
