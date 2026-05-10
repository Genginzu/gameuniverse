import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockUsePathname = vi.fn<[], string>(() => "/");
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockUsePathname(),
  Link: ({
    children,
    href,
    onClick,
    className,
    "aria-current": ariaCurrent,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
    "aria-current"?: string;
  }) =>
    React.createElement(
      "a",
      {
        href,
        onClick,
        className,
        "aria-current": ariaCurrent,
        "data-testid": `link-${href}`,
      },
      children
    ),
}));

const editorialTranslations: Record<string, string> = {
  "mobileNav.openAriaLabel": "Open navigation",
  "mobileNav.closeAriaLabel": "Close navigation",
  "mobileNav.dialogAriaLabel": "Mobile navigation",
  "mobileNav.title": "Navigation",
  "mobileNav.spacesAriaLabel": "Spaces",
  "spaces.games": "Games",
  "spaces.esport": "Esport",
  "spaces.library": "Library",
  "spaces.community": "Community",
  "spaces.coaching": "Coaching",
  "links.games.all": "All games",
  "links.games.trending": "Trending",
  "links.games.upcoming": "Upcoming",
  "links.games.characters": "Characters",
  "links.games.favoriteCharacters": "My favorites",
  "links.esport.live": "Live now",
  "links.esport.calendar": "Calendar",
  "links.esport.tournaments": "Tournaments",
  "links.esport.results": "Results",
  "links.esport.teams": "Teams",
  "links.esport.players": "Pro players",
  "links.esport.predictions": "Predictions",
  "links.esport.fantasy": "Fantasy",
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => editorialTranslations[key] ?? key,
}));

import { EditorialMobileNav } from "@/components/layout/editorial/EditorialMobileNav";
import { EDITORIAL_SPACES } from "@/components/layout/editorial/EditorialRail";

describe("EditorialMobileNav", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUsePathname.mockReturnValue("/");
    document.body.style.overflow = "";
  });

  describe("hamburger button (overlay closed)", () => {
    it("renders the hamburger button with the right a11y attributes", () => {
      render(<EditorialMobileNav />);
      const button = screen.getByRole("button", { name: "Open navigation" });
      expect(button.getAttribute("aria-expanded")).toBe("false");
      expect(button.getAttribute("aria-controls")).toBe("editorial-mobile-nav-overlay");
    });

    it("does not render the overlay when closed", () => {
      render(<EditorialMobileNav />);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("forwards the className prop to the toggle button", () => {
      render(<EditorialMobileNav className="my-extra" />);
      const button = screen.getByRole("button", { name: "Open navigation" });
      expect(button.className).toContain("editorial-mobile-toggle");
      expect(button.className).toContain("my-extra");
    });
  });

  describe("opening the overlay", () => {
    it("opens the overlay on hamburger click", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      const dialog = screen.getByRole("dialog", { name: "Mobile navigation" });
      expect(dialog).toBeDefined();
      expect(dialog.getAttribute("aria-modal")).toBe("true");
    });

    it("renders the i18n title in the header", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      // The header title is the dictionary value of mobileNav.title.
      expect(screen.getByText("Navigation")).toBeDefined();
    });

    it("renders all 5 spaces as accordion triggers when open", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      EDITORIAL_SPACES.forEach((space) => {
        const expectedLabel = editorialTranslations[`spaces.${space.key}`];
        const trigger = screen.getByRole("button", { name: new RegExp(expectedLabel, "i") });
        expect(trigger.getAttribute("aria-expanded")).toBe("false");
      });
    });

    it("flips the toggle aria-expanded to true when opened", () => {
      render(<EditorialMobileNav />);
      const toggle = screen.getByRole("button", { name: "Open navigation" });
      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
    });

    it("locks body scroll when open", () => {
      render(<EditorialMobileNav />);
      expect(document.body.style.overflow).toBe("");
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      expect(document.body.style.overflow).toBe("hidden");
    });
  });

  describe("accordion sections", () => {
    it("expands a section on click and shows its translated links", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

      const gamesTrigger = screen.getByRole("button", { name: /Games/i });
      fireEvent.click(gamesTrigger);

      expect(gamesTrigger.getAttribute("aria-expanded")).toBe("true");
      expect(screen.getByText("Trending")).toBeDefined();
      expect(screen.getByText("Upcoming")).toBeDefined();
    });

    it("collapses an expanded section when clicked again", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

      const gamesTrigger = screen.getByRole("button", { name: /Games/i });
      fireEvent.click(gamesTrigger);
      fireEvent.click(gamesTrigger);

      expect(gamesTrigger.getAttribute("aria-expanded")).toBe("false");
      expect(screen.queryByText("Trending")).toBeNull();
    });

    it("only one section can be expanded at a time (accordion behaviour)", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

      fireEvent.click(screen.getByRole("button", { name: /Games/i }));
      fireEvent.click(screen.getByRole("button", { name: /Esport/i }));

      expect(
        screen.getByRole("button", { name: /Games/i }).getAttribute("aria-expanded")
      ).toBe("false");
      expect(
        screen.getByRole("button", { name: /Esport/i }).getAttribute("aria-expanded")
      ).toBe("true");

      expect(screen.queryByText("Trending")).toBeNull();
      expect(screen.getByText("Live now")).toBeDefined();
    });

    it("marks a link active when its href matches the current pathname", () => {
      mockUsePathname.mockReturnValue("/trending");
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      fireEvent.click(screen.getByRole("button", { name: /Games/i }));

      const trending = screen.getByTestId("link-/trending");
      expect(trending.className).toContain("is-active");
      expect(trending.getAttribute("aria-current")).toBe("page");
    });
  });

  describe("closing the overlay", () => {
    it("closes on the X button click (label via i18n)", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      fireEvent.click(screen.getByRole("button", { name: "Close navigation" }));
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("closes on Escape", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("closes when clicking on a navigation link", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      fireEvent.click(screen.getByRole("button", { name: /Games/i }));
      fireEvent.click(screen.getByText("Trending"));
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("restores body scroll when closed", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      expect(document.body.style.overflow).toBe("hidden");
      fireEvent.click(screen.getByRole("button", { name: "Close navigation" }));
      expect(document.body.style.overflow).toBe("");
    });

    it("collapses any expanded section after closing and re-opening", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      fireEvent.click(screen.getByRole("button", { name: /Games/i }));
      fireEvent.click(screen.getByRole("button", { name: "Close navigation" }));
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      expect(
        screen.getByRole("button", { name: /Games/i }).getAttribute("aria-expanded")
      ).toBe("false");
    });

    it("ignores Escape when the overlay is closed", () => {
      render(<EditorialMobileNav />);
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.body.style.overflow).toBe("");
    });
  });
});
