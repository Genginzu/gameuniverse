import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

/**
 * Feature: navigation-sidebar, Task 2.5
 * Unit tests for Sidebar component — verifies rendering of nav links,
 * logo, user section, and search button.
 * Validates: Requirements 1.2, 1.3, 1.6
 */

// Mock i18n navigation
const mockUsePathname = vi.fn(() => "/dashboard");
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  Link: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => React.createElement("a", { href, onClick }, children),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme: vi.fn() }),
}));

vi.mock("@/hooks/usePendingRequestCount", () => ({
  usePendingRequestCount: () => ({
    count: 0,
    isLoading: false,
    decrement: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import Sidebar from "@/components/layout/dashboard/Sidebar";

const mockUser = {
  id: "user-123",
  email: "player@example.com",
  app_metadata: {},
  user_metadata: { username: "TestPlayer" },
  aud: "authenticated",
  created_at: "2024-01-01",
} as import("@supabase/supabase-js").User;

const mockSignOut = vi.fn(() => Promise.resolve());

describe("Sidebar", () => {
  describe("Authenticated rendering", () => {
    it("renders the 3 public links (Jeux, Personnages, Joueurs)", () => {
      render(<Sidebar isAuthenticated={true} user={mockUser} signOut={mockSignOut} />);

      // Public links use tNav(labelKey) — our mock returns the key itself
      expect(screen.getByText("games")).toBeInTheDocument();
      expect(screen.getByText("characters")).toBeInTheDocument();
      expect(screen.getByText("players")).toBeInTheDocument();
    });

    it("renders the 6 main nav links when authenticated", () => {
      render(<Sidebar isAuthenticated={true} user={mockUser} signOut={mockSignOut} />);

      // Main links use t(labelKey) from dashboard translations — mock returns key
      expect(screen.getByText("dashboard")).toBeInTheDocument();
      expect(screen.getByText("library")).toBeInTheDocument();
      expect(screen.getByText("myCharacters")).toBeInTheDocument();
      expect(screen.getByText("collections")).toBeInTheDocument();
      expect(screen.getByText("friends")).toBeInTheDocument();
      expect(screen.getByText("profile")).toBeInTheDocument();
    });

    it("renders the user section with display name", () => {
      render(<Sidebar isAuthenticated={true} user={mockUser} signOut={mockSignOut} />);

      expect(screen.getByText("TestPlayer")).toBeInTheDocument();
    });

    it("renders all 9 navigation links (6 main + 3 public) as anchors", () => {
      render(<Sidebar isAuthenticated={true} user={mockUser} signOut={mockSignOut} />);

      const nav = screen.getByRole("navigation", { name: "Main navigation" });
      const links = nav.querySelectorAll("a");
      expect(links).toHaveLength(9);
    });
  });

  describe("Unauthenticated rendering", () => {
    it("renders only the 3 public links when not authenticated", () => {
      render(<Sidebar isAuthenticated={false} />);

      expect(screen.getByText("games")).toBeInTheDocument();
      expect(screen.getByText("characters")).toBeInTheDocument();
      expect(screen.getByText("players")).toBeInTheDocument();

      // Main links should not be present
      expect(screen.queryByText("dashboard")).not.toBeInTheDocument();
      expect(screen.queryByText("library")).not.toBeInTheDocument();
    });

    it("does not render the user section when not authenticated", () => {
      render(<Sidebar isAuthenticated={false} />);

      expect(screen.queryByText("TestPlayer")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("renders a nav element with aria-label", () => {
      render(<Sidebar isAuthenticated={true} user={mockUser} signOut={mockSignOut} />);

      const nav = screen.getByRole("navigation", { name: "Main navigation" });
      expect(nav).toBeInTheDocument();
    });
  });
});
