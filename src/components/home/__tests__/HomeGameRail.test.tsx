import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

import { HomeGameRail } from "@/components/home/dashboard/HomeGameRail";
import type { GameSummary } from "@/types/game";

vi.mock("@/components/games/GameCard", () => ({
  GameCard: ({
    game,
    priority,
    actions,
    quickAdd,
  }: {
    game: GameSummary;
    priority: boolean;
    actions?: React.ReactNode;
    quickAdd?: boolean;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": "game-card",
        "data-priority": String(priority),
        "data-quick-add": String(quickAdd),
      },
      game.title,
      actions
    ),
}));

vi.mock("@/components/providers/LibraryStatusProvider", () => ({
  LibraryStatusProvider: ({ gameIds, children }: { gameIds: string[]; children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "status-provider", "data-ids": gameIds.join(",") }, children),
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

  it("renders the per-card action next to the card link", () => {
    render(
      <HomeGameRail
        label="rail"
        items={[{ game: makeGame("a"), action: <button type="button">hide</button> }]}
        isLoading={false}
        empty={EMPTY}
      />
    );
    expect(screen.getByRole("button", { name: "hide" })).toBeInTheDocument();
  });

  it("offers the quick add with batch-seeded statuses only when asked", () => {
    const items = ["a", "b"].map((id) => ({ game: makeGame(id) }));
    const { rerender } = render(
      <HomeGameRail label="rail" items={items} isLoading={false} empty={EMPTY} />
    );
    expect(screen.queryByTestId("status-provider")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("game-card")[0]).toHaveAttribute("data-quick-add", "false");

    rerender(<HomeGameRail label="rail" items={items} isLoading={false} empty={EMPTY} quickAdd />);
    expect(screen.getByTestId("status-provider")).toHaveAttribute("data-ids", "a,b");
    expect(screen.getAllByTestId("game-card")[0]).toHaveAttribute("data-quick-add", "true");
  });

  it("keeps showing items during a background revalidation", () => {
    render(
      <HomeGameRail label="rail" items={[{ game: makeGame("a") }]} isLoading empty={EMPTY} />
    );
    expect(screen.getByText("Game a")).toBeInTheDocument();
    expect(screen.queryByTestId("card-skeleton")).not.toBeInTheDocument();
  });
});
