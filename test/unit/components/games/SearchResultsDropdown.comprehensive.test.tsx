import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchResultItem } from "@/types/search";
import { SearchResultsDropdown } from "@/components/games/SearchResultsDropdown";

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
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("loading state", () => {
    it("renders loading indicator when isLoading is true", () => {
      render(
        <SearchResultsDropdown
          results={[]}
          isLoading={true}
          hasMore={false}
          onSelectGame={vi.fn()}
          onSeeAll={vi.fn()}
        />
      );
      expect(screen.getByText("Loading...")).toBeDefined();
    });
  });

  describe("no results state", () => {
    it("renders no results message when results array is empty", () => {
      render(
        <SearchResultsDropdown
          results={[]}
          isLoading={false}
          hasMore={false}
          onSelectGame={vi.fn()}
          onSeeAll={vi.fn()}
        />
      );
      expect(screen.getByText("No results found")).toBeDefined();
    });
  });

  describe("results rendering", () => {
    it("displays game title", () => {
      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={vi.fn()}
          onSeeAll={vi.fn()}
        />
      );
      expect(screen.getByText("The Legend of Zelda: Breath of the Wild")).toBeDefined();
    });

    it("displays developer name when available", () => {
      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={vi.fn()}
          onSeeAll={vi.fn()}
        />
      );
      expect(screen.getByText("Nintendo")).toBeDefined();
    });

    it("displays release year when available", () => {
      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={vi.fn()}
          onSeeAll={vi.fn()}
        />
      );
      expect(screen.getByText("2017")).toBeDefined();
    });

    it("displays source badge for local games", () => {
      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={vi.fn()}
          onSeeAll={vi.fn()}
        />
      );
      expect(screen.getByText("Local")).toBeDefined();
    });

    it("displays source badge for IGDB games", () => {
      render(
        <SearchResultsDropdown
          results={[sampleIgdbGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={vi.fn()}
          onSeeAll={vi.fn()}
        />
      );
      expect(screen.getByText("IGDB")).toBeDefined();
    });
  });

  describe("game selection", () => {
    it("calls onSelectGame when a result is clicked", () => {
      const onSelectGame = vi.fn();
      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={vi.fn()}
        />
      );
      const btn = screen.getByText("The Legend of Zelda: Breath of the Wild").closest("button");
      if (btn) {
        fireEvent.click(btn);
        expect(onSelectGame).toHaveBeenCalledWith(sampleLocalGame);
      }
    });

    it("does not call onSelectGame when item is being imported", () => {
      const onSelectGame = vi.fn();
      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={onSelectGame}
          onSeeAll={vi.fn()}
          importingId={sampleLocalGame.id}
        />
      );
      const btn = screen.getByText("The Legend of Zelda: Breath of the Wild").closest("button");
      if (btn) {
        fireEvent.click(btn);
        expect(onSelectGame).not.toHaveBeenCalled();
      }
    });

    it("shows importing indicator for the item being imported", () => {
      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={vi.fn()}
          onSeeAll={vi.fn()}
          importingId={sampleLocalGame.id}
        />
      );
      expect(screen.getByText("Importing...")).toBeDefined();
    });

    it("disables button when item is being imported", () => {
      render(
        <SearchResultsDropdown
          results={[sampleLocalGame]}
          isLoading={false}
          hasMore={false}
          onSelectGame={vi.fn()}
          onSeeAll={vi.fn()}
          importingId={sampleLocalGame.id}
        />
      );
      const btn = screen.getByText("The Legend of Zelda: Breath of the Wild").closest("button");
      expect(btn?.getAttribute("disabled")).toBe("");
    });
  });

  describe("see all functionality", () => {
    it("hides see all button when hasMore is false", () => {
      render(
        <SearchResultsDropdown
          results={sampleResults}
          isLoading={false}
          hasMore={false}
          onSelectGame={vi.fn()}
          onSeeAll={vi.fn()}
        />
      );
      expect(screen.queryByText("See all results")).toBeNull();
    });

    it("calls onSeeAll when see all button is clicked", () => {
      const onSeeAll = vi.fn();
      render(
        <SearchResultsDropdown
          results={sampleResults}
          isLoading={false}
          hasMore={true}
          onSelectGame={vi.fn()}
          onSeeAll={onSeeAll}
        />
      );
      fireEvent.click(screen.getByText("See all results"));
      expect(onSeeAll).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles game without developer", () => {
      render(
        <SearchResultsDropdown
          results={[{ ...sampleLocalGame, developer: undefined }]}
          isLoading={false}
          hasMore={false}
          onSelectGame={vi.fn()}
          onSeeAll={vi.fn()}
        />
      );
      expect(screen.getByText("The Legend of Zelda: Breath of the Wild")).toBeDefined();
      expect(screen.queryByText("Nintendo")).toBeNull();
    });

    it("handles game without release year", () => {
      render(
        <SearchResultsDropdown
          results={[{ ...sampleLocalGame, releaseYear: undefined }]}
          isLoading={false}
          hasMore={false}
          onSelectGame={vi.fn()}
          onSeeAll={vi.fn()}
        />
      );
      expect(screen.queryByText("2017")).toBeNull();
    });

    it("handles game without cover URL", () => {
      render(
        <SearchResultsDropdown
          results={[{ ...sampleLocalGame, coverUrl: undefined }]}
          isLoading={false}
          hasMore={false}
          onSelectGame={vi.fn()}
          onSeeAll={vi.fn()}
        />
      );
      expect(screen.getByText("The Legend of Zelda: Breath of the Wild")).toBeDefined();
    });
  });
});
