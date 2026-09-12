import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock @/i18n/navigation
const mockUsePathname = vi.fn<[], string>(() => "/");
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  Link: ({
    children,
    href,
    onClick,
    className,
    "aria-label": ariaLabel,
    "aria-current": ariaCurrent,
    "data-testid": dataTestId,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
    "aria-label"?: string;
    "aria-current"?: string;
    "data-testid"?: string;
  }) =>
    React.createElement(
      "a",
      {
        href,
        onClick,
        className,
        "aria-label": ariaLabel,
        "aria-current": ariaCurrent,
        "data-testid": dataTestId ?? `link-${href}`,
      },
      children
    ),
}));

// Mock useAuth — EditorialMobileNav reads it for the account section (#264).
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, signOut: vi.fn() }),
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
  "mobileNav.discoverTitle": "Discover",
  "mobileNav.myAreaTitle": "My area",
  "mobileNav.account.title": "Account",
  "mobileNav.account.signIn": "Sign in",
  "mobileNav.account.signOut": "Sign out",
  "mobileNav.account.profile": "Profile",
  "mobileNav.account.library": "Library",
  "mobileNav.account.settings": "Settings",
  "spaces.library": "Library",
  "spaces.esport": "Predictions",
  "spaces.coaching": "Coaching",
  "spaces.account": "My account",
  "links.library.myLibrary": "My library",
  "links.library.collections": "My collections",
  "links.library.favoriteCharacters": "Favorite characters",
  "links.esport.predictions": "Predictions",
  "links.esport.fantasy": "Fantasy",
};

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string, params?: Record<string, string>) => {
    const fullKey =
      namespace === "editorial.mobileNav.account" ? `mobileNav.account.${key}` : key;
    let value = editorialTranslations[fullKey] ?? fullKey;
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
      expect(screen.getByRole("complementary", { name: "Editorial rail" })).toBeDefined();
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

      expect(document.querySelector(".editorial-sub-sidebar.is-open")).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "Library" }));

      const subSidebar = document.querySelector(".editorial-sub-sidebar");
      expect(subSidebar?.className).toContain("is-open");
      expect(subSidebar?.getAttribute("data-space")).toBe("library");
      expect(screen.getByRole("heading", { level: 2, name: "Library" })).toBeDefined();
      expect(screen.getByText("My collections")).toBeDefined();
    });

    it("closes the sub-sidebar when the same rail icon is clicked twice", () => {
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );
      fireEvent.click(screen.getByRole("button", { name: "Library" }));
      fireEvent.click(screen.getByRole("button", { name: "Library" }));
      expect(document.querySelector(".editorial-sub-sidebar.is-open")).toBeNull();
    });

    it("switches the sub-sidebar to a new space when another rail icon is clicked", () => {
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );
      fireEvent.click(screen.getByRole("button", { name: "Library" }));
      fireEvent.click(screen.getByRole("button", { name: "Predictions" }));

      const subSidebar = document.querySelector(".editorial-sub-sidebar");
      expect(subSidebar?.getAttribute("data-space")).toBe("esport");
      expect(screen.getByRole("heading", { level: 2, name: "Predictions" })).toBeDefined();
      expect(screen.getByText("Fantasy")).toBeDefined();
    });

    it("closes the sub-sidebar when its X button is clicked", () => {
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );
      fireEvent.click(screen.getByRole("button", { name: "Library" }));
      fireEvent.click(screen.getByRole("button", { name: "Close sub-sidebar" }));
      expect(document.querySelector(".editorial-sub-sidebar.is-open")).toBeNull();
    });
  });

  describe("rail-pathname active sync", () => {
    it("marks the rail icon active based on the current pathname when sub-sidebar is closed", () => {
      mockUsePathname.mockReturnValue("/esport/predictions");
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );
      const esport = screen.getByRole("button", { name: "Predictions" });
      expect(esport.getAttribute("aria-pressed")).toBe("true");
    });

    it("the open sub-sidebar takes precedence over the pathname for the rail indicator", () => {
      mockUsePathname.mockReturnValue("/library");
      render(
        <EditorialLayout>
          <p>x</p>
        </EditorialLayout>
      );
      expect(
        screen.getByRole("button", { name: "Library" }).getAttribute("aria-pressed")
      ).toBe("true");

      fireEvent.click(screen.getByRole("button", { name: "Coaching" }));
      expect(
        screen.getByRole("button", { name: "Coaching" }).getAttribute("aria-pressed")
      ).toBe("true");
      expect(
        screen.getByRole("button", { name: "Library" }).getAttribute("aria-pressed")
      ).toBe("false");
    });
  });

  describe("persistence between mounts", () => {
    it("restores the previously open space from localStorage", () => {
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
