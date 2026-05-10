import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock @/i18n/navigation BEFORE importing the component under test, so that
// usePathname returns whatever the test sets via mockUsePathname.
const mockUsePathname = vi.fn<[], string>(() => "/");
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockUsePathname(),
  Link: ({
    children,
    href,
    className,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    "aria-label"?: string;
  }) =>
    React.createElement(
      "a",
      { href, className, "aria-label": ariaLabel, "data-testid": "rail-link" },
      children
    ),
}));

import {
  EditorialRail,
  EDITORIAL_SPACES,
  spaceFromPathname,
  type EditorialSpaceKey,
} from "@/components/layout/editorial/EditorialRail";

describe("spaceFromPathname (helper)", () => {
  it("returns null for null/undefined/empty input", () => {
    expect(spaceFromPathname(null)).toBeNull();
    expect(spaceFromPathname("")).toBeNull();
  });

  it("returns null for paths that do not belong to any space", () => {
    expect(spaceFromPathname("/")).toBeNull();
    expect(spaceFromPathname("/auth/sign-in")).toBeNull();
    expect(spaceFromPathname("/admin/games")).toBeNull();
  });

  it("matches exact prefixes for the games space", () => {
    expect(spaceFromPathname("/games")).toBe("games");
    expect(spaceFromPathname("/games/zelda")).toBe("games");
    expect(spaceFromPathname("/trending")).toBe("games");
    expect(spaceFromPathname("/upcoming")).toBe("games");
    expect(spaceFromPathname("/characters")).toBe("games");
    expect(spaceFromPathname("/favorites/characters")).toBe("games");
  });

  it("matches deep paths under /esport", () => {
    expect(spaceFromPathname("/esport")).toBe("esport");
    expect(spaceFromPathname("/esport/calendar")).toBe("esport");
    expect(spaceFromPathname("/esport/teams/team-liquid")).toBe("esport");
  });

  it("matches the library space (library, collections, profile)", () => {
    expect(spaceFromPathname("/library")).toBe("library");
    expect(spaceFromPathname("/collections")).toBe("library");
    expect(spaceFromPathname("/profile")).toBe("library");
  });

  it("matches the community space (players, discussions, friends)", () => {
    expect(spaceFromPathname("/players")).toBe("community");
    expect(spaceFromPathname("/players/123")).toBe("community");
    expect(spaceFromPathname("/discussions")).toBe("community");
    expect(spaceFromPathname("/friends")).toBe("community");
  });

  it("matches the coaching space", () => {
    expect(spaceFromPathname("/coaching")).toBe("coaching");
    expect(spaceFromPathname("/coaching/sessions")).toBe("coaching");
  });

  it("does not match a prefix that only shares the same start", () => {
    // /gamesettings is NOT under /games — must not match.
    expect(spaceFromPathname("/gamesettings")).toBeNull();
    // /coachingExtra is NOT /coaching/something either.
    expect(spaceFromPathname("/coachingExtra")).toBeNull();
  });
});

describe("EDITORIAL_SPACES", () => {
  it("exposes exactly the 5 expected spaces in stable order", () => {
    expect(EDITORIAL_SPACES.map((s) => s.key)).toEqual([
      "games",
      "esport",
      "library",
      "community",
      "coaching",
    ]);
  });

  it("each space has a label, an icon and at least one path prefix", () => {
    EDITORIAL_SPACES.forEach((space) => {
      expect(space.label.length).toBeGreaterThan(0);
      expect(space.icon).toMatch(/^[a-z]+:/);
      expect(space.pathPrefixes.length).toBeGreaterThan(0);
    });
  });
});

