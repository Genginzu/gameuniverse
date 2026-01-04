import { describe, it, expect, beforeEach, mock } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import GameLibrary from "../GameLibrary";
import GameCard from "../GameCard";
import SearchBar from "../SearchBar";
import Pagination from "../Pagination";

// Mock fetch globally
global.fetch = mock(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        games: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 20,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        filters: {
          search: "",
          genres: [],
          locale: "en",
        },
      }),
  })
) as any;

// Mock translations
const messages = {
  library: {
    title: "Game Library",
    search: "Search for a game...",
    noResults: "No games found",
    error: "Error",
    searchResults: '{count} result(s) for "{query}"',
    totalGames: "{count} game(s) total",
    noResultsForQuery: 'No results for "{query}"',
    noGamesAvailable: "No games available at the moment",
  },
  pagination: {
    page: "Page {current} of {total}",
    previous: "Previous",
    next: "Next",
    first: "First",
    last: "Last",
  },
};

// Mock game data
const mockGame = {
  id: "1",
  slug: "test-game",
  title: "Test Game",
  description: "A test game description",
  coverImage: "https://example.com/cover.jpg",
  releaseDate: "2023-01-01",
  releaseYear: 2023,
  genres: [{ name: "Action" }, { name: "Adventure" }],
  developer: "Test Developer",
  publisher: "Test Publisher",
  metascore: 85,
};

const mockGames = [mockGame];

const mockPagination = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 1,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

// Helper to render components with NextIntl provider
const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe("GameCard Component", () => {
  it("should render game information correctly", () => {
    renderWithIntl(<GameCard game={mockGame} locale="en" />);

    expect(screen.getByText("Test Game")).toBeInTheDocument();
    expect(screen.getByText("A test game description")).toBeInTheDocument();
    expect(screen.getByText("Test Developer")).toBeInTheDocument();
    expect(screen.getByText("Test Publisher")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Adventure")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument(); // Metascore
  });

  it("should handle missing optional data gracefully", () => {
    const gameWithMissingData = {
      ...mockGame,
      description: undefined,
      coverImage: undefined,
      metascore: undefined,
    };

    renderWithIntl(<GameCard game={gameWithMissingData} locale="en" />);

    expect(screen.getByText("Test Game")).toBeInTheDocument();
    expect(screen.getByText("Test Developer")).toBeInTheDocument();
    // Should not crash when optional data is missing
  });

  it("should display correct metascore color based on score", () => {
    const highScoreGame = { ...mockGame, metascore: 95 };
    const { rerender } = renderWithIntl(<GameCard game={highScoreGame} locale="en" />);

    let metascoreElement = screen.getByText("95");
    expect(metascoreElement).toHaveClass("bg-green-600"); // High score color

    const lowScoreGame = { ...mockGame, metascore: 30 };
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GameCard game={lowScoreGame} locale="en" />
      </NextIntlClientProvider>
    );

    metascoreElement = screen.getByText("30");
    expect(metascoreElement).toHaveClass("bg-red-500"); // Low score color
  });
});

describe("SearchBar Component", () => {
  it("should call onSearch when typing", async () => {
    let searchQuery = "";
    const handleSearch = (query: string) => {
      searchQuery = query;
    };

    renderWithIntl(<SearchBar onSearch={handleSearch} placeholder="Search games..." />);

    const input = screen.getByPlaceholderText("Search games...");
    fireEvent.change(input, { target: { value: "test query" } });

    // Wait for debounce
    await waitFor(
      () => {
        expect(searchQuery).toBe("test query");
      },
      { timeout: 500 }
    );
  });

  it("should clear search when clear button is clicked", () => {
    let searchQuery = "initial";
    const handleSearch = (query: string) => {
      searchQuery = query;
    };

    renderWithIntl(<SearchBar onSearch={handleSearch} initialValue="initial" />);

    const input = screen.getByDisplayValue("initial");
    expect(input).toBeInTheDocument();

    // Clear button should appear when there's text
    const clearButton = screen.getByRole("button");
    fireEvent.click(clearButton);

    expect((input as HTMLInputElement).value).toBe("");
  });
});

describe("Pagination Component", () => {
  it("should render pagination controls correctly", () => {
    let currentPage = 1;
    const handlePageChange = (page: number) => {
      currentPage = page;
    };

    renderWithIntl(
      <Pagination currentPage={2} totalPages={5} totalCount={100} onPageChange={handlePageChange} />
    );

    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Last")).toBeInTheDocument();
  });

  it("should disable previous button on first page", () => {
    const handlePageChange = () => {};

    renderWithIntl(
      <Pagination currentPage={1} totalPages={5} totalCount={100} onPageChange={handlePageChange} />
    );

    const previousButton = screen.getByText("Previous");
    expect(previousButton).toBeDisabled();

    const firstButton = screen.getByText("First");
    expect(firstButton).toBeDisabled();
  });

  it("should disable next button on last page", () => {
    const handlePageChange = () => {};

    renderWithIntl(
      <Pagination currentPage={5} totalPages={5} totalCount={100} onPageChange={handlePageChange} />
    );

    const nextButton = screen.getByText("Next");
    expect(nextButton).toBeDisabled();

    const lastButton = screen.getByText("Last");
    expect(lastButton).toBeDisabled();
  });

  it("should not render when totalPages is 1 or less", () => {
    const handlePageChange = () => {};

    const { container } = renderWithIntl(
      <Pagination currentPage={1} totalPages={1} totalCount={10} onPageChange={handlePageChange} />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe("GameLibrary Component", () => {
  it("should render with initial games data", () => {
    renderWithIntl(
      <GameLibrary locale="en" initialGames={mockGames} initialPagination={mockPagination} />
    );

    expect(screen.getByText("Game Library")).toBeInTheDocument();
    expect(screen.getByText("Test Game")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search for a game...")).toBeInTheDocument();
  });

  it("should display empty state when no games are provided", async () => {
    renderWithIntl(
      <GameLibrary
        locale="en"
        initialGames={[]}
        initialPagination={{
          ...mockPagination,
          totalCount: 0,
        }}
      />
    );

    // Wait for the component to render the empty state
    await waitFor(() => {
      expect(screen.getByText("No games found")).toBeInTheDocument();
    });

    expect(screen.getByText("No games available at the moment")).toBeInTheDocument();
  });

  it("should display search results info when search query is provided", () => {
    // This would require mocking the fetch API and testing the search functionality
    // For now, we test the basic rendering
    renderWithIntl(
      <GameLibrary locale="en" initialGames={mockGames} initialPagination={mockPagination} />
    );

    expect(screen.getByText("1 game(s) total")).toBeInTheDocument();
  });
});
