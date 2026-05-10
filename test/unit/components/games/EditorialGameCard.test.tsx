import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

import type { GameSummary } from "@/types/game";

// Mock @/i18n/navigation Link to a simple anchor
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    className,
    "data-testid": dataTestId,
    "data-game-id": dataGameId,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    "data-testid"?: string;
    "data-game-id"?: string;
  }) =>
    React.createElement(
      "a",
      {
        href,
        className,
        "data-testid": dataTestId,
        "data-game-id": dataGameId,
      },
      children
    ),
}));

// Mock next/image to a plain <img> for predictable rendering in tests
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) =>
    React.createElement("img", { src, alt, className, "data-testid": "next-image" }),
}));

import { EditorialGameCard } from "@/components/games/EditorialGameCard";

function makeGame(overrides: Partial<GameSummary> = {}): GameSummary {
  return {
    id: "game-1",
    slug: "zelda-totk",
    title: "Tears of the Kingdom",
    coverImage: "/covers/totk.jpg",
    developer: "Nintendo",
    publisher: "Nintendo",
    releaseYear: 2023,
    genres: [{ name: "Action-adventure" }],
    isEsport: false,
    ...overrides,
  } as GameSummary;
}

describe("EditorialGameCard", () => {
  it("renders a link to /games/{slug}", () => {
    render(<EditorialGameCard game={makeGame()} />);
    const link = screen.getByTestId("editorial-game-card");
    expect(link.getAttribute("href")).toBe("/games/zelda-totk");
  });

  it("exposes the game id via data-game-id (useful for tests / instrumentation)", () => {
    render(<EditorialGameCard game={makeGame({ id: "abc-123" })} />);
    const link = screen.getByTestId("editorial-game-card");
    expect(link.getAttribute("data-game-id")).toBe("abc-123");
  });

  it("renders the title in the footer", () => {
    render(<EditorialGameCard game={makeGame({ title: "Elden Ring" })} />);
    expect(screen.getByText("Elden Ring")).toBeDefined();
  });

  it("renders the release year when available", () => {
    render(<EditorialGameCard game={makeGame({ releaseYear: 2017 })} />);
    expect(screen.getByText("2017")).toBeDefined();
  });

  it("does not render the year when releaseYear is missing", () => {
    const { container } = render(
      <EditorialGameCard game={makeGame({ releaseYear: undefined })} />
    );
    expect(container.querySelector(".editorial-game-card-year")).toBeNull();
  });

  it("renders the cover image when coverImage is provided", () => {
    render(<EditorialGameCard game={makeGame()} />);
    const image = screen.getByTestId("next-image");
    expect(image.getAttribute("src")).toBe("/covers/totk.jpg");
    expect(image.getAttribute("alt")).toBe("Tears of the Kingdom");
  });

  it("renders the placeholder icon when coverImage is missing", () => {
    render(<EditorialGameCard game={makeGame({ coverImage: undefined })} />);
    expect(screen.queryByTestId("next-image")).toBeNull();
    // Placeholder div is rendered
    const link = screen.getByTestId("editorial-game-card");
    expect(link.querySelector(".editorial-game-card-placeholder")).not.toBeNull();
  });

  it("renders the ESPORT badge when isEsport is true", () => {
    render(<EditorialGameCard game={makeGame({ isEsport: true })} />);
    expect(screen.getByText("ESPORT")).toBeDefined();
  });

  it("does not render the ESPORT badge when isEsport is false", () => {
    render(<EditorialGameCard game={makeGame({ isEsport: false })} />);
    expect(screen.queryByText("ESPORT")).toBeNull();
  });

  it("forwards a className to the wrapper", () => {
    render(<EditorialGameCard game={makeGame()} className="my-extra" />);
    const link = screen.getByTestId("editorial-game-card");
    expect(link.className).toContain("editorial-game-card");
    expect(link.className).toContain("my-extra");
  });
});
