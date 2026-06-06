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
    "data-testid": dataTestId,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
    "aria-current"?: string;
    "data-testid"?: string;
  }) =>
    React.createElement(
      "a",
      {
        href,
        onClick,
        className,
        "aria-current": ariaCurrent,
        "data-testid": dataTestId ?? `link-${href}`,
      },
      children
    ),
}));

// The mobile overlay now exposes BOTH the public top-bar entries ("Discover")
// and the user-specific rail spaces ("My area"), since both are hidden < lg.
const editorialTranslations: Record<string, string> = {
  "mobileNav.openAriaLabel": "Open navigation",
  "mobileNav.closeAriaLabel": "Close navigation",
  "mobileNav.dialogAriaLabel": "Mobile navigation",
  "mobileNav.title": "Navigation",
  "mobileNav.discoverTitle": "Discover",
  "mobileNav.myAreaTitle": "My area",
  "mobileNav.account.title": "Account",
  "mobileNav.account.signIn": "Sign in",
  "mobileNav.account.signOut": "Sign out",
  "mobileNav.account.profile": "Profile",
  "mobileNav.account.library": "Library",
  "mobileNav.account.settings": "Settings",
  // Public mega entries + links
  "megaMenu.entries.games": "Games",
  "megaMenu.entries.characters": "Characters",
  "megaMenu.entries.players": "Players",
  "megaMenu.entries.esport": "Esports",
  "megaMenu.links.games.all": "All games",
  "megaMenu.links.games.trending": "Trending",
  "megaMenu.links.games.upcoming": "Upcoming",
  "megaMenu.links.characters.all": "All characters",
  "megaMenu.links.players.all": "Players directory",
  "megaMenu.links.players.discussions": "Discussions",
  "megaMenu.links.esport.live": "Live now",
  "megaMenu.links.esport.calendar": "Calendar",
  "megaMenu.links.esport.tournaments": "Tournaments",
  "megaMenu.links.esport.results": "Results",
  "megaMenu.links.esport.teams": "Teams",
  "megaMenu.links.esport.proPlayers": "Pro players",
  // Private rail spaces + links
  "spaces.library": "My library",
  "spaces.esport": "Predictions",
  "spaces.coaching": "Coaching",
  "spaces.account": "My account",
  "links.library.myLibrary": "My library",
  "links.library.collections": "My collections",
  "links.library.favoriteCharacters": "Favorite characters",
  "links.esport.predictions": "Predictions",
  "links.esport.fantasy": "Fantasy",
  "links.coaching.hub": "Coaching hub",
  "links.coaching.sessions": "My sessions",
  "links.coaching.settings": "Coach settings",
  "links.account.friends": "My friends",
  "links.account.coins": "My coins",
};

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    if (namespace === "editorial.mobileNav.account") {
      const fullKey = `mobileNav.account.${key}`;
      return editorialTranslations[fullKey] ?? fullKey;
    }
    return editorialTranslations[key] ?? key;
  },
}));

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { EditorialMobileNav } from "@/components/layout/editorial/EditorialMobileNav";

describe("EditorialMobileNav", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUsePathname.mockReturnValue("/");
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({ user: null, loading: false, signOut: vi.fn() });
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
      expect(screen.getByText("Navigation")).toBeDefined();
    });

    it("renders the Discover (public) and My area (private) group titles", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      expect(screen.getByRole("navigation", { name: "Discover" })).toBeDefined();
      expect(screen.getByRole("navigation", { name: "My area" })).toBeDefined();
    });

    it("renders public entries (Games, Esports) and private spaces (My library) as triggers", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      expect(screen.getByRole("button", { name: /Games/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Esports/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /My library/i })).toBeDefined();
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
    it("expands a public section on click and shows its translated links", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

      const gamesTrigger = screen.getByRole("button", { name: /Games/i });
      fireEvent.click(gamesTrigger);

      expect(gamesTrigger.getAttribute("aria-expanded")).toBe("true");
      expect(screen.getByText("Trending")).toBeDefined();
      expect(screen.getByText("Upcoming")).toBeDefined();
    });

    it("expands a private section on click and shows its translated links", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

      fireEvent.click(screen.getByRole("button", { name: /My library/i }));
      expect(screen.getByText("My collections")).toBeDefined();
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

    it("only one section can be expanded at a time across both groups", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

      fireEvent.click(screen.getByRole("button", { name: /Games/i }));
      fireEvent.click(screen.getByRole("button", { name: /My library/i }));

      expect(
        screen.getByRole("button", { name: /Games/i }).getAttribute("aria-expanded")
      ).toBe("false");
      expect(
        screen.getByRole("button", { name: /My library/i }).getAttribute("aria-expanded")
      ).toBe("true");

      expect(screen.queryByText("Trending")).toBeNull();
      expect(screen.getByText("My collections")).toBeDefined();
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

  describe("account section (#264)", () => {
    function makeUser() {
      return {
        id: "user-1",
        email: "alice@example.com",
        user_metadata: { username: "alice", avatar_url: null },
      };
    }

    it("does not render the account section while auth is loading", () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true, signOut: vi.fn() });
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      expect(screen.queryByTestId("editorial-mobile-account")).toBeNull();
    });

    it("renders a Sign in CTA when not authenticated", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      const cta = screen.getByTestId("editorial-mobile-account-signin");
      expect(cta.getAttribute("href")).toBe("/auth");
      expect(cta.textContent).toContain("Sign in");
      expect(screen.queryByTestId("editorial-mobile-account-profile")).toBeNull();
      expect(screen.queryByTestId("editorial-mobile-account-signout")).toBeNull();
    });

    it("renders Profile / Library / Settings + Sign out when authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: makeUser(),
        loading: false,
        signOut: vi.fn(),
      });
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

      const profile = screen.getByTestId("editorial-mobile-account-profile");
      const library = screen.getByTestId("editorial-mobile-account-library");
      const settings = screen.getByTestId("editorial-mobile-account-settings");
      expect(profile.getAttribute("href")).toBe("/profile");
      expect(library.getAttribute("href")).toBe("/library");
      expect(settings.getAttribute("href")).toBe("/settings");
      expect(screen.getByTestId("editorial-mobile-account-signout")).toBeDefined();
      expect(screen.queryByTestId("editorial-mobile-account-signin")).toBeNull();
    });

    it("Sign out triggers signOut and closes the overlay", async () => {
      const signOut = vi.fn();
      mockUseAuth.mockReturnValue({ user: makeUser(), loading: false, signOut });
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

      fireEvent.click(screen.getByTestId("editorial-mobile-account-signout"));
      await Promise.resolve();
      expect(signOut).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("clicking on a Sign in CTA closes the overlay", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      fireEvent.click(screen.getByTestId("editorial-mobile-account-signin"));
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("marks an account link active when its href matches the pathname", () => {
      mockUsePathname.mockReturnValue("/settings");
      mockUseAuth.mockReturnValue({
        user: makeUser(),
        loading: false,
        signOut: vi.fn(),
      });
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      const settings = screen.getByTestId("editorial-mobile-account-settings");
      expect(settings.className).toContain("is-active");
      expect(settings.getAttribute("aria-current")).toBe("page");
    });
  });
});
