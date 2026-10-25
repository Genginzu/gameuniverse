import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

import { ContinuePlayingSection } from "@/components/home/dashboard/ContinuePlayingSection";
import type { GameCardOverlay } from "@/components/games/GameCard";
import type { GameSummary } from "@/types/game";
import type { LibraryGame } from "@/types/library";

const swr = vi.hoisted(() => ({ state: { data: undefined as unknown, error: undefined as unknown } }));

vi.mock("swr", () => ({ default: () => swr.state }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

vi.mock("@/components/games/GameCard", () => ({
  GameCard: ({ game, overlay }: { game: GameSummary; overlay?: GameCardOverlay }) =>
    React.createElement("div", {
      "data-testid": "game-card",
      "data-status": overlay?.type === "library" ? overlay.status : "",
      children: game.title,
    }),
}));

vi.mock("@/components/games/GameCardSkeleton", () => ({
  GameCardSkeleton: () => React.createElement("div", { "data-testid": "card-skeleton" }),
}));

function makeLibraryGame(id: string, libraryStatus: string): LibraryGame {
  return {
    id,
    slug: id,
    title: `Game ${id}`,
    genres: [],
    developer: "",
    publisher: "",
    libraryStatus,
    addedAt: "2026-10-01T00:00:00Z",
    playTimeHours: 3,
  };
}

beforeEach(() => {
  swr.state = { data: undefined, error: undefined };
});

describe("ContinuePlayingSection", () => {
  it("shows skeletons while the library loads", () => {
    render(<ContinuePlayingSection />);
    expect(screen.getAllByTestId("card-skeleton").length).toBeGreaterThan(0);
  });

  it("only lists games with the playing status", () => {
    swr.state = {
      data: {
        games: [
          makeLibraryGame("a", "playing"),
          makeLibraryGame("b", "completed"),
          makeLibraryGame("c", "playing"),
        ],
      },
      error: undefined,
    };
    render(<ContinuePlayingSection />);

    const cards = screen.getAllByTestId("game-card");
    expect(cards.map((n) => n.textContent)).toEqual(["Game a", "Game c"]);
    expect(cards.every((n) => n.dataset.status === "playing")).toBe(true);
  });

  it("shows the empty state with a call to action when nothing is in progress", () => {
    swr.state = { data: { games: [makeLibraryGame("b", "owned")] }, error: undefined };
    render(<ContinuePlayingSection />);
    expect(screen.getByText("empty")).toBeInTheDocument();
    expect(screen.getByText("emptyAction")).toBeInTheDocument();
  });

  it("falls back to the empty state when the library request fails", () => {
    swr.state = { data: undefined, error: new Error("boom") };
    render(<ContinuePlayingSection />);
    expect(screen.queryByTestId("card-skeleton")).not.toBeInTheDocument();
    expect(screen.getByText("empty")).toBeInTheDocument();
  });
});
