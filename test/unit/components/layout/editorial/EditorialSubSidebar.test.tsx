import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock @/i18n/navigation BEFORE importing the SUT.
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

import { EditorialSubSidebar } from "@/components/layout/editorial/EditorialSubSidebar";
import { EDITORIAL_SPACES } from "@/components/layout/editorial/EditorialRail";

const gamesSpace = EDITORIAL_SPACES.find((s) => s.key === "games")!;
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
      // No link rendered when closed.
      expect(container.querySelector("nav")).toBeNull();
    });

    it("renders the space label as the header h2", () => {
      render(<EditorialSubSidebar space={gamesSpace} onClose={() => {}} />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.textContent).toBe(gamesSpace.label);
    });

    it("renders one link per space.links entry", () => {
      render(<EditorialSubSidebar space={esportSpace} onClose={() => {}} />);
      esportSpace.links.forEach((link) => {
        expect(screen.getByText(link.label)).toBeDefined();
      });
    });

    it("adds is-open class when open", () => {
      const { container } = render(
        <EditorialSubSidebar space={gamesSpace} onClose={() => {}} />
      );
      const aside = container.querySelector("aside");
      expect(aside?.className).toContain("is-open");
      expect(aside?.getAttribute("aria-hidden")).toBe("false");
    });

    it("sets data-space attribute for testing/debug", () => {
      const { container } = render(
        <EditorialSubSidebar space={gamesSpace} onClose={() => {}} />
      );
      const aside = container.querySelector("aside");
      expect(aside?.getAttribute("data-space")).toBe("games");
    });
  });

  describe("active link indicator", () => {
    it("marks the link matching the current pathname as active", () => {
      mockUsePathname.mockReturnValue("/trending");
      render(<EditorialSubSidebar space={gamesSpace} onClose={() => {}} />);

      const trending = screen.getByTestId("link-/trending");
      expect(trending.className).toContain("is-active");
      expect(trending.getAttribute("aria-current")).toBe("page");

      const games = screen.getByTestId("link-/games");
      expect(games.className).not.toContain("is-active");
      expect(games.getAttribute("aria-current")).toBeNull();
    });

    it("does not mark any link active when pathname is unrelated", () => {
      mockUsePathname.mockReturnValue("/somewhere/else");
      render(<EditorialSubSidebar space={gamesSpace} onClose={() => {}} />);
      gamesSpace.links.forEach((link) => {
        const node = screen.getByTestId(`link-${link.href}`);
        expect(node.className).not.toContain("is-active");
      });
    });
  });

  describe("close button", () => {
    it("calls onClose when the X button is clicked", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar space={gamesSpace} onClose={onClose} />);
      fireEvent.click(screen.getByLabelText("Close sub-sidebar"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Escape key", () => {
    it("calls onClose on Escape when open", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar space={gamesSpace} onClose={onClose} />);
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
      render(<EditorialSubSidebar space={gamesSpace} onClose={onClose} />);
      fireEvent.keyDown(window, { key: "Enter" });
      fireEvent.keyDown(window, { key: "a" });
      expect(onClose).not.toHaveBeenCalled();
    });

    it("removes the listener on unmount", () => {
      const onClose = vi.fn();
      const { unmount } = render(
        <EditorialSubSidebar space={gamesSpace} onClose={onClose} />
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
          <EditorialSubSidebar space={gamesSpace} onClose={onClose} />
        </div>
      );
      const outside = screen.getByTestId("outside");
      fireEvent.pointerDown(outside);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT call onClose when clicking inside the sub-sidebar", () => {
      const onClose = vi.fn();
      render(<EditorialSubSidebar space={gamesSpace} onClose={onClose} />);
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
          <EditorialSubSidebar space={gamesSpace} onClose={onClose} />
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
      render(<EditorialSubSidebar space={gamesSpace} onClose={onClose} />);
      fireEvent.click(screen.getByText("Tendances"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT close when closeOnNavigate=false", () => {
      const onClose = vi.fn();
      render(
        <EditorialSubSidebar
          space={gamesSpace}
          onClose={onClose}
          closeOnNavigate={false}
        />
      );
      fireEvent.click(screen.getByText("Tendances"));
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
