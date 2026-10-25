import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

import { PlayerLibraryGrid } from "@/components/players/PlayerLibraryGrid";
import type { PlayerLibraryGame } from "@/types/player";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

vi.mock("@/components/games/GameCard", () => ({
  GameCard: ({ game, quickAdd }: { game: { title: string }; quickAdd?: boolean }) =>
    React.createElement("div", { "data-testid": "game-card", "data-quick-add": String(quickAdd) }, game.title),
}));

vi.mock("@/components/providers/LibraryStatusProvider", () => ({
  LibraryStatusProvider: ({ gameIds, children }: { gameIds: string[]; children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "status-provider", "data-ids": gameIds.join(",") }, children),
}));

const GAME = {
  id: "row-1",
  gameId: "g1",
  slug: "hades",
  title: "Hades",
  coverImage: null,
  status: "owned",
  rating: null,
  playTimeHours: 0,
  addedAt: "2026-01-01T00:00:00Z",
} as unknown as PlayerLibraryGame;

describe("PlayerLibraryGrid", () => {
  it("offers the quick add with batch-seeded statuses on another player's library", () => {
    render(<PlayerLibraryGrid games={[GAME]} locale="fr" />);

    expect(screen.getByTestId("game-card")).toHaveAttribute("data-quick-add", "true");
    expect(screen.getByTestId("status-provider")).toHaveAttribute("data-ids", "g1");
  });

  it("drops the quick add and its status request on the player's own profile", () => {
    render(<PlayerLibraryGrid games={[GAME]} locale="fr" quickAdd={false} />);

    expect(screen.getByTestId("game-card")).toHaveAttribute("data-quick-add", "false");
    expect(screen.getByTestId("status-provider")).toHaveAttribute("data-ids", "");
  });
});
