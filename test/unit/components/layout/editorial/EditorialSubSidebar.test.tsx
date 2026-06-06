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

// Mock useTranslations with a deterministic dictionary tailored to the
// editorial namespace (subSidebar, spaces, links). The sidebar now exposes
// user-specific spaces only.
const editorialTranslations: Record<string, string> = {
  "subSidebar.closeAriaLabel": "Close sub-sidebar",
  "subSidebar.navAriaLabel": "{space} links",
  "spaces.library": "My library",
  "spaces.esport": "Predictions",
  "spaces.coaching": "Coaching",
  "spaces.account": "My account",
  // Library links
  "links.library.myLibrary": "My library",
  "links.library.collections": "My collections",
  "links.library.favoriteCharacters": "Favorite characters",
  // Esport links
  "links.esport.predictions": "Predictions",
  "links.esport.fantasy": "Fantasy",
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

import { EditorialSubSidebar } from "@/components/layout/editorial/EditorialSubSidebar";
import { EDITORIAL_SPACES } from "@/components/layout/editorial/EditorialRail";

const librarySpace = EDITORIAL_SPACES.find((s) => s.key === "library")!;
const esportSpace = EDITORIAL_SPACES.find((s) => s.key === "esport")!;

describe("EditorialSubSidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUsePathname.mockReturnValue("/");
  });

  describe("rendering", () => {
    it("renders nothing visible when space is null (collapsed state)", () => {
      const { container } = render(<EditorialSubSidebar space={null} onClose={() => {}} />);
      const aside = container.querySelector("aside");
      expect(aside).not.toBeNull();
      expect(aside?.className).toContain("editorial-sub-sidebar");
      expect(aside?.className).not.toContain("is-open");
      expect(aside?.getAttribute("aria-hidden")).toBe("true");
      expect(container.querySelector("nav")).toBeNull();
    });

    it("renders the i18n space label as the header h2", () => {
      render(<EditorialSubSidebar space={librarySpace} onClose={() => {}} />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.textContent).toBe("My library");
    });

    it("renders one link per space.links entry, with translated labels", () => {
      render(<EditorialSubSidebar space={esportSpace} onClose={() => {}} />);
      expect(screen.getByTestId("link-/esport/predictions").textContent).toContain("Predictions");
      expect(screen.getByTestId("link-/esport/fantasy").textContent).toContain("Fantasy");
    });

    it("uses the i18n nav aria-label with interpolated space name", () => {
      render(<EditorialSubSidebar space={librarySpace} onClose={() => {}} />);
      const navs = screen.getAllByRole("navigation", { name: "My library links" });
      expect(navs.length).toBe(1);
    });

    it("adds is-open class when open", () => {
      const { container } = render(
        <EditorialSubSidebar space={librarySpace} onClose={() => {}} />
      );
      const aside = container.querySelector("aside");
      expect(aside?.className).toContain("is-open");
      expect(aside?.getAttribute("aria-hidden")).toBe("false");
    });

    it("sets data-space attribute for testing/debug", () => {
      const { container } = render(
        <EditorialSubSidebar space={librarySpace} onClose={() => {}} />
      );
      const aside = container.querySelector("aside");
      expect(aside?.getAttribute("data-space")).toBe("library");
    });
  });

  describe("active link indicator", () => {
    it("marks the link matching the current pathname as active", () => {
      mockUsePathname.mockReturnValue("/collections");
      render(<EditorialSubSidebar space={librarySpace} onClose={() => {}} />);

      const collections = screen.getByTestId("link-/collections");
      expect(collections.className).toContain("is-active");
      expect(collections.getAttribute("aria-current")).toBe("page");

      const library = screen.getByTestId("link-/library");
      expect(library.className).not.toContain("is-active");
      expect(library.getAttribute("aria-current")).toBeNull();
    });

    it("does not mark any link active when pathname is unrelated", () => {
      mockUsePathname.mockReturnValue("/somewhere/else");
      render(<EditorialSubSidebar space={librarySpace} onClose={() => {}} />);
      librarySpace.links.forEach((link) => {
        const node = screen.getByTestId(`link-${link.href}`);
        expect(node.className).not.toContain("is-active");
      });
    });
  });

  describe("close button", () => {
    it("calls onClose when the X button is clicked (label via i18n)", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar space={librarySpace} onClose={onClose} />);
      fireEvent.click(screen.getByLabelText("Close sub-sidebar"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Escape key", () => {
    it("calls onClose on Escape when open", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar space={librarySpace} onClose={onClose} />);
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose on Escape when closed", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar space={null} onClose={onClose} />);
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).not.toHaveBeenCalled();
    });

    it("ignores other keys", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar space={librarySpace} onClose={onClose} />);
      fireEvent.keyDown(window, { key: "Enter" });
      fireEvent.keyDown(window, { key: "a" });
      expect(onClose).not.toHaveBeenCalled();
    });

    it("removes the listener on unmount", () => {
      const onClose = vi.fn();
      const { unmount } = render(
        <EditorialSubSidebar space={librarySpace} onClose={onClose} />
      );
      unmount();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("click outside", () => {
    it("calls onClose when clicking outside the sub-sidebar and outside the rail", () => {
      const onClose = vi.fn();
      render(
        <div>
          <div data-testid="outside" style={{ width: 100, height: 100 }} />
          <EditorialSubSidebar space={librarySpace} onClose={onClose} />
        </div>
      );
      const outside = screen.getByTestId("outside");
      fireEvent.pointerDown(outside);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT call onClose when clicking inside the sub-sidebar", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar space={librarySpace} onClose={onClose} />);
      const heading = screen.getByRole("heading", { level: 2 });
      fireEvent.pointerDown(heading);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("does NOT call onClose when clicking on the rail (the rail handles its own toggle)", () => {
      const onClose = vi.fn();
      render(
        <div>
          <aside className="editorial-rail">
            <button data-testid="rail-button" type="button">Rail</button>
          </aside>
          <EditorialSubSidebar space={librarySpace} onClose={onClose} />
        </div>
      );
      fireEvent.pointerDown(screen.getByTestId("rail-button"));
      expect(onClose).not.toHaveBeenCalled();
    });

    it("does not listen for outside clicks when closed", () => {
      const onClose = vi.fn();
      render(
        <div>
          <div data-testid="outside" />
          <EditorialSubSidebar space={null} onClose={onClose} />
        </div>
      );
      fireEvent.pointerDown(screen.getByTestId("outside"));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("link click behaviour", () => {
    it("closes when clicking a link by default (closeOnNavigate=true)", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar space={librarySpace} onClose={onClose} />);
      fireEvent.click(screen.getByText("My collections"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT close when closeOnNavigate=false", () => {
      const onClose = vi.fn();
      render(
        <EditorialSubSidebar
          space={librarySpace}
          onClose={onClose}
          closeOnNavigate={false}
        />
      );
      fireEvent.click(screen.getByText("My collections"));
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
