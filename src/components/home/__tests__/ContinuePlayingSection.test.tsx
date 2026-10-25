import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ContinuePlayingSection } from "@/components/home/dashboard/ContinuePlayingSection";
import type { GameCardOverlay } from "@/components/games/GameCard";
import { PLAYING_SUGGESTIONS_URL } from "@/hooks/usePlayingSuggestions";
import type { GameSummary } from "@/types/game";
import type { LibraryGame } from "@/types/library";

type SwrState = { data?: unknown; error?: unknown };
const swr = vi.hoisted(() => ({
  playing: {} as SwrState,
  suggestions: {} as SwrState,
  keys: [] as unknown[],
}));
vi.mock("swr", () => ({
  default: (key: string | null) => {
    swr.keys.push(key);
    if (key === null) return { data: undefined, error: undefined };
    return key.includes("status=owned") ? swr.suggestions : swr.playing;
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { title?: string }) =>
    values?.title ? `${key}:${values.title}` : key,
}));

const toastMock = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/use-toast", () => ({ toast: toastMock }));

const statusChange = vi.hoisted(() => ({ trigger: vi.fn() }));
vi.mock("@/hooks/useLibraryStatusChange", () => ({
  useLibraryStatusChange: () => ({ trigger: statusChange.trigger, isPending: false }),
}));

vi.mock("@/components/games/GameCard", () => ({
  GameCard: ({
    game,
    overlay,
    actions,
  }: {
    game: GameSummary;
    overlay?: GameCardOverlay;
    actions?: React.ReactNode;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": "game-card",
        "data-status": overlay?.type === "library" ? overlay.status : "",
      },
      React.createElement("span", null, game.title),
      actions
    ),
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

const playing = (...ids: string[]) => ({ games: ids.map((id) => makeLibraryGame(id, "playing")) });
const owned = (...ids: string[]) => ({ games: ids.map((id) => makeLibraryGame(id, "owned")) });
const titles = () => screen.getAllByTestId("game-card").map((n) => n.firstChild?.textContent);

beforeEach(() => {
  swr.playing = {};
  swr.suggestions = {};
  swr.keys = [];
  toastMock.mockReset();
  statusChange.trigger = vi.fn().mockResolvedValue({});
});

describe("ContinuePlayingSection", () => {
  it("shows skeletons while the library loads", () => {
    render(<ContinuePlayingSection />);
    expect(screen.getAllByTestId("card-skeleton").length).toBeGreaterThan(0);
  });

  it("only lists games with the playing status", () => {
    swr.playing = {
      data: { games: [makeLibraryGame("a", "playing"), makeLibraryGame("b", "completed")] },
    };
    swr.suggestions = { data: owned() };
    render(<ContinuePlayingSection />);

    expect(titles()).toEqual(["Game a"]);
    expect(screen.getByTestId("game-card").dataset.status).toBe("playing");
  });

  it("fills the rail up to 5 cards with owned games after a separator", () => {
    swr.playing = { data: playing("p1", "p2") };
    swr.suggestions = { data: owned("o1", "o2", "o3", "o4", "o5") };
    render(<ContinuePlayingSection />);

    expect(titles()).toEqual(["Game p1", "Game p2", "Game o1", "Game o2", "Game o3"]);
    expect(screen.getByTestId("rail-suggestions-separator")).toHaveTextContent(
      "suggestionsSeparator"
    );
    expect(screen.getAllByRole("button", { name: /^markPlayingLabel:/ })).toHaveLength(3);
    expect(swr.keys).toContain(PLAYING_SUGGESTIONS_URL);
  });

  it("does not fetch suggestions once 5 games are in progress", () => {
    swr.playing = { data: playing("1", "2", "3", "4", "5") };
    render(<ContinuePlayingSection />);

    expect(swr.keys).not.toContain(PLAYING_SUGGESTIONS_URL);
    expect(screen.queryByTestId("rail-suggestions-separator")).not.toBeInTheDocument();
  });

  it("shows only suggestions, with a prompt and no separator, when nothing is in progress", () => {
    swr.playing = { data: playing() };
    swr.suggestions = { data: owned("o1") };
    render(<ContinuePlayingSection />);

    expect(screen.getByText("suggestionsTitle")).toBeInTheDocument();
    expect(titles()).toEqual(["Game o1"]);
    expect(screen.queryByTestId("rail-suggestions-separator")).not.toBeInTheDocument();
  });

  it("switches a suggested game to playing in one click", () => {
    swr.playing = { data: playing("p1") };
    swr.suggestions = { data: owned("o1") };
    render(<ContinuePlayingSection />);

    fireEvent.click(screen.getByRole("button", { name: "markPlayingLabel:Game o1" }));

    expect(statusChange.trigger).toHaveBeenCalledWith({ gameId: "o1", status: "playing" });
  });

  it("reports a failed switch", async () => {
    swr.playing = { data: playing() };
    swr.suggestions = { data: owned("o1") };
    statusChange.trigger = vi.fn().mockRejectedValue(new Error("boom"));
    render(<ContinuePlayingSection />);

    fireEvent.click(screen.getByRole("button", { name: "markPlayingLabel:Game o1" }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({ title: "markPlayingError", variant: "destructive" })
    );
  });

  it("explains how to start a game when nothing is in progress nor owned", () => {
    swr.playing = { data: playing() };
    swr.suggestions = { data: owned() };
    render(<ContinuePlayingSection />);

    expect(screen.getByText("empty")).toBeInTheDocument();
    expect(screen.getByText("emptyAction").closest("a")).toHaveAttribute("href", "/library");
  });

  it("still suggests owned games when the playing request fails", () => {
    swr.playing = { error: new Error("boom") };
    swr.suggestions = { data: owned("o1") };
    render(<ContinuePlayingSection />);

    expect(screen.queryByTestId("card-skeleton")).not.toBeInTheDocument();
    expect(titles()).toEqual(["Game o1"]);
  });
});
