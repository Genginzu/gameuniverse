import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// next-intl mock with interpolation
// ---------------------------------------------------------------------------

const translations: Record<string, string> = {
  "header.userDropdown.dropdownAriaLabel": "User menu",
  "header.userDropdown.avatarAlt": "Avatar of {username}",
  "header.userDropdown.signIn": "Sign in",
  "header.userDropdown.signOut": "Sign out",
  "header.userDropdown.profile": "Profile",
  "header.userDropdown.library": "Library",
};

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string, params?: Record<string, string>) => {
    const fullKey = `${namespace}.${key}`;
    let value = translations[fullKey] ?? fullKey;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, String(v));
      }
    }
    return value;
  },
}));

// ---------------------------------------------------------------------------
// @/i18n/navigation : usePathname + Link stubs
// ---------------------------------------------------------------------------

const mockPathname = vi.fn<() => string>(() => "/games");

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    onClick,
    className,
    role,
    "data-testid": dataTestId,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
    role?: string;
    "data-testid"?: string;
  }) =>
    React.createElement(
      "a",
      {
        href,
        className,
        role,
        onClick,
        "data-testid": dataTestId,
      },
      children
    ),
  usePathname: () => mockPathname(),
}));

// ---------------------------------------------------------------------------
// useAuth mock
// ---------------------------------------------------------------------------

const mockUseAuth = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { HeaderUserDropdown } from "@/components/layout/editorial/HeaderUserDropdown";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(
  overrides: {
    username?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } = {}
) {
  return {
    id: "user-1",
    email: overrides.email ?? "alice@example.com",
    user_metadata: {
      username: overrides.username !== undefined ? overrides.username : "alice",
      avatar_url: overrides.avatar_url ?? null,
    },
  };
}

