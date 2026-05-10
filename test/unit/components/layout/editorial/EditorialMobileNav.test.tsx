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

    it("renders all 5 spaces as accordion triggers when open", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      EDITORIAL_SPACES.forEach((space) => {
        // Each section trigger has aria-expanded; use that to disambiguate from
        // the close button.
        const trigger = screen.getByRole("button", { name: new RegExp(space.label, "i") });
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
    it("expands a section on click and shows its links", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

      const gamesTrigger = screen.getByRole("button", { name: /Games/i });
      fireEvent.click(gamesTrigger);

      expect(gamesTrigger.getAttribute("aria-expanded")).toBe("true");
      expect(screen.getByText("Tendances")).toBeDefined();
      expect(screen.getByText("À venir")).toBeDefined();
    });

    it("collapses an expanded section when clicked again", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

      const gamesTrigger = screen.getByRole("button", { name: /Games/i });
      fireEvent.click(gamesTrigger);
      fireEvent.click(gamesTrigger);

      expect(gamesTrigger.getAttribute("aria-expanded")).toBe("false");
      expect(screen.queryByText("Tendances")).toBeNull();
    });

    it("only one section can be expanded at a time (accordion behaviour)", () => {
      render(<EditorialMobileNav />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

      fireEvent.click(screen.getByRole("button", { name: /Games/i }));
      // Switch to Esport
      fireEvent.click(screen.getByRole("button", { name: /Esport/i }));

      expect(
        screen.getByRole("button", { name: /Games/i }).getAttribute("aria-expanded")
      ).toBe("false");
      expect(
        screen.getByRole("button", { name: /Esport/i }).getAttribute("aria-expanded")
      ).toBe("true");

      // Tendances (Games link) should no longer be visible.
      expect(screen.queryByText("Tendances")).toBeNull();
      // En direct (Esport link) should now be visible.
      expect(screen.getByText("En direct")).toBeDefined();
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
    it("closes on the X button click", () => {
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
      fireEvent.click(screen.getByText("Tendances"));
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
      // Re-open
      fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
      expect(
        screen.getByRole("button", { name: /Games/i }).getAttribute("aria-expanded")
      ).toBe("false");
    });

    it("ignores Escape when the overlay is closed", () => {
      render(<EditorialMobileNav />);
      // Should not throw nor have any side-effect
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.body.style.overflow).toBe("");
    });
  });
});
