import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import type { CollectionItem } from "@/types/collection";

// ---------------------------------------------------------------------------
// next-intl
// ---------------------------------------------------------------------------

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace: string) =>
    (key: string, params?: Record<string, string | number>) => {
      // Inclut explicitement les params dans la valeur retournée pour qu'on
      // puisse les vérifier dans les assertions.
      let value = `${namespace}.${key}`;
      if (params) {
        const paramsStr = Object.entries(params)
          .map(([k, v]) => `${k}=${v}`)
          .join("|");
        value = `${value}|${paramsStr}`;
      }
      return value;
    },
}));

// ---------------------------------------------------------------------------
// i18n navigation : remplacer Link par un <a> simple
// ---------------------------------------------------------------------------

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    React.createElement("a", { href, ...rest }, children),
}));

// ---------------------------------------------------------------------------
// LazyImage stub (évite next/image et IntersectionObserver)
// ---------------------------------------------------------------------------

vi.mock("@/components/ui/lazy-image", () => ({
  LazyImage: ({ src, alt }: { src?: string; alt?: string }) =>
    React.createElement("img", { src, alt, "data-testid": "lazy-image" }),
}));

// ---------------------------------------------------------------------------
// Iconify stub
// ---------------------------------------------------------------------------

vi.mock("@iconify/react", () => ({
  Icon: ({ icon }: { icon: string }) =>
    React.createElement("span", { "data-testid": "icon", "data-icon": icon }),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { CollectionGameCardEditorial } from "@/components/collections/CollectionGameCardEditorial";

function makeItem(overrides: Partial<CollectionItem> = {}): CollectionItem {
  return {
    id: "ci-1",
    gameId: "g-1",
    slug: "zelda",
    title: "The Legend of Zelda",
    coverImage: "/zelda.jpg",
    genres: [],
    note: null,
    position: 1,
    addedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("CollectionGameCardEditorial", () => {
  it("renders the link to the game page", () => {
    render(<CollectionGameCardEditorial item={makeItem()} />);
    const link = screen.getByRole("link", { name: "The Legend of Zelda" });
    expect(link.getAttribute("href")).toBe("/games/zelda");
  });

  it("does not render the remove button when onRemove is not provided", () => {
    render(<CollectionGameCardEditorial item={makeItem()} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders the remove button when onRemove is provided", () => {
    const onRemove = vi.fn();
    render(<CollectionGameCardEditorial item={makeItem()} onRemove={onRemove} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toContain("The Legend of Zelda");
  });

  it("calls onRemove when the remove button is clicked", () => {
    const onRemove = vi.fn();
    render(<CollectionGameCardEditorial item={makeItem()} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("prevents the click on the remove button from triggering the parent link navigation", () => {
    const onRemove = vi.fn();
    render(<CollectionGameCardEditorial item={makeItem()} onRemove={onRemove} />);

    // Spy click handler on the link to ensure the event doesn't bubble up
    const link = screen.getByRole("link");
    const linkClick = vi.fn();
    link.addEventListener("click", linkClick);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(onRemove).toHaveBeenCalledTimes(1);
    // stopPropagation should keep the link's click handler from firing
    expect(linkClick).not.toHaveBeenCalled();
  });

  it("renders the note when the item has one", () => {
    render(
      <CollectionGameCardEditorial item={makeItem({ note: "Best game ever" })} />
    );
    expect(screen.getByText("Best game ever")).toBeTruthy();
  });
});
