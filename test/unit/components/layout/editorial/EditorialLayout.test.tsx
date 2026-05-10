import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock @/i18n/navigation
const mockUsePathname = vi.fn<[], string>(() => "/");
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockUsePathname(),
  Link: ({
    children,
    href,
    onClick,
    className,
    "aria-label": ariaLabel,
    "aria-current": ariaCurrent,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
    "aria-label"?: string;
    "aria-current"?: string;
  }) =>
    React.createElement(
      "a",
      {
        href,
        onClick,
        className,
        "aria-label": ariaLabel,
        "aria-current": ariaCurrent,
        "data-testid": `link-${href}`,
      },
      children
    ),
}));

// Mock useTranslations with a deterministic dictionary covering rail,
// subSidebar, mobileNav, spaces and links keys used by the children.
const editorialTranslations: Record<string, string> = {
  "rail.ariaLabel": "Editorial rail",
  "rail.logoAriaLabel": "Gamers Universe — home",
  "rail.spacesAriaLabel": "Spaces",
  "subSidebar.closeAriaLabel": "Close sub-sidebar",
  "subSidebar.navAriaLabel": "{space} links",
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
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) => {
    let value = editorialTranslations[key] ?? key;
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(`{${paramKey}}`, paramValue);
      }
    }
    return value;
  },
}));

import { EditorialLayout } from "@/components/layout/editorial/EditorialLayout";

describe("EditorialLayout", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUsePathname.mockReturnValue("/");
    window.localStorage.clear();
    document.body.style.overflow = "";
  });

  describe("rendering", () => {
    it("renders the children inside the main slot", () => {
      render(
        <EditorialLayout>
          <p data-testid="page-content">Hello</p>
        </EditorialLayout>
      );
      expect(screen.getByTestId("page-content").textContent).toBe("Hello");
      expect(screen.getByTestId("editorial-layout-main").contains(screen.getByTestId("page-content"))).toBe(true);
    });

    it("does not render a header when none is provided", () => {
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );
      expect(screen.queryByTestId("editorial-layout-header")).toBeNull();
    });

    it("renders the header slot when provided", () => {
      render(
        <EditorialLayout header={<nav data-testid="my-mega-menu">menu</nav>}>
          <p>x</p>
        </EditorialLayout>
      );
      const headerWrapper = screen.getByTestId("editorial-layout-header");
      expect(headerWrapper).toBeDefined();
      expect(screen.getByTestId("my-mega-menu").textContent).toBe("menu");
    });

    it("renders the rail and a (closed) sub-sidebar by default", () => {
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );
      // Rail aside is labelled by useTranslations.
      expect(screen.getByRole("complementary", { name: "Editorial rail" })).toBeDefined();
      // The sub-sidebar exists but is collapsed (no is-open class, aria-hidden).
      const subSidebars = document.querySelectorAll(".editorial-sub-sidebar");
      expect(subSidebars.length).toBe(1);
      expect(subSidebars[0].className).not.toContain("is-open");
    });

    it("renders the mobile nav hamburger by default", () => {
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );
      expect(screen.getByRole("button", { name: "Open navigation" })).toBeDefined();
    });

    it("hides the mobile nav when disableMobileNav is true", () => {
      render(
        <EditorialLayout disableMobileNav>
          <p>x</p>
        </EditorialLayout>
      );
      expect(screen.queryByRole("button", { name: "Open navigation" })).toBeNull();
    });

    it("forwards a className to the root wrapper", () => {
      const { container } = render(
        <EditorialLayout className="my-shell">
          <p>x</p>
        </EditorialLayout>
      );
      const root = container.querySelector(".editorial-layout");
      expect(root?.className).toContain("editorial-layout");
      expect(root?.className).toContain("my-shell");
    });
  });

  describe("rail / sub-sidebar orchestration", () => {
    it("opens the sub-sidebar with the matching links when a rail icon is clicked", () => {
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );

      // Initially closed
      expect(document.querySelector(".editorial-sub-sidebar.is-open")).toBeNull();

      // Click the Games rail button
      fireEvent.click(screen.getByRole("button", { name: "Games" }));

      // Sub-sidebar is open, shows the Games heading and links
      const subSidebar = document.querySelector(".editorial-sub-sidebar");
      expect(subSidebar?.className).toContain("is-open");
      expect(subSidebar?.getAttribute("data-space")).toBe("games");
      expect(screen.getByRole("heading", { level: 2, name: "Games" })).toBeDefined();
      expect(screen.getByText("Trending")).toBeDefined();
    });

    it("closes the sub-sidebar when the same rail icon is clicked twice", () => {
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );
      fireEvent.click(screen.getByRole("button", { name: "Games" }));
      fireEvent.click(screen.getByRole("button", { name: "Games" }));
      expect(document.querySelector(".editorial-sub-sidebar.is-open")).toBeNull();
    });

    it("switches the sub-sidebar to a new space when another rail icon is clicked", () => {
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );
      fireEvent.click(screen.getByRole("button", { name: "Games" }));
      fireEvent.click(screen.getByRole("button", { name: "Esport" }));

      const subSidebar = document.querySelector(".editorial-sub-sidebar");
      expect(subSidebar?.getAttribute("data-space")).toBe("esport");
      expect(screen.getByRole("heading", { level: 2, name: "Esport" })).toBeDefined();
      expect(screen.getByText("Live now")).toBeDefined();
    });

    it("closes the sub-sidebar when its X button is clicked", () => {
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );
      fireEvent.click(screen.getByRole("button", { name: "Games" }));
      fireEvent.click(screen.getByRole("button", { name: "Close sub-sidebar" }));
      expect(document.querySelector(".editorial-sub-sidebar.is-open")).toBeNull();
    });
  });

  describe("rail-pathname active sync", () => {
    it("marks the rail icon active based on the current pathname when sub-sidebar is closed", () => {
      mockUsePathname.mockReturnValue("/esport/calendar");
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );
      const esport = screen.getByRole("button", { name: "Esport" });
      expect(esport.getAttribute("aria-pressed")).toBe("true");
    });

    it("the open sub-sidebar takes precedence over the pathname for the rail indicator", () => {
      mockUsePathname.mockReturnValue("/games");
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );
      // Initially Games is active because of the pathname
      expect(
        screen.getByRole("button", { name: "Games" }).getAttribute("aria-pressed")
      ).toBe("true");

      // Open coaching sub-sidebar — coaching becomes active visually
      fireEvent.click(screen.getByRole("button", { name: "Coaching" }));
      expect(
        screen.getByRole("button", { name: "Coaching" }).getAttribute("aria-pressed")
      ).toBe("true");
      expect(
        screen.getByRole("button", { name: "Games" }).getAttribute("aria-pressed")
      ).toBe("false");
    });
  });

  describe("persistence between mounts", () => {
    it("restores the previously open space from localStorage", () => {
      // Pre-seed the storage as if the user had Library opened last session
      window.localStorage.setItem(
        "gu.editorial.openSpace.v1",
        JSON.stringify("library")
      );

      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );

      const subSidebar = document.querySelector(".editorial-sub-sidebar");
      expect(subSidebar?.getAttribute("data-space")).toBe("library");
      expect(subSidebar?.className).toContain("is-open");
    });
  });
});
