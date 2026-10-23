import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";
import { screen, fireEvent } from "@testing-library/react";

import {
  buildNavigation,
  dictionaryTranslator,
  renderWithNavigation,
} from "@/test-helpers/editorial-navigation";

const editorialTranslations: Record<string, string> = {
  "rail.ariaLabel": "Editorial rail",
  "rail.toggleAriaLabel": "Expand or collapse the sidebar",
  "rail.spacesAriaLabel": "Spaces",
  "spaces.library": "My library",
  "spaces.esport": "Predictions",
  "spaces.coaching": "Coaching",
  "spaces.social": "Social",
  "spaces.groups": "Groups",
  "spaces.communities": "Communities",
  "spaces.account": "My account",
};
const translate = dictionaryTranslator(editorialTranslations);

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => editorialTranslations[key] ?? key,
}));

import { EditorialRail } from "@/components/layout/editorial/EditorialRail";

const spaces = buildNavigation({}, translate).spaces;

function renderRail(ui: ReactElement, pathname = "/") {
  return renderWithNavigation(ui, { pathname }, translate);
}

describe("EditorialRail", () => {
  it("renders the burger toggle and one button per space (labels from the model)", () => {
    renderRail(<EditorialRail />);

    const toggle = screen.getByRole("button", { name: "Expand or collapse the sidebar" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    spaces.forEach((space) => {
      const button = screen.getByRole("button", { name: space.label });
      expect(button.getAttribute("data-space")).toBe(space.key);
      expect(button.getAttribute("title")).toBe(space.label);
    });
  });

  it("expands the rail when the burger toggle is clicked", () => {
    const { container } = renderRail(<EditorialRail />);
    const aside = container.querySelector("aside");
    const toggle = screen.getByRole("button", { name: "Expand or collapse the sidebar" });

    expect(aside?.className).not.toContain("is-expanded");
    fireEvent.click(toggle);
    expect(aside?.className).toContain("is-expanded");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(toggle);
    expect(aside?.className).not.toContain("is-expanded");
  });

  it("uses i18n keys for the rail aria-label and the spaces nav aria-label", () => {
    renderRail(<EditorialRail />);
    expect(screen.getByRole("complementary", { name: "Editorial rail" })).toBeDefined();
    expect(screen.getByRole("navigation", { name: "Spaces" })).toBeDefined();
  });

  it("highlights the Active Space when no sub-sidebar is open", () => {
    renderRail(<EditorialRail openSpace={null} />, "/library");
    const library = screen.getByRole("button", { name: "My library" });
    expect(library.getAttribute("aria-pressed")).toBe("true");
    expect(library.className).toContain("is-active");
  });

  it("openSpace prop overrides the Active Space", () => {
    renderRail(<EditorialRail openSpace="coaching" />, "/library");
    expect(screen.getByRole("button", { name: "Coaching" }).getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(screen.getByRole("button", { name: "My library" }).getAttribute("aria-pressed")).toBe(
      "false"
    );
  });

  it("calls onToggleSpace with the correct key on button click", () => {
    const onToggleSpace = vi.fn();
    renderRail(<EditorialRail onToggleSpace={onToggleSpace} />);

    fireEvent.click(screen.getByRole("button", { name: "My library" }));
    expect(onToggleSpace).toHaveBeenLastCalledWith("library");
    fireEvent.click(screen.getByRole("button", { name: "Coaching" }));
    expect(onToggleSpace).toHaveBeenLastCalledWith("coaching");
    expect(onToggleSpace).toHaveBeenCalledTimes(2);
  });

  it("does not throw when onToggleSpace is omitted", () => {
    renderRail(<EditorialRail />);
    expect(() => fireEvent.click(screen.getByRole("button", { name: "My library" }))).not.toThrow();
  });

  it("forwards an additional className to the root aside", () => {
    const { container } = renderRail(<EditorialRail className="my-extra" />);
    const aside = container.querySelector("aside");
    expect(aside?.className).toContain("editorial-rail");
    expect(aside?.className).toContain("my-extra");
  });
});
