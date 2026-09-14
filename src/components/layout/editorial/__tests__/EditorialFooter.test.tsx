import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, within } from "@testing-library/react";

// Mock @/i18n/navigation — render Link as a plain anchor.
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => React.createElement("a", { href, className }, children),
}));

// Mock next-intl with a deterministic dictionary covering the `footer` and
// `navigation` namespaces used by the component.
const dictionaries: Record<string, Record<string, string>> = {
  footer: {
    tagline: "The complete platform to explore the gaming universe",
    copyright: "© {year} Gamers Universe. All rights reserved.",
    explore: "Explore",
    community: "Community",
    madeWith: "Made with",
    forGamers: "for gamers",
  },
  navigation: {
    games: "Games",
    characters: "Characters",
    players: "Players",
    discussions: "Discussions",
    esport: "Esport",
    coaching: "Coaching",
  },
};

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace: string) =>
    (key: string, params?: Record<string, string | number>) => {
      let value = dictionaries[namespace]?.[key] ?? `${namespace}.${key}`;
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          value = value.replace(`{${paramKey}}`, String(paramValue));
        }
      }
      return value;
    },
}));

import { EditorialFooter } from "@/components/layout/editorial/EditorialFooter";

describe("EditorialFooter", () => {
  it("renders a semantic <footer> element", () => {
    const { container } = render(<EditorialFooter />);
    const footer = container.querySelector("footer");
    expect(footer).not.toBeNull();
    expect(footer?.getAttribute("data-testid")).toBe("editorial-footer");
  });

  it("uses editorial dark tokens, not glass/backdrop-blur/opaque white", () => {
    const { container } = render(<EditorialFooter />);
    const footer = container.querySelector("footer")!;
    expect(footer.className).toContain("bg-editorial-2");
    expect(footer.className).toContain("border-editorial-line");
    expect(footer.className).not.toMatch(/glass-/);
    expect(footer.className).not.toMatch(/backdrop-blur/);
    // No opaque white background token anywhere in the subtree.
    const opaqueWhite = Array.from(container.querySelectorAll("[class]")).some((el) =>
      /(?:^|\s)bg-white(?:\s|$)/.test(el.className)
    );
    expect(opaqueWhite).toBe(false);
  });

  it("renders the explore and community link groups with i18n labels", () => {
    render(<EditorialFooter />);
    expect(screen.getByText("Explore")).toBeTruthy();
    expect(screen.getByText("Community")).toBeTruthy();

    const gamesLink = screen.getByText("Games").closest("a");
    expect(gamesLink?.getAttribute("href")).toBe("/games");
    const discussionsLink = screen.getByText("Discussions").closest("a");
    expect(discussionsLink?.getAttribute("href")).toBe("/discussions");
  });

  it("renders the copyright with the current year", () => {
    render(<EditorialFooter />);
    const year = new Date().getFullYear();
    expect(screen.getByText(`© ${year} Gamers Universe. All rights reserved.`)).toBeTruthy();
  });

  it("gives navigation links a >= 44px touch target", () => {
    render(<EditorialFooter />);
    const gamesLink = screen.getByText("Games").closest("a")!;
    expect(within(gamesLink.parentElement!).queryByText("Games")).toBeTruthy();
    expect(gamesLink.className).toContain("min-h-[44px]");
  });
});
