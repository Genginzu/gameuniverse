import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlobalSearchDropdown } from "@/components/shared/GlobalSearchDropdown";
import type { GlobalSearchResponse } from "@/types/global-search";
import { flattenResults, type FlatSearchItem } from "@/lib/utils/global-search-utils";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      "categories.games": "Jeux",
      "categories.characters": "Personnages",
      "categories.players": "Joueurs",
      noResults: "Aucun résultat trouvé",
      loading: "Recherche en cours...",
      "source.local": "En bibliothèque",
      "source.igdb": "IGDB",
    };
    return messages[key] ?? key;
  },
}));

const mockGame = {
  id: "g1",
  slug: "zelda",
  title: "Zelda",
  source: "local" as const,
};

const mockCharacter = {
  id: "c1",
  slug: "link",
  name: "Link",
  role: "Hero",
  primaryGame: "Zelda",
};

const mockPlayer = {
  id: "p1",
  username: "player1",
};

function buildResults(
  games: GlobalSearchResponse["games"] = [],
  characters: GlobalSearchResponse["characters"] = [],
  players: GlobalSearchResponse["players"] = []
): GlobalSearchResponse {
  return {
    games,
    characters,
    players,
    counts: {
      games: games.length,
      characters: characters.length,
      players: players.length,
    },
  };
}

describe("GlobalSearchDropdown", () => {
  it("shows loading state", () => {
    const results = buildResults();
    render(
      <GlobalSearchDropdown
        results={results}
        flatItems={[]}
        activeIndex={-1}
        isLoading={true}
        onSelect={vi.fn()}
        importingId={null}
      />
    );
    expect(screen.getByText("Recherche en cours...")).toBeInTheDocument();
  });

  it("shows no results message when all categories are empty", () => {
    const results = buildResults();
    render(
      <GlobalSearchDropdown
        results={results}
        flatItems={[]}
        activeIndex={-1}
        isLoading={false}
        onSelect={vi.fn()}
        importingId={null}
      />
    );
    expect(screen.getByText("Aucun résultat trouvé")).toBeInTheDocument();
  });

  it("renders grouped results with section headers", () => {
    const results = buildResults([mockGame], [mockCharacter], [mockPlayer]);
    const flatItems = flattenResults(results);

    render(
      <GlobalSearchDropdown
        results={results}
        flatItems={flatItems}
        activeIndex={-1}
        isLoading={false}
        onSelect={vi.fn()}
        importingId={null}
      />
    );

    expect(screen.getByText("Jeux")).toBeInTheDocument();
    expect(screen.getByText("Personnages")).toBeInTheDocument();
    expect(screen.getByText("Joueurs")).toBeInTheDocument();
    expect(screen.getByText("Zelda")).toBeInTheDocument();
    expect(screen.getByText("Link")).toBeInTheDocument();
    expect(screen.getByText("player1")).toBeInTheDocument();
  });

  it("hides empty categories", () => {
    const results = buildResults([mockGame], [], []);
    const flatItems = flattenResults(results);

    render(
      <GlobalSearchDropdown
        results={results}
        flatItems={flatItems}
        activeIndex={-1}
        isLoading={false}
        onSelect={vi.fn()}
        importingId={null}
      />
    );

    expect(screen.getByText("Jeux")).toBeInTheDocument();
    expect(screen.queryByText("Personnages")).not.toBeInTheDocument();
    expect(screen.queryByText("Joueurs")).not.toBeInTheDocument();
  });

  it("highlights active item based on activeIndex", () => {
    const results = buildResults([mockGame], [mockCharacter], []);
    const flatItems = flattenResults(results);

    // activeIndex=1 → the character item (second in flat list)
    render(
      <GlobalSearchDropdown
        results={results}
        flatItems={flatItems}
        activeIndex={1}
        isLoading={false}
        onSelect={vi.fn()}
        importingId={null}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).not.toHaveAttribute("data-active");
    expect(buttons[1]).toHaveAttribute("data-active");
  });

  it("calls onSelect when an item is clicked", () => {
    const results = buildResults([mockGame], [], []);
    const flatItems = flattenResults(results);
    const onSelect = vi.fn();

    render(
      <GlobalSearchDropdown
        results={results}
        flatItems={flatItems}
        activeIndex={-1}
        isLoading={false}
        onSelect={onSelect}
        importingId={null}
      />
    );

    fireEvent.click(screen.getByText("Zelda"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "g1", type: "game" }));
  });

  it("renders display order: games → characters → players", () => {
    const results = buildResults([mockGame], [mockCharacter], [mockPlayer]);
    const flatItems = flattenResults(results);

    const { container } = render(
      <GlobalSearchDropdown
        results={results}
        flatItems={flatItems}
        activeIndex={-1}
        isLoading={false}
        onSelect={vi.fn()}
        importingId={null}
      />
    );

    const sections = container.querySelectorAll("section");
    expect(sections).toHaveLength(3);
    expect(sections[0]).toHaveTextContent("Jeux");
    expect(sections[1]).toHaveTextContent("Personnages");
    expect(sections[2]).toHaveTextContent("Joueurs");
  });
});
