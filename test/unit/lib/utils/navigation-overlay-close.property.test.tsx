import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import * as fc from "fast-check";
import React from "react";
import { NAV_LINKS, PUBLIC_LINKS } from "@/lib/utils/navigation-utils";

/**
 * Feature: navigation-sidebar, Propriété 2 : Fermeture de l'overlay mobile au clic sur un lien
 *
 * Pour tout lien dans NAV_LINKS ou PUBLIC_LINKS, lorsqu'il est cliqué dans
 * l'overlay mobile ouvert, le callback onClose est appelé exactement une fois.
 *
 * Valide : Exigence 5.5
 */

// Mock i18n navigation — Link renders a plain <a> that forwards onClick
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/dashboard",
  Link: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) =>
    React.createElement(
      "a",
      {
        href,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault(); // Prevent jsdom navigation warnings
          onClick?.();
        },
      },
      children
    ),
}));

import MobileNavOverlay from "@/components/layout/dashboard/MobileNavOverlay";

const ALL_LINKS = [...NAV_LINKS, ...PUBLIC_LINKS];

describe("Feature: navigation-sidebar, Propriété 2 : Fermeture de l'overlay mobile au clic sur un lien", () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onSearchOpen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onSearchOpen = vi.fn();
  });

  it("onClose est appelé exactement une fois au clic sur tout lien de navigation", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: ALL_LINKS.length - 1 }), (linkIndex) => {
        onClose.mockClear();

        const { container, unmount } = render(
          <MobileNavOverlay
            isOpen={true}
            onClose={onClose}
            onSearchOpen={onSearchOpen}
            isAuthenticated={true}
          />
        );

        const link = ALL_LINKS[linkIndex];
        const anchor = container.querySelector(`a[href="${link.href}"]`);

        expect(anchor).not.toBeNull();
        fireEvent.click(anchor!);
        expect(onClose).toHaveBeenCalledTimes(1);

        unmount();
        cleanup();
      }),
      { numRuns: 100 }
    );
  }, 30_000);
});
