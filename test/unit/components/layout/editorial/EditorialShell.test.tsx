import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock the heavy children with light stubs that expose enough hooks to
// verify the orchestration (mainly: search overlay state wiring).
// ---------------------------------------------------------------------------

vi.mock("@/components/layout/editorial/EditorialLayout", () => ({
  EditorialLayout: ({
    header,
    children,
    className,
    disableMobileNav,
  }: {
    header?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    disableMobileNav?: boolean;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": "editorial-layout",
        "data-disable-mobile-nav": String(disableMobileNav ?? false),
        className,
      },
      header
        ? React.createElement(
            "header",
            { "data-testid": "editorial-layout-header" },
            header
          )
        : null,
      React.createElement("main", { "data-testid": "editorial-layout-main" }, children)
    ),
}));

vi.mock("@/components/layout/editorial/EditorialMegaMenu", () => ({
  EditorialMegaMenu: ({
    searchSlot,
    languageSlot,
    userSlot,
  }: {
    searchSlot?: React.ReactNode;
    languageSlot?: React.ReactNode;
    userSlot?: React.ReactNode;
  }) =>
    React.createElement(
      "nav",
      { "data-testid": "editorial-mega-menu" },
      React.createElement(
        "div",
        { "data-testid": "mega-menu-search-slot" },
        searchSlot
      ),
      React.createElement(
        "div",
        { "data-testid": "mega-menu-language-slot" },
        languageSlot
      ),
      React.createElement(
        "div",
        { "data-testid": "mega-menu-user-slot" },
        userSlot
      )
    ),
}));

vi.mock("@/components/layout/editorial/HeaderSearchTrigger", () => ({
  HeaderSearchTrigger: ({ onActivate }: { onActivate: () => void }) =>
    React.createElement(
      "button",
      { "data-testid": "header-search-trigger", onClick: onActivate },
      "Search"
    ),
}));

vi.mock("@/components/layout/editorial/HeaderLanguageSwitcher", () => ({
  HeaderLanguageSwitcher: () =>
    React.createElement(
      "div",
      { "data-testid": "header-language-switcher" },
      "FR"
    ),
}));

vi.mock("@/components/layout/editorial/HeaderUserDropdown", () => ({
  HeaderUserDropdown: () =>
    React.createElement(
      "div",
      { "data-testid": "header-user-dropdown" },
      "User"
    ),
}));

vi.mock("@/components/layout/editorial/search/SearchOverlay", () => ({
  SearchOverlay: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen
      ? React.createElement(
          "div",
          { "data-testid": "search-overlay" },
          React.createElement(
            "button",
            { "data-testid": "search-overlay-close", onClick: onClose },
            "Close"
          )
        )
      : null,
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { EditorialShell } from "@/components/layout/editorial/EditorialShell";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EditorialShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders EditorialLayout with the mega-menu in the header slot", () => {
    render(
      <EditorialShell>
        <p data-testid="page-content">Hello</p>
      </EditorialShell>
    );

    expect(screen.getByTestId("editorial-layout")).toBeDefined();
    expect(screen.getByTestId("editorial-layout-header")).toBeDefined();
    expect(screen.getByTestId("editorial-mega-menu")).toBeDefined();
  });

  it("forwards children to EditorialLayout main slot", () => {
    render(
      <EditorialShell>
        <p data-testid="page-content">Hello</p>
      </EditorialShell>
    );

    const main = screen.getByTestId("editorial-layout-main");
    expect(main.contains(screen.getByTestId("page-content"))).toBe(true);
  });

  it("wires the 3 mega-menu slots: search, language, user", () => {
    render(<EditorialShell>x</EditorialShell>);

    expect(
      screen
        .getByTestId("mega-menu-search-slot")
        .contains(screen.getByTestId("header-search-trigger"))
    ).toBe(true);
    expect(
      screen
        .getByTestId("mega-menu-language-slot")
        .contains(screen.getByTestId("header-language-switcher"))
    ).toBe(true);
    expect(
      screen
        .getByTestId("mega-menu-user-slot")
        .contains(screen.getByTestId("header-user-dropdown"))
    ).toBe(true);
  });

  it("does not render the SearchOverlay initially (isOpen=false)", () => {
    render(<EditorialShell>x</EditorialShell>);
    expect(screen.queryByTestId("search-overlay")).toBeNull();
  });

  it("opens the SearchOverlay when the HeaderSearchTrigger is activated", () => {
    render(<EditorialShell>x</EditorialShell>);

    fireEvent.click(screen.getByTestId("header-search-trigger"));

    expect(screen.getByTestId("search-overlay")).toBeDefined();
  });

  it("closes the SearchOverlay via its onClose callback", () => {
    render(<EditorialShell>x</EditorialShell>);

    fireEvent.click(screen.getByTestId("header-search-trigger"));
    expect(screen.getByTestId("search-overlay")).toBeDefined();

    fireEvent.click(screen.getByTestId("search-overlay-close"));
    expect(screen.queryByTestId("search-overlay")).toBeNull();
  });

  it("forwards disableMobileNav and className to EditorialLayout", () => {
    render(
      <EditorialShell disableMobileNav className="my-custom">
        x
      </EditorialShell>
    );

    const layout = screen.getByTestId("editorial-layout");
    expect(layout.getAttribute("data-disable-mobile-nav")).toBe("true");
    expect(layout.className).toBe("my-custom");
  });
});
