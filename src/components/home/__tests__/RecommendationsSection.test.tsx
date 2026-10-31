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

const dismissal = vi.hoisted(() => ({
  state: {
    dismiss: (() => Promise.resolve()) as (rec: unknown) => Promise<void>,
    undo: (() => Promise.resolve()) as () => Promise<void>,
    lastDismissed: null as { id: string; slug: string; title: string } | null,
    failed: false,
    isPending: false,
  },
}));

vi.mock("@/hooks/useDismissWithUndo", () => ({
  useDismissWithUndo: () => dismissal.state,
}));
const addition = vi.hoisted(() => ({
  state: {
    lastAdded: null as {
      id: string;
      slug: string;
      title: string;
      list: "library" | "wishlist";
    } | null,
    callbacksFor: (() => ({})) as (rec: unknown) => Record<string, unknown>,
  },
}));

vi.mock("@/hooks/useRecommendationQuickAdd", () => ({
  useRecommendationQuickAdd: () => addition.state,
}));

vi.mock("next-intl", () => {
  const t = Object.assign((key: string) => key, {
    rich: (key: string, values: Record<string, unknown>) => {
      const game = values.game as ((chunks: string) => React.ReactNode) | undefined;
      return React.createElement("span", null, key, " ", game?.(String(values.title)));
    },
  });
  return { useTranslations: () => t };
});

const cardProps = vi.hoisted(() => ({ calls: [] as Array<Record<string, unknown>> }));

vi.mock("@/components/games/GameCard", () => ({
  GameCard: (props: {
    game: GameSummary;
    quickAdd?: boolean;
    quickAddLeading?: React.ReactNode;
    quickAddCallbacks?: unknown;
  }) => {
    cardProps.calls.push(props);
    return React.createElement(
      "div",
      { "data-testid": "game-card" },
      props.game.title,
      props.quickAddLeading
    );
  },
}));

vi.mock("@/components/games/GameCardSkeleton", () => ({
  GameCardSkeleton: () => React.createElement("div", { "data-testid": "card-skeleton" }),
}));

vi.mock("@/components/providers/LibraryStatusProvider", () => ({
  LibraryStatusProvider: ({ children }: { children: React.ReactNode }) => children,
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
  dismissal.state = {
    dismiss: vi.fn().mockResolvedValue(undefined),
    undo: vi.fn().mockResolvedValue(undefined),
    lastDismissed: null,
    failed: false,
    isPending: false,
  };
  addition.state = {
    lastAdded: null,
    callbacksFor: vi.fn(() => ({ onAdd: vi.fn() })),
  };
  cardProps.calls = [];
});

describe("RecommendationsSection feedback", () => {
  it("dismisses a pick from its card", () => {
    recs.state = { ...recs.state, recommendations: [REC], basedOnGameCount: 4 };
    render(<RecommendationsSection />);

    fireEvent.click(screen.getByRole("button", { name: "dismiss" }));

    expect(dismissal.state.dismiss).toHaveBeenCalledWith(REC);
  });

  it("offers an undo after a dismissal, with a link to the dismissed game", () => {
    recs.state = { ...recs.state, recommendations: [REC], basedOnGameCount: 4 };
    dismissal.state = {
      ...dismissal.state,
      lastDismissed: { id: "x", slug: "gone-slug", title: "Gone" },
    };
    render(<RecommendationsSection />);

    expect(screen.getByRole("status")).toHaveTextContent("dismissed");
    expect(screen.getByRole("link", { name: "Gone" })).toHaveAttribute("href", "/games/gone-slug");
    fireEvent.click(screen.getByRole("button", { name: "undo" }));
    expect(dismissal.state.undo).toHaveBeenCalled();
  });

  it("reports a failed dismissal", () => {
    recs.state = { ...recs.state, recommendations: [REC], basedOnGameCount: 4 };
    dismissal.state = { ...dismissal.state, failed: true };
    render(<RecommendationsSection />);

    expect(screen.getByRole("alert")).toHaveTextContent("dismissError");
  });

  it("uses the shared card quick add, wired to the recommendation", () => {
    recs.state = { ...recs.state, recommendations: [REC], basedOnGameCount: 4 };
    render(<RecommendationsSection />);

    const props = cardProps.calls.at(-1);
    expect(props?.quickAdd).toBe(true);
    expect(addition.state.callbacksFor).toHaveBeenCalledWith(REC);
    expect(props?.quickAddCallbacks).toEqual({ onAdd: expect.any(Function) });
  });

  it("confirms an addition with a link to the added game, without undo", () => {
    recs.state = { ...recs.state, recommendations: [REC], basedOnGameCount: 5 };
    addition.state = {
      ...addition.state,
      lastAdded: { id: "a", slug: "added-slug", title: "Added", list: "library" },
    };
    render(<RecommendationsSection />);

    expect(screen.getByRole("status")).toHaveTextContent("added");
    expect(screen.getByRole("link", { name: "Added" })).toHaveAttribute("href", "/games/added-slug");
    expect(screen.queryByRole("button", { name: "undo" })).not.toBeInTheDocument();
    expect(screen.queryByText("basedOn")).not.toBeInTheDocument();
  });

  it("confirms an addition to the wishlist", () => {
    recs.state = { ...recs.state, recommendations: [REC], basedOnGameCount: 5 };
    addition.state = {
      ...addition.state,
      lastAdded: { id: "a", slug: "wished-slug", title: "Wished", list: "wishlist" },
    };
    render(<RecommendationsSection />);

    expect(screen.getByRole("status")).toHaveTextContent("wishlisted");
    expect(screen.getByRole("link", { name: "Wished" })).toHaveAttribute(
      "href",
      "/games/wished-slug"
    );
  });

  it("disables the dismiss button while a dismissal is pending", () => {
    recs.state = { ...recs.state, recommendations: [REC], basedOnGameCount: 4 };
    dismissal.state = { ...dismissal.state, isPending: true };
    render(<RecommendationsSection />);

    expect(screen.getByRole("button", { name: "dismiss" })).toBeDisabled();
  });
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
