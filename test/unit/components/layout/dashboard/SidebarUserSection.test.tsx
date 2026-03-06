import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

/**
 * Feature: navigation-sidebar, Task 2.5
 * Unit tests for SidebarUserSection — verifies dropdown with theme toggle,
 * settings, and sign out.
 * Validates: Requirements 6.1, 6.2, 6.3
 */

const mockPush = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

const mockSetTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme: mockSetTheme }),
}));

import SidebarUserSection from "@/components/layout/dashboard/SidebarUserSection";

const mockUser = {
  id: "user-123",
  email: "player@example.com",
  app_metadata: {},
  user_metadata: { username: "GamerOne" },
  aud: "authenticated",
  created_at: "2024-01-01",
} as import("@supabase/supabase-js").User;

const mockSignOut = vi.fn(() => Promise.resolve());

describe("SidebarUserSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Display name rendering", () => {
    it("displays the username from user_metadata", () => {
      render(<SidebarUserSection user={mockUser} signOut={mockSignOut} locale="fr" />);

      expect(screen.getByText("GamerOne")).toBeInTheDocument();
    });

    it("falls back to email prefix when no username", () => {
      const userNoUsername = {
        ...mockUser,
        user_metadata: {},
      } as import("@supabase/supabase-js").User;

      render(<SidebarUserSection user={userNoUsername} signOut={mockSignOut} locale="fr" />);

      expect(screen.getByText("player")).toBeInTheDocument();
    });
  });

  describe("Dropdown toggle", () => {
    it("does not show dropdown items initially", () => {
      render(<SidebarUserSection user={mockUser} signOut={mockSignOut} locale="fr" />);

      // Dropdown items should not be visible before clicking
      expect(screen.queryByText("settings")).not.toBeInTheDocument();
      expect(screen.queryByText("logout")).not.toBeInTheDocument();
    });

    it("shows dropdown items when user button is clicked", () => {
      render(<SidebarUserSection user={mockUser} signOut={mockSignOut} locale="fr" />);

      // Click the user section button to open dropdown
      fireEvent.click(screen.getByText("GamerOne"));

      expect(screen.getByText("settings")).toBeInTheDocument();
      expect(screen.getByText("logout")).toBeInTheDocument();
    });

    it("shows theme toggle in dropdown (lightMode when dark theme)", () => {
      render(<SidebarUserSection user={mockUser} signOut={mockSignOut} locale="fr" />);

      fireEvent.click(screen.getByText("GamerOne"));

      // Theme is "dark" in mock, so it should show lightMode option
      expect(screen.getByText("lightMode")).toBeInTheDocument();
    });
  });

  describe("Dropdown actions", () => {
    it("calls setTheme when theme toggle is clicked", () => {
      render(<SidebarUserSection user={mockUser} signOut={mockSignOut} locale="fr" />);

      fireEvent.click(screen.getByText("GamerOne"));
      fireEvent.click(screen.getByText("lightMode"));

      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("navigates to settings when settings is clicked", () => {
      render(<SidebarUserSection user={mockUser} signOut={mockSignOut} locale="fr" />);

      fireEvent.click(screen.getByText("GamerOne"));
      fireEvent.click(screen.getByText("settings"));

      expect(mockPush).toHaveBeenCalledWith("/settings");
    });

    it("calls signOut when logout is clicked", async () => {
      render(<SidebarUserSection user={mockUser} signOut={mockSignOut} locale="fr" />);

      fireEvent.click(screen.getByText("GamerOne"));
      fireEvent.click(screen.getByText("logout"));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledOnce();
      });
    });
  });

  describe("User section structure", () => {
    it("renders a separator border at the top", () => {
      const { container } = render(
        <SidebarUserSection user={mockUser} signOut={mockSignOut} locale="fr" />
      );

      // The root div has border-t class for separation
      const rootDiv = container.firstElementChild;
      expect(rootDiv?.className).toContain("border-t");
    });

    it("renders the user avatar icon", () => {
      const { container } = render(
        <SidebarUserSection user={mockUser} signOut={mockSignOut} locale="fr" />
      );

      // Avatar container has the gradient background
      const avatarDiv = container.querySelector(".bg-gradient-to-br");
      expect(avatarDiv).toBeInTheDocument();
    });
  });
});
