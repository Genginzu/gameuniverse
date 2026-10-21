import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

import { HomeLanding } from "@/components/home/HomeLanding";
import type { HomeApiResponse } from "@/types/home";

const { stub } = vi.hoisted(() => ({
  stub: (testId: string) => () => React.createElement("section", { "data-testid": testId }),
}));

vi.mock("@/components/home/HeroSection", () => ({ HeroSection: stub("hero") }));
vi.mock("@/components/home/MarqueeSection", () => ({ MarqueeSection: stub("marquee") }));
vi.mock("@/components/home/TrendingSection", () => ({ TrendingSection: stub("trending") }));
vi.mock("@/components/home/CtaSection", () => ({ CtaSection: stub("cta") }));
vi.mock("@/components/home/StatsSection", () => ({ StatsSection: stub("stats") }));
vi.mock("@/components/home/previews/ProductPreviewsSection", () => ({
  ProductPreviewsSection: stub("previews"),
}));

const BASE: HomeApiResponse = {
  trending: [],
  upcoming: [],
  popularCharacters: [],
  recentReviews: [],
  showcaseGames: [],
  showcaseCharacters: [],
  stats: { games: 1, characters: 2, players: 3, reviews: 4 },
};

describe("HomeLanding", () => {
  it("renders sections in order: hero, marquee, previews, trending, stats, cta", () => {
    const { container } = render(<HomeLanding data={BASE} />);
    const order = Array.from(container.querySelectorAll("[data-testid]")).map((n) =>
      n.getAttribute("data-testid")
    );
    expect(order).toEqual(["hero", "marquee", "previews", "trending", "stats", "cta"]);
  });

  it("hides the stats section when counts are unavailable", () => {
    render(<HomeLanding data={{ ...BASE, stats: null }} />);
    expect(screen.queryByTestId("stats")).not.toBeInTheDocument();
  });

  it("hides the stats section without initial data", () => {
    render(<HomeLanding />);
    expect(screen.queryByTestId("stats")).not.toBeInTheDocument();
    expect(screen.getByTestId("previews")).toBeInTheDocument();
  });
});
