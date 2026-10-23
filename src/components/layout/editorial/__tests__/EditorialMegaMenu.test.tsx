import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { screen, fireEvent, act } from "@testing-library/react";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    onClick,
    className,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
    "aria-label"?: string;
  }) =>
    React.createElement(
      "a",
      {
        href,
        onClick,
        className,
        "aria-label": ariaLabel,
        "data-testid": `link-${href}`,
      },
      children
    ),
}));

const editorialTranslations: Record<string, string> = {
  "editorial.megaMenu.primaryNavAriaLabel": "Primary navigation",
  "editorial.megaMenu.logoAriaLabel": "Gamers Universe — home",
  "editorial.megaMenu.panel.ariaLabel": "{entry} sub-menu",
  "editorial.megaMenu.entries.games": "Games",
  "editorial.megaMenu.entries.characters": "Characters",
  "editorial.megaMenu.entries.players": "Players",
  "editorial.megaMenu.entries.esport": "Esports",
  "editorial.megaMenu.sections.games.explore": "Explore",
  "editorial.megaMenu.sections.characters.explore": "Explore",
  "editorial.megaMenu.sections.players.community": "Community",
  "editorial.megaMenu.sections.esport.competitions": "Competitions",
  "editorial.megaMenu.sections.esport.proScene": "Teams & players",
  "editorial.megaMenu.links.games.all": "All games",
  "editorial.megaMenu.links.games.trending": "Trending",
  "editorial.megaMenu.links.games.upcoming": "Upcoming",
  "editorial.megaMenu.links.characters.all": "All characters",
  "editorial.megaMenu.links.players.all": "Gamers Universe players",
  "editorial.megaMenu.links.esport.live": "Live now",
  "editorial.megaMenu.links.esport.calendar": "Calendar",
  "editorial.megaMenu.links.esport.tournaments": "Tournaments",
  "editorial.megaMenu.links.esport.results": "Results",
  "editorial.megaMenu.links.esport.teams": "Teams",
  "editorial.megaMenu.links.esport.proPlayers": "Pro players",
};

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string, params?: Record<string, string>) => {
    const fullKey = `${namespace}.${key}`;
    let value = editorialTranslations[fullKey] ?? fullKey;
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(`{${paramKey}}`, paramValue);
      }
    }
    return value;
  },
}));

import { EditorialMegaMenu } from "@/components/layout/editorial/EditorialMegaMenu";
import { renderWithNavigation } from "@/test-helpers/editorial-navigation";

const translate = (key: string) => editorialTranslations[`editorial.${key}`] ?? key;
let pathname = "/";

