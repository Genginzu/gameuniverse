import { describe, it, expect, vi } from "vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    onClick,
    className,
    role,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
    role?: string;
  }) => React.createElement("a", { href, onClick, className, role }, children),
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "a@x.com", user_metadata: { username: "alice" } },
    loading: false,
    signOut: vi.fn(),
  }),
}));
vi.mock("@/hooks/useNotifications", () => ({ useNotifications: () => ({ unreadCount: 0 }) }));
vi.mock("@/hooks/usePendingRequestCount", () => ({
  usePendingRequestCount: () => ({ count: 0 }),
}));
vi.mock("@/components/ui/lazy-image", () => ({
  LazyImage: ({ src }: { src: string }) => React.createElement("img", { src, alt: "" }),
}));

import { EditorialMegaMenu } from "@/components/layout/editorial/EditorialMegaMenu";
import { EditorialMobileNav } from "@/components/layout/editorial/EditorialMobileNav";
import { EditorialSubSidebar } from "@/components/layout/editorial/EditorialSubSidebar";
import { HeaderUserDropdown } from "@/components/layout/editorial/HeaderUserDropdown";
import { buildNavigation, NavigationTestProvider } from "@/test-helpers/editorial-navigation";

const model = buildNavigation({
  pathname: "/groups/speedrunners",
  isAuthenticated: true,
  memberships: {
    groups: {
      isLoading: false,
      items: [{ id: "g1", name: "Speedrunners", slug: "speedrunners", imageUrl: null }],
    },
    communities: {
      isLoading: false,
      items: [{ id: "c1", name: "Retro", slug: "retro", imageUrl: "https://img/retro.png" }],
    },
  },
});

// Chrome links (logo, sign-in) are not part of the Navigation Model.
const CHROME_HREFS = new Set(["/", "/auth"]);

function withModel(ui: React.ReactElement) {
  return render(<NavigationTestProvider model={model}>{ui}</NavigationTestProvider>);
}

function renderedHrefs(container: HTMLElement): string[] {
  return [...container.querySelectorAll("a[href]")]
    .map((a) => a.getAttribute("href")!)
    .filter((href) => !CHROME_HREFS.has(href));
}

function activeHrefs(container: HTMLElement): string[] {
  return [...container.querySelectorAll("a.is-active")].map((a) => a.getAttribute("href")!);
}

function collectDesktop(): { hrefs: Set<string>; active: Set<string> } {
  const hrefs = new Set<string>();
  const active = new Set<string>();
  const record = (container: HTMLElement) => {
    renderedHrefs(container).forEach((h) => hrefs.add(h));
    activeHrefs(container).forEach((h) => active.add(h));
  };

  const megaMenu = withModel(<EditorialMegaMenu />);
  for (const entry of model.publicEntries) {
    fireEvent.click(within(megaMenu.container).getByRole("button", { name: entry.label }));
    record(megaMenu.container);
  }
  cleanup();

  for (const space of model.spaces) {
    record(withModel(<EditorialSubSidebar spaceKey={space.key} onClose={() => {}} />).container);
    cleanup();
  }

  const dropdown = withModel(<HeaderUserDropdown />);
  fireEvent.click(screen.getByTestId("header-user-trigger"));
  record(dropdown.container);
  cleanup();

  return { hrefs, active };
}

function collectMobile(): { hrefs: Set<string>; active: Set<string> } {
  const hrefs = new Set<string>();
  const active = new Set<string>();
  const { container } = withModel(<EditorialMobileNav />);
  fireEvent.click(screen.getByRole("button", { name: "mobileNav.openAriaLabel" }));

  const triggers = [
    ...container.querySelectorAll<HTMLButtonElement>(".editorial-mobile-section-trigger"),
  ];
  for (const trigger of triggers) {
    fireEvent.click(trigger);
    renderedHrefs(container).forEach((h) => hrefs.add(h));
    activeHrefs(container).forEach((h) => active.add(h));
  }
  cleanup();
  return { hrefs, active };
}

describe("editorial navigation parity (mobile vs desktop)", () => {
  it("offers exactly the same destinations on mobile and desktop", () => {
    const desktop = collectDesktop();
    const mobile = collectMobile();

    expect([...mobile.hrefs].sort()).toEqual([...desktop.hrefs].sort());
    expect(mobile.hrefs).toContain("/groups/speedrunners");
    expect(mobile.hrefs).toContain("/communities/retro");
    expect(mobile.hrefs).toContain("/settings");
  });

  it("highlights the same Active Link on mobile and desktop", () => {
    const desktop = collectDesktop();
    const mobile = collectMobile();

    expect([...desktop.active]).toEqual(["/groups/speedrunners"]);
    expect([...mobile.active]).toEqual(["/groups/speedrunners"]);
  });
});
