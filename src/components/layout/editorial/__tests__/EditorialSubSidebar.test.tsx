import { describe, it, expect, vi } from "vitest";
import React, { useRef } from "react";
import { screen, fireEvent } from "@testing-library/react";
// Mock @/i18n/navigation
vi.mock("@/i18n/navigation", () => ({
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

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({ unreadCount: 0 }),
}));
vi.mock("@/hooks/usePendingRequestCount", () => ({
  usePendingRequestCount: () => ({ count: 0 }),
}));

const editorialTranslations: Record<string, string> = {
  "subSidebar.closeAriaLabel": "Close sub-sidebar",
  "subSidebar.navAriaLabel": "{space} links",
  "subSidebar.loading": "Loading…",
  "spaces.library": "My library",
  "spaces.esport": "Predictions",
  "spaces.groups": "Groups",
  "links.library.myLibrary": "My library",
  "links.library.collections": "My collections",
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
import { dictionaryTranslator, renderWithNavigation } from "@/test-helpers/editorial-navigation";
import type { NavigationInput } from "@/types/navigation";

const translate = dictionaryTranslator(editorialTranslations);
const render = (ui: React.ReactElement, input: Partial<NavigationInput> = {}) =>
  renderWithNavigation(ui, input, translate);
describe("EditorialSubSidebar", () => {
  describe("rendering", () => {
    it("renders nothing visible when space is null (collapsed state)", () => {
      const { container } = render(<EditorialSubSidebar spaceKey={null} onClose={() => {}} />);
      const aside = container.querySelector("aside");
      expect(aside).not.toBeNull();
      expect(aside?.className).toContain("editorial-sub-sidebar");
      expect(aside?.className).not.toContain("is-open");
      expect(aside?.getAttribute("aria-hidden")).toBe("true");
      expect(container.querySelector("nav")).toBeNull();
    });

    it("renders the i18n space label as the header h2", () => {
      render(<EditorialSubSidebar spaceKey="library" onClose={() => {}} />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.textContent).toBe("My library");
    });

    it("renders one link per space.links entry, with translated labels", () => {
      render(<EditorialSubSidebar spaceKey="esport" onClose={() => {}} />);
      expect(screen.getByTestId("link-/esport/predictions").textContent).toContain("Predictions");
      expect(screen.getByTestId("link-/esport/fantasy").textContent).toContain("Fantasy");
    });

    it("uses the i18n nav aria-label with interpolated space name", () => {
      render(<EditorialSubSidebar spaceKey="library" onClose={() => {}} />);
      const navs = screen.getAllByRole("navigation", { name: "My library links" });
      expect(navs.length).toBe(1);
    });

    it("adds is-open class when open", () => {
      const { container } = render(<EditorialSubSidebar spaceKey="library" onClose={() => {}} />);
      const aside = container.querySelector("aside");
      expect(aside?.className).toContain("is-open");
      expect(aside?.getAttribute("aria-hidden")).toBe("false");
    });

    it("sets data-space attribute for testing/debug", () => {
      const { container } = render(<EditorialSubSidebar spaceKey="library" onClose={() => {}} />);
      const aside = container.querySelector("aside");
      expect(aside?.getAttribute("data-space")).toBe("library");
    });
  });

  describe("membership links", () => {
    it("lists the member's groups under the groups space", () => {
      render(<EditorialSubSidebar spaceKey="groups" onClose={() => {}} />, {
        isAuthenticated: true,
        memberships: {
          groups: {
            isLoading: false,
            items: [{ id: "g1", name: "Speedrunners", slug: "speedrunners", imageUrl: null }],
          },
        },
      });
      expect(screen.getByTestId("link-/groups/speedrunners").textContent).toContain("Speedrunners");
    });

    it("shows a loading line while memberships load", () => {
      render(<EditorialSubSidebar spaceKey="groups" onClose={() => {}} />, {
        isAuthenticated: true,
        memberships: { groups: { isLoading: true, items: [] } },
      });
      expect(screen.getByText("Loading…")).toBeDefined();
    });
  });
  describe("close button", () => {
    it("calls onClose when the X button is clicked (label via i18n)", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar spaceKey="library" onClose={onClose} />);
      fireEvent.click(screen.getByLabelText("Close sub-sidebar"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Escape key", () => {
    it("calls onClose on Escape when open", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar spaceKey="library" onClose={onClose} />);
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose on Escape when closed", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar spaceKey={null} onClose={onClose} />);
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).not.toHaveBeenCalled();
    });

    it("ignores other keys", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar spaceKey="library" onClose={onClose} />);
      fireEvent.keyDown(window, { key: "Enter" });
      fireEvent.keyDown(window, { key: "a" });
      expect(onClose).not.toHaveBeenCalled();
    });

    it("stops closing on Escape once unmounted", () => {
      const onClose = vi.fn();
      const { unmount } = render(<EditorialSubSidebar spaceKey="library" onClose={onClose} />);
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
          <EditorialSubSidebar spaceKey="library" onClose={onClose} />
        </div>
      );
      const outside = screen.getByTestId("outside");
      fireEvent.pointerDown(outside);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT call onClose when clicking inside the sub-sidebar", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar spaceKey="library" onClose={onClose} />);
      const heading = screen.getByRole("heading", { level: 2 });
      fireEvent.pointerDown(heading);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("does NOT call onClose when clicking on the rail (the rail handles its own toggle)", () => {
      const onClose = vi.fn();
      function WithRail() {
        const railRef = useRef<HTMLDivElement>(null);
        return (
          <div>
            <div ref={railRef}>
              <button data-testid="rail-button" type="button">
                Rail
              </button>
            </div>
            <EditorialSubSidebar spaceKey="library" onClose={onClose} insideRefs={[railRef]} />
          </div>
        );
      }
      render(<WithRail />);
      fireEvent.pointerDown(screen.getByTestId("rail-button"));
      expect(onClose).not.toHaveBeenCalled();
    });

    it("does not close on outside clicks when closed", () => {
      const onClose = vi.fn();
      render(
        <div>
          <div data-testid="outside" />
          <EditorialSubSidebar spaceKey={null} onClose={onClose} />
        </div>
      );
      fireEvent.pointerDown(screen.getByTestId("outside"));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("link click behaviour", () => {
    it("closes when clicking a link by default (closeOnNavigate=true)", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar spaceKey="library" onClose={onClose} />);
      fireEvent.click(screen.getByText("My collections"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT close when closeOnNavigate=false", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar spaceKey="library" onClose={onClose} closeOnNavigate={false} />);
      fireEvent.click(screen.getByText("My collections"));
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
