import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { ProductPreviewsSection } from "@/components/home/previews/ProductPreviewsSection";
import type { GameSummary } from "@/types/game";
import type { HomeApiResponse } from "@/types/home";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock("@/hooks/useMyReports", () => ({
  useMyReports: () => ({ findReport: () => undefined, mutate: vi.fn(), isLoading: false }),
}));

const game = (id: string): GameSummary => ({
  id,
  slug: `game-${id}`,
  title: `Game ${id}`,
  coverImage: `https://img/${id}.jpg`,
  genres: [],
  developer: "Studio",
  publisher: "Publisher",
});

const DATA: HomeApiResponse = {
  trending: ["1", "2", "3", "4"].map(game),
  upcoming: ["5", "6"].map(game),
  popularCharacters: [
    { id: "c1", slug: "kratos", name: "Kratos", mainImage: "https://img/k.jpg", gamesCount: 1 },
  ],
  recentReviews: [],
  showcaseGames: [],
  showcaseCharacters: [],
  stats: null,
};

const KEYS = ["library", "characters", "community", "search", "tracking", "reviews"];

describe("ProductPreviewsSection", () => {
  it("renders the 6 pillars in order, each with a single catalogue link", () => {
    render(<ProductPreviewsSection data={DATA} />);

    for (const key of KEYS) {
      const block = screen.getByTestId(`home-preview-${key}`);
      expect(within(block).getByText(`items.${key}.title`)).toBeInTheDocument();

      const links = within(block).getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0].getAttribute("href")).not.toContain("/auth");
    }
  });

  it("renders decorative, non-interactive mockups built from live data", () => {
    render(<ProductPreviewsSection data={DATA} />);

    const frames = screen.getAllByTestId("home-preview-frame");
    expect(frames).toHaveLength(6);
    for (const frame of frames) {
      expect(frame).toHaveAttribute("aria-hidden", "true");
      expect(frame.hasAttribute("inert")).toBe(true);
    }

    const library = screen.getByTestId("home-preview-library");
    expect(within(library).getAllByTestId("editorial-card")).toHaveLength(3);
  });

  it("uses the admin showcase for the library and characters blocks", () => {
    render(
      <ProductPreviewsSection
        data={{
          ...DATA,
          showcaseGames: [{ game: game("9"), status: "completed" }],
          showcaseCharacters: [
            { id: "c9", slug: "aloy", name: "Aloy", mainImage: "https://img/a.jpg", gamesCount: 1 },
          ],
        }}
      />
    );

    const library = screen.getByTestId("home-preview-library");
    const cards = within(library).getAllByTestId("editorial-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveAttribute("data-game-id", "9");
    expect(within(library).getByText("completed")).toBeInTheDocument();

    const characters = screen.getByTestId("home-preview-characters");
    expect(characters.innerHTML).toContain("/characters/aloy");
    expect(characters.innerHTML).not.toContain("/characters/kratos");
  });

  it("falls back to upcoming games when trending is empty", () => {
    render(<ProductPreviewsSection data={{ ...DATA, trending: [] }} />);

    const library = screen.getByTestId("home-preview-library");
    expect(within(library).getAllByTestId("editorial-card")).toHaveLength(2);
  });

  it("falls back to placeholders and demo content without data", () => {
    render(<ProductPreviewsSection />);

    expect(screen.getAllByText("empty").length).toBeGreaterThan(0);
    expect(screen.getByTestId("home-preview-reviews").textContent).toContain("NovaRunner");
  });
});
