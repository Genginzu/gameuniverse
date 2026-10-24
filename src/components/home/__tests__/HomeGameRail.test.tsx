import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

import { HomeGameRail } from "@/components/home/dashboard/HomeGameRail";
import type { GameSummary } from "@/types/game";

vi.mock("@/components/games/GameCard", () => ({
  GameCard: ({ game, priority }: { game: GameSummary; priority: boolean }) =>
    React.createElement("div", {
      "data-testid": "game-card",
      "data-priority": String(priority),
      children: game.title,
    }),
}));

vi.mock("@/components/games/GameCardSkeleton", () => ({
  GameCardSkeleton: () => React.createElement("div", { "data-testid": "card-skeleton" }),
}));

function makeGame(id: string): GameSummary {
  return { id, slug: id, title: `Game ${id}`, genres: [], developer: "", publisher: "" };
}

const EMPTY = <p>empty-state</p>;

describe("HomeGameRail", () => {
  it("renders card skeletons while loading without items", () => {
    render(<HomeGameRail label="rail" items={[]} isLoading empty={EMPTY} />);
    expect(screen.getAllByTestId("card-skeleton")).toHaveLength(6);
    expect(screen.queryByText("empty-state")).not.toBeInTheDocument();
  });

  it("renders the empty state once loaded without items", () => {
    render(<HomeGameRail label="rail" items={[]} isLoading={false} empty={EMPTY} />);
    expect(screen.getByText("empty-state")).toBeInTheDocument();
  });

  it("renders one card per item and prioritises the leading covers", () => {
    const items = ["a", "b", "c"].map((id) => ({ game: makeGame(id) }));
    render(
      <HomeGameRail label="rail" items={items} isLoading={false} empty={EMPTY} priorityCount={2} />
    );

    expect(screen.getByRole("list", { name: "rail" })).toBeInTheDocument();
    const priorities = screen.getAllByTestId("game-card").map((n) => n.dataset.priority);
    expect(priorities).toEqual(["true", "true", "false"]);
  });

  it("renders the per-card action and caption next to the card", () => {
    render(
      <HomeGameRail
        label="rail"
        items={[
          {
            game: makeGame("a"),
            caption: "Close to Source",
            action: <button type="button">hide</button>,
          },
        ]}
        isLoading={false}
        empty={EMPTY}
      />
    );
    expect(screen.getByRole("button", { name: "hide" })).toBeInTheDocument();
    expect(screen.getByText("Close to Source")).toBeInTheDocument();
  });

  it("keeps showing items during a background revalidation", () => {
    render(
      <HomeGameRail label="rail" items={[{ game: makeGame("a") }]} isLoading empty={EMPTY} />
    );
    expect(screen.getByText("Game a")).toBeInTheDocument();
    expect(screen.queryByTestId("card-skeleton")).not.toBeInTheDocument();
  });
});