function render(ui: React.ReactElement) {
  return renderWithNavigation(ui, { pathname }, translate);
}
describe("EditorialMegaMenu", () => {
  beforeEach(() => {
    pathname = "/";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders the logo link to '/' with i18n aria-label", () => {
      render(<EditorialMegaMenu />);
      const logo = screen.getByLabelText("Gamers Universe — home");
      expect(logo.getAttribute("href")).toBe("/");
    });

    it("renders the 4 entry buttons", () => {
      render(<EditorialMegaMenu />);
      expect(screen.getByRole("button", { name: /Games/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Characters/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Players/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Esports/i })).toBeDefined();
    });

    it("renders the primary nav with i18n aria-label", () => {
      render(<EditorialMegaMenu />);
      expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeDefined();
    });

    it("renders the search/language/user slots when provided", () => {
      render(
        <EditorialMegaMenu
          searchSlot={<span data-testid="search-here">search</span>}
          languageSlot={<span data-testid="lang-here">lang</span>}
          userSlot={<span data-testid="user-here">user</span>}
        />
      );
      expect(screen.getByTestId("search-here")).toBeDefined();
      expect(screen.getByTestId("lang-here")).toBeDefined();
      expect(screen.getByTestId("user-here")).toBeDefined();
    });

    it("does not render slot wrappers for missing slots", () => {
      const { container } = render(<EditorialMegaMenu />);
      expect(container.querySelector('[data-slot="search"]')).toBeNull();
      expect(container.querySelector('[data-slot="language"]')).toBeNull();
      expect(container.querySelector('[data-slot="user"]')).toBeNull();
    });

    it("forwards a className", () => {
      const { container } = render(<EditorialMegaMenu className="my-extra" />);
      const root = container.querySelector(".editorial-mega-menu");
      expect(root?.className).toContain("editorial-mega-menu");
      expect(root?.className).toContain("my-extra");
    });
  });

  describe("opening panels via click", () => {
    it("opens the games panel on click", () => {
      render(<EditorialMegaMenu />);
      fireEvent.click(screen.getByRole("button", { name: /Games/i }));
      expect(screen.getByRole("region", { name: "Games sub-menu" })).toBeDefined();
      expect(screen.getByText("All games")).toBeDefined();
      expect(screen.getByText("Trending")).toBeDefined();
    });

    it("flips aria-expanded to true once open", () => {
      render(<EditorialMegaMenu />);
      const games = screen.getByRole("button", { name: /Games/i });
      fireEvent.click(games);
      expect(games.getAttribute("aria-expanded")).toBe("true");
    });

    it("clicking the same entry again closes the panel", () => {
      render(<EditorialMegaMenu />);
      const games = screen.getByRole("button", { name: /Games/i });
      fireEvent.click(games);
      fireEvent.click(games);
      expect(screen.queryByRole("region", { name: "Games sub-menu" })).toBeNull();
    });

    it("clicking another entry switches the panel", () => {
      render(<EditorialMegaMenu />);
      fireEvent.click(screen.getByRole("button", { name: /Games/i }));
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /Esports/i }));
      });
      expect(screen.queryByRole("region", { name: "Games sub-menu" })).toBeNull();
      expect(screen.getByRole("region", { name: "Esports sub-menu" })).toBeDefined();
    });
  });

  describe("hover delays", () => {
    it("opens the panel after the open delay (~80ms)", () => {
      render(<EditorialMegaMenu />);
      const item = screen.getByRole("button", { name: /Games/i }).parentElement!;
      fireEvent.mouseEnter(item);

      expect(screen.queryByRole("region", { name: "Games sub-menu" })).toBeNull();

      act(() => {
        vi.advanceTimersByTime(80);
      });
      expect(screen.queryByRole("region", { name: "Games sub-menu" })).not.toBeNull();
    });

    it("closes after the close delay (~200ms) when the cursor leaves", () => {
      render(<EditorialMegaMenu />);
      const item = screen.getByRole("button", { name: /Games/i }).parentElement!;

      fireEvent.mouseEnter(item);
      act(() => {
        vi.advanceTimersByTime(80);
      });
      expect(screen.queryByRole("region", { name: "Games sub-menu" })).not.toBeNull();

      fireEvent.mouseLeave(item);
      act(() => {
        vi.advanceTimersByTime(199);
      });
      expect(screen.queryByRole("region", { name: "Games sub-menu" })).not.toBeNull();

      act(() => {
        vi.advanceTimersByTime(2);
      });
      expect(screen.queryByRole("region", { name: "Games sub-menu" })).toBeNull();
    });

    it("re-entering before the close delay cancels the close", () => {
      render(<EditorialMegaMenu />);
      const item = screen.getByRole("button", { name: /Games/i }).parentElement!;

      fireEvent.mouseEnter(item);
      act(() => {
        vi.advanceTimersByTime(80);
      });
      expect(screen.queryByRole("region", { name: "Games sub-menu" })).not.toBeNull();

      fireEvent.mouseLeave(item);
      act(() => {
        vi.advanceTimersByTime(100);
      });
      fireEvent.mouseEnter(item);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.queryByRole("region", { name: "Games sub-menu" })).not.toBeNull();
    });
  });

  describe("closing the panel", () => {
    it("closes on Escape", () => {
      render(<EditorialMegaMenu />);
      fireEvent.click(screen.getByRole("button", { name: /Games/i }));
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("region", { name: "Games sub-menu" })).toBeNull();
    });

    it("closes when clicking on a sub-link", () => {
      render(<EditorialMegaMenu />);
      fireEvent.click(screen.getByRole("button", { name: /Games/i }));
      fireEvent.click(screen.getByText("Trending"));
      expect(screen.queryByRole("region", { name: "Games sub-menu" })).toBeNull();
    });

    it("closes when clicking outside the menu", () => {
      render(
        <div>
          <div data-testid="outside" />
          <EditorialMegaMenu />
        </div>
      );
      fireEvent.click(screen.getByRole("button", { name: /Games/i }));
      fireEvent.pointerDown(screen.getByTestId("outside"));
      expect(screen.queryByRole("region", { name: "Games sub-menu" })).toBeNull();
    });

    it("closes when clicking the logo", () => {
      render(<EditorialMegaMenu />);
      fireEvent.click(screen.getByRole("button", { name: /Games/i }));
      fireEvent.click(screen.getByLabelText("Gamers Universe — home"));
      expect(screen.queryByRole("region", { name: "Games sub-menu" })).toBeNull();
    });
  });

  describe("active entry indicator", () => {
    it("the open panel takes precedence over the Active Entry", () => {
      pathname = "/games";
      render(<EditorialMegaMenu />);
      expect(screen.getByRole("button", { name: /Games/i }).className).toContain("is-active");

      fireEvent.click(screen.getByRole("button", { name: /Players/i }));
      expect(screen.getByRole("button", { name: /Players/i }).className).toContain("is-active");
      expect(screen.getByRole("button", { name: /Games/i }).className).not.toContain("is-active");
    });
  });
  describe("panel content", () => {
    it("renders one section title per esport section, translated", () => {
      render(<EditorialMegaMenu />);
      fireEvent.click(screen.getByRole("button", { name: /Esports/i }));
      expect(screen.getByText("Competitions")).toBeDefined();
      expect(screen.getByText("Teams & players")).toBeDefined();
    });

    it("renders the right links inside the esport sections", () => {
      render(<EditorialMegaMenu />);
      fireEvent.click(screen.getByRole("button", { name: /Esports/i }));
      expect(screen.getByText("Live now")).toBeDefined();
      expect(screen.getByText("Tournaments")).toBeDefined();
      expect(screen.getByText("Teams")).toBeDefined();
      expect(screen.getByText("Pro players")).toBeDefined();
    });
  });
});
