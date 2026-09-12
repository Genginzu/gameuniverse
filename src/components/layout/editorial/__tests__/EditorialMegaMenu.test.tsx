import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

const mockUsePathname = vi.fn<[], string>(() => "/");
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockUsePathname(),
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

import {
  EditorialMegaMenu,
  EDITORIAL_MEGA_MENU_ENTRIES,
  megaMenuEntryFromPathname,
} from "@/components/layout/editorial/EditorialMegaMenu";

describe("megaMenuEntryFromPathname (helper)", () => {
  it("returns null for empty / unrelated input", () => {
    expect(megaMenuEntryFromPathname(null)).toBeNull();
    expect(megaMenuEntryFromPathname("")).toBeNull();
    expect(megaMenuEntryFromPathname("/")).toBeNull();
    expect(megaMenuEntryFromPathname("/admin/games")).toBeNull();
  });

  it("matches the games entry", () => {
    expect(megaMenuEntryFromPathname("/games")).toBe("games");
    expect(megaMenuEntryFromPathname("/games/zelda")).toBe("games");
    expect(megaMenuEntryFromPathname("/trending")).toBe("games");
    expect(megaMenuEntryFromPathname("/upcoming")).toBe("games");
  });

  it("matches the characters entry (only public character browsing)", () => {
    expect(megaMenuEntryFromPathname("/characters")).toBe("characters");
    // Favorite characters are user-specific now → handled by the rail, not the top bar.
    expect(megaMenuEntryFromPathname("/favorites/characters")).toBeNull();
  });

  it("matches the players entry (public players directory only)", () => {
    expect(megaMenuEntryFromPathname("/players")).toBe("players");
    // Discussions are user-specific now → rail (account space), not the top bar.
    expect(megaMenuEntryFromPathname("/discussions")).toBeNull();
    // Friends are user-specific now → not part of the public players entry.
    expect(megaMenuEntryFromPathname("/friends")).toBeNull();
  });

  it("matches the esport entry for public esport pages only", () => {
    expect(megaMenuEntryFromPathname("/esport/live")).toBe("esport");
    expect(megaMenuEntryFromPathname("/esport/teams")).toBe("esport");
    expect(megaMenuEntryFromPathname("/esport/tournaments")).toBe("esport");
    // Predictions / fantasy are user-specific → rail, not top bar.
    expect(megaMenuEntryFromPathname("/esport/predictions")).toBeNull();
    expect(megaMenuEntryFromPathname("/esport/fantasy")).toBeNull();
  });

  it("does not match prefixes that only share a starting substring", () => {
    expect(megaMenuEntryFromPathname("/gamesettings")).toBeNull();
  });
});

describe("EDITORIAL_MEGA_MENU_ENTRIES contract", () => {
  it("exposes exactly 4 public entries (games, characters, players, esport)", () => {
    expect(EDITORIAL_MEGA_MENU_ENTRIES.map((e) => e.key)).toEqual([
      "games",
      "characters",
      "players",
      "esport",
    ]);
  });

  it("each entry has an icon and at least one section with at least one link (icon included)", () => {
    EDITORIAL_MEGA_MENU_ENTRIES.forEach((entry) => {
      expect(entry.icon).toMatch(/^[a-z]+:/);
      expect(entry.sections.length).toBeGreaterThan(0);
      entry.sections.forEach((section) => {
        expect(section.links.length).toBeGreaterThan(0);
        section.links.forEach((link) => {
          expect(link.href).toMatch(/^\//);
          expect(link.labelKey.length).toBeGreaterThan(0);
          expect(link.icon).toMatch(/^[a-z]+:/);
        });
      });
    });
  });
});

describe("EditorialMegaMenu", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUsePathname.mockReturnValue("/");
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
    it("marks the games entry active based on the pathname", () => {
      mockUsePathname.mockReturnValue("/trending");
      render(<EditorialMegaMenu />);
      const games = screen.getByRole("button", { name: /Games/i });
      expect(games.className).toContain("is-active");
    });

    it("the open panel takes precedence over the pathname", () => {
      mockUsePathname.mockReturnValue("/games");
      render(<EditorialMegaMenu />);
      expect(
        screen.getByRole("button", { name: /Games/i }).className
      ).toContain("is-active");

      fireEvent.click(screen.getByRole("button", { name: /Players/i }));
      expect(
        screen.getByRole("button", { name: /Players/i }).className
      ).toContain("is-active");
      expect(
        screen.getByRole("button", { name: /Games/i }).className
      ).not.toContain("is-active");
    });

    it("does not mark anything active when the pathname is unrelated", () => {
      mockUsePathname.mockReturnValue("/auth/sign-in");
      render(<EditorialMegaMenu />);
      EDITORIAL_MEGA_MENU_ENTRIES.forEach((entry) => {
        const button = screen.getByRole("button", {
          name: new RegExp(editorialTranslations[`editorial.megaMenu.entries.${entry.key}`], "i"),
        });
        expect(button.className).not.toContain("is-active");
      });
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
