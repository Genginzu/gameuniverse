import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { RecommendationsSection } from "@/components/home/dashboard/RecommendationsSection";
import type { GameSummary } from "@/types/game";
import type { GameRecommendation } from "@/types/recommendation";

const recs = vi.hoisted(() => ({
  state: {
    recommendations: [] as GameRecommendation[],
    basedOnGameCount: 0,
    loading: false,
    recomputing: false,
    error: null as string | null,
    recompute: (() => Promise.resolve()) as () => Promise<void>,
  },
}));

vi.mock("@/hooks/usePersonalRecommendations", () => ({
  usePersonalRecommendations: () => recs.state,
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

vi.mock("@/components/games/GameCard", () => ({
  GameCard: ({ game }: { game: GameSummary }) =>
    React.createElement("div", { "data-testid": "game-card", children: game.title }),
}));

vi.mock("@/components/games/GameCardSkeleton", () => ({
  GameCardSkeleton: () => React.createElement("div", { "data-testid": "card-skeleton" }),
}));

const REC: GameRecommendation = {
  id: "r1",
  slug: "r1",
  title: "Recommended",
  coverImage: null,
  genres: [],
  developer: "Studio",
  metascore: null,
  combinedScore: 1,
};

beforeEach(() => {
  recs.state = {
    recommendations: [],
    basedOnGameCount: 0,
    loading: false,
    recomputing: false,
    error: null,
    recompute: vi.fn().mockResolvedValue(undefined),
  };
});

describe("RecommendationsSection", () => {
  it("renders the recommended games", () => {
    recs.state = { ...recs.state, recommendations: [REC], basedOnGameCount: 4 };
    render(<RecommendationsSection />);
    expect(screen.getByText("Recommended")).toBeInTheDocument();
    expect(screen.getByText("basedOn")).toBeInTheDocument();
  });

  it("invites to fill the library when it is empty, without a recompute button", () => {
    render(<RecommendationsSection />);
    expect(screen.getByText("emptyLibrary")).toBeInTheDocument();
    expect(screen.getByText("emptyAction")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "recompute" })).not.toBeInTheDocument();
  });

  it("shows a neutral message when the library has games but no recommendation", () => {
    recs.state = { ...recs.state, basedOnGameCount: 3 };
    render(<RecommendationsSection />);
    expect(screen.getByText("empty")).toBeInTheDocument();
    expect(screen.queryByText("emptyAction")).not.toBeInTheDocument();
  });

  it("shows skeletons and a visible progress notice while loading", () => {
    recs.state = { ...recs.state, loading: true };
    render(<RecommendationsSection />);
    expect(screen.getAllByTestId("card-skeleton").length).toBeGreaterThan(0);
    expect(screen.getByRole("status")).toHaveTextContent("loading");
    expect(screen.queryByText("loadingSlow")).not.toBeInTheDocument();
  });

  it("adds a reassurance hint when loading takes a while", () => {
    vi.useFakeTimers();
    recs.state = { ...recs.state, loading: true };
    render(<RecommendationsSection />);

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getByText("loadingSlow")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("relaunches the computation when the recompute button is clicked", () => {
    recs.state = { ...recs.state, recommendations: [REC], basedOnGameCount: 4 };
    render(<RecommendationsSection />);

    fireEvent.click(screen.getByRole("button", { name: "recompute" }));

    expect(recs.state.recompute).toHaveBeenCalledTimes(1);
  });

  it("shows the progress notice and skeletons instead of stale cards while recomputing", () => {
    recs.state = { ...recs.state, recommendations: [REC], basedOnGameCount: 4, recomputing: true };
    render(<RecommendationsSection />);

    expect(screen.getByRole("status")).toHaveTextContent("loading");
    expect(screen.getAllByTestId("card-skeleton").length).toBeGreaterThan(0);
    expect(screen.queryByText("Recommended")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "recompute" })).toBeDisabled();
  });

  it("keeps the previous cards and reports a failed recomputation", () => {
    recs.state = {
      ...recs.state,
      recommendations: [REC],
      basedOnGameCount: 4,
      error: "Too many requests",
    };
    render(<RecommendationsSection />);

    expect(screen.getByText("Recommended")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("recomputeError");
  });
});