describe("EditorialRail", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUsePathname.mockReturnValue("/");
  });

  it("renders the logo link to '/' and 5 space buttons", () => {
    render(<EditorialRail />);

    const logo = screen.getByLabelText(/Gamers Universe/i);
    expect(logo.getAttribute("href")).toBe("/");

    EDITORIAL_SPACES.forEach((space) => {
      const button = screen.getByRole("button", { name: space.label });
      expect(button).toBeDefined();
      expect(button.getAttribute("data-space")).toBe(space.key);
    });
  });

  it("marks the active space based on the current pathname", () => {
    mockUsePathname.mockReturnValue("/esport/calendar");
    render(<EditorialRail />);

    const esport = screen.getByRole("button", { name: "Esport" });
    expect(esport.getAttribute("aria-pressed")).toBe("true");
    expect(esport.className).toContain("is-active");

    const games = screen.getByRole("button", { name: "Games" });
    expect(games.getAttribute("aria-pressed")).toBe("false");
    expect(games.className).not.toContain("is-active");
  });

  it("falls back to no active space on routes outside of any space (e.g. /admin)", () => {
    mockUsePathname.mockReturnValue("/admin/games");
    render(<EditorialRail />);

    EDITORIAL_SPACES.forEach((space) => {
      const button = screen.getByRole("button", { name: space.label });
      expect(button.getAttribute("aria-pressed")).toBe("false");
    });
  });

  it("openSpace prop overrides the pathname-derived active space", () => {
    // Even when the URL points to /games, if the parent says coaching is open,
    // the rail must indicate coaching (the sub-sidebar drives the active state).
    mockUsePathname.mockReturnValue("/games");
    render(<EditorialRail openSpace="coaching" />);

    const coaching = screen.getByRole("button", { name: "Coaching" });
    expect(coaching.getAttribute("aria-pressed")).toBe("true");

    const games = screen.getByRole("button", { name: "Games" });
    expect(games.getAttribute("aria-pressed")).toBe("false");
  });

  it("openSpace=null lets the pathname determine the active space", () => {
    mockUsePathname.mockReturnValue("/library");
    render(<EditorialRail openSpace={null} />);

    expect(screen.getByRole("button", { name: "Library" }).getAttribute("aria-pressed")).toBe(
      "true"
    );
  });

  it("calls onToggleSpace with the correct key on button click", () => {
    const onToggleSpace = vi.fn();
    render(<EditorialRail onToggleSpace={onToggleSpace} />);

    fireEvent.click(screen.getByRole("button", { name: "Games" }));
    expect(onToggleSpace).toHaveBeenLastCalledWith("games");

    fireEvent.click(screen.getByRole("button", { name: "Coaching" }));
    expect(onToggleSpace).toHaveBeenLastCalledWith("coaching");

    expect(onToggleSpace).toHaveBeenCalledTimes(2);
  });

  it("does not throw when onToggleSpace is omitted", () => {
    render(<EditorialRail />);
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: "Games" }))
    ).not.toThrow();
  });

  it("exposes the rail as a labelled aside for assistive tech", () => {
    render(<EditorialRail />);
    const aside = screen.getByRole("complementary", { name: "Editorial rail" });
    expect(aside).toBeDefined();
  });

  it("each space button has a tooltip via title and an aria-label", () => {
    render(<EditorialRail />);
    EDITORIAL_SPACES.forEach((space) => {
      const button = screen.getByRole("button", { name: space.label });
      expect(button.getAttribute("title")).toBe(space.label);
      expect(button.getAttribute("aria-label")).toBe(space.label);
    });
  });

  it("forwards an additional className to the root aside", () => {
    const { container } = render(<EditorialRail className="my-extra" />);
    const aside = container.querySelector("aside");
    expect(aside?.className).toContain("editorial-rail");
    expect(aside?.className).toContain("my-extra");
  });

  it("maintains the EditorialSpaceKey type contract", () => {
    // Type-level assertion only — fails to compile if the type changes.
    const keys: readonly EditorialSpaceKey[] = [
      "games",
      "esport",
      "library",
      "community",
      "coaching",
    ];
    expect(keys.length).toBe(5);
  });
});