function setAuth({
  user = null,
  loading = false,
  signOut = vi.fn(async () => {}),
}: {
  user?: ReturnType<typeof makeUser> | null;
  loading?: boolean;
  signOut?: ReturnType<typeof vi.fn>;
} = {}) {
  mockUseAuth.mockReturnValue({ user, loading, signOut });
  return signOut;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("HeaderUserDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/games");
  });

  describe("loading state", () => {
    it("renders a placeholder while auth is loading (avoids layout shift)", () => {
      setAuth({ loading: true });
      render(<HeaderUserDropdown />);
      expect(screen.getByTestId("header-user-placeholder")).toBeDefined();
      expect(screen.queryByTestId("header-user-trigger")).toBeNull();
      expect(screen.queryByTestId("header-user-signin")).toBeNull();
    });
  });

  describe("not authenticated", () => {
    it("renders a Sign in CTA pointing to /auth", () => {
      setAuth({ user: null, loading: false });
      render(<HeaderUserDropdown />);
      const link = screen.getByTestId("header-user-signin");
      expect(link.getAttribute("href")).toBe("/auth");
      expect(link.textContent).toContain("Sign in");
    });

    it("does not render the trigger when no user is logged in", () => {
      setAuth({ user: null, loading: false });
      render(<HeaderUserDropdown />);
      expect(screen.queryByTestId("header-user-trigger")).toBeNull();
    });
  });

  describe("authenticated", () => {
    it("renders the avatar URL when user has avatar_url", () => {
      setAuth({ user: makeUser({ avatar_url: "https://example.com/a.png" }) });
      render(<HeaderUserDropdown />);
      const trigger = screen.getByTestId("header-user-trigger");
      const img = trigger.querySelector("img");
      expect(img?.getAttribute("src")).toBe("https://example.com/a.png");
      expect(img?.getAttribute("alt")).toBe("Avatar of alice");
    });

    it("renders the initial when user has no avatar_url (uppercase first letter of username)", () => {
      setAuth({ user: makeUser({ username: "boby", avatar_url: null }) });
      render(<HeaderUserDropdown />);
      const trigger = screen.getByTestId("header-user-trigger");
      const fallback = trigger.querySelector(".header-user-avatar-fallback");
      expect(fallback?.textContent).toBe("B");
    });

    it("falls back to email initial when no username", () => {
      setAuth({
        user: makeUser({ username: null, email: "charlie@x.com", avatar_url: null }),
      });
      render(<HeaderUserDropdown />);
      const trigger = screen.getByTestId("header-user-trigger");
      const fallback = trigger.querySelector(".header-user-avatar-fallback");
      expect(fallback?.textContent).toBe("C");
    });

    it("trigger has correct ARIA attributes", () => {
      setAuth({ user: makeUser() });
      render(<HeaderUserDropdown />);
      const trigger = screen.getByTestId("header-user-trigger");
      expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(trigger.getAttribute("aria-label")).toBe("User menu");
    });

    it("opens the menu on trigger click and updates aria-expanded", () => {
      setAuth({ user: makeUser() });
      render(<HeaderUserDropdown />);
      const trigger = screen.getByTestId("header-user-trigger");

      fireEvent.click(trigger);

      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(screen.getByTestId("header-user-menu")).toBeDefined();
    });

    it("closes the menu on second trigger click", () => {
      setAuth({ user: makeUser() });
      render(<HeaderUserDropdown />);
      const trigger = screen.getByTestId("header-user-trigger");

      fireEvent.click(trigger);
      fireEvent.click(trigger);

      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(screen.queryByTestId("header-user-menu")).toBeNull();
    });

    it("opens the menu on ArrowDown / Enter / Space keys", () => {
      setAuth({ user: makeUser() });
      render(<HeaderUserDropdown />);
      const trigger = screen.getByTestId("header-user-trigger");

      fireEvent.keyDown(trigger, { key: "ArrowDown" });
      expect(trigger.getAttribute("aria-expanded")).toBe("true");

      fireEvent.click(trigger); // close
      fireEvent.keyDown(trigger, { key: "Enter" });
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    });

    it("displays the username in the menu header", () => {
      setAuth({ user: makeUser({ username: "alice" }) });
      render(<HeaderUserDropdown />);
      fireEvent.click(screen.getByTestId("header-user-trigger"));
      expect(screen.getByText("alice")).toBeDefined();
    });

    it("renders Profile and Library menu items pointing to the right routes", () => {
      setAuth({ user: makeUser() });
      render(<HeaderUserDropdown />);
      fireEvent.click(screen.getByTestId("header-user-trigger"));

      const profile = screen.getByTestId("header-user-menu-profile");
      const library = screen.getByTestId("header-user-menu-library");
      expect(profile.getAttribute("href")).toBe("/profile");
      expect(library.getAttribute("href")).toBe("/library");
      expect(profile.getAttribute("role")).toBe("menuitem");
      expect(library.getAttribute("role")).toBe("menuitem");
    });

    it("marks the active menu item based on the current pathname", () => {
      mockPathname.mockReturnValue("/library");
      setAuth({ user: makeUser() });
      render(<HeaderUserDropdown />);
      fireEvent.click(screen.getByTestId("header-user-trigger"));

      expect(
        screen.getByTestId("header-user-menu-library").className
      ).toContain("is-active");
      expect(
        screen.getByTestId("header-user-menu-profile").className
      ).not.toContain("is-active");
    });

    it("closes the menu when a menu item link is clicked", () => {
      setAuth({ user: makeUser() });
      render(<HeaderUserDropdown />);
      fireEvent.click(screen.getByTestId("header-user-trigger"));
      fireEvent.click(screen.getByTestId("header-user-menu-profile"));
      expect(screen.queryByTestId("header-user-menu")).toBeNull();
    });

    it("Sign out button calls signOut and closes the menu", async () => {
      const signOut = setAuth({ user: makeUser() });
      render(<HeaderUserDropdown />);
      fireEvent.click(screen.getByTestId("header-user-trigger"));

      await act(async () => {
        fireEvent.click(screen.getByTestId("header-user-menu-signout"));
      });

      expect(signOut).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("header-user-menu")).toBeNull();
    });

    it("Escape key closes the menu", () => {
      setAuth({ user: makeUser() });
      render(<HeaderUserDropdown />);
      fireEvent.click(screen.getByTestId("header-user-trigger"));
      expect(screen.getByTestId("header-user-menu")).toBeDefined();

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(screen.queryByTestId("header-user-menu")).toBeNull();
    });

    it("clicking outside the dropdown closes it", () => {
      setAuth({ user: makeUser() });
      render(
        <div>
          <button data-testid="outside">Outside</button>
          <HeaderUserDropdown />
        </div>
      );
      fireEvent.click(screen.getByTestId("header-user-trigger"));
      expect(screen.getByTestId("header-user-menu")).toBeDefined();

      // Outside click via mousedown (the listener is on mousedown)
      fireEvent.mouseDown(screen.getByTestId("outside"));
      expect(screen.queryByTestId("header-user-menu")).toBeNull();
    });

    it("renders the Sign out item with the danger variant class", () => {
      setAuth({ user: makeUser() });
      render(<HeaderUserDropdown />);
      fireEvent.click(screen.getByTestId("header-user-trigger"));
      const signoutBtn = screen.getByTestId("header-user-menu-signout");
      expect(signoutBtn.className).toContain("header-user-menu-item-danger");
    });
  });
});
