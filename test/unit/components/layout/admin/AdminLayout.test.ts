import { describe, it, expect } from "vitest";
import { getPermissionsForRole, type UserRole } from "../../../../../src/hooks/useAdminAuth";

/**
 * AdminLayout Unit Tests
 *
 * Tests the authorization logic that drives the AdminLayout component:
 * 1. Route protection - unauthorized users should be blocked
 * 2. Role display - correct role badge shown for admin/contributor
 *
 * Requirements: 1.1, 1.2, 2.2
 */

// Simulate the layout's authorization decision logic
function getLayoutState(params: {
  isAuthenticated: boolean;
  loading: boolean;
  role: UserRole;
}): "loading" | "redirect-login" | "forbidden" | "authorized" {
  if (params.loading) return "loading";
  if (!params.isAuthenticated) return "redirect-login";

  const permissions = getPermissionsForRole(params.role);
  if (!permissions.canRead) return "forbidden";

  return "authorized";
}

// Simulate role badge class logic from AdminLayout
function getRoleBadgeClasses(role: UserRole): string {
  return role === "admin"
    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
}

describe("AdminLayout Authorization Logic", () => {
  describe("Route Protection", () => {
    it("should show loading state while auth is loading", () => {
      const state = getLayoutState({
        isAuthenticated: false,
        loading: true,
        role: "user",
      });
      expect(state).toBe("loading");
    });

    it("should redirect unauthenticated users to login", () => {
      const state = getLayoutState({
        isAuthenticated: false,
        loading: false,
        role: "user",
      });
      expect(state).toBe("redirect-login");
    });

    it("should show forbidden for authenticated users without admin/contributor role", () => {
      const state = getLayoutState({
        isAuthenticated: true,
        loading: false,
        role: "user",
      });
      expect(state).toBe("forbidden");
    });

    it("should authorize admin users", () => {
      const state = getLayoutState({
        isAuthenticated: true,
        loading: false,
        role: "admin",
      });
      expect(state).toBe("authorized");
    });

    it("should authorize contributor users", () => {
      const state = getLayoutState({
        isAuthenticated: true,
        loading: false,
        role: "contributor",
      });
      expect(state).toBe("authorized");
    });
  });

  describe("Role Display", () => {
    it("should use red badge classes for admin role", () => {
      const classes = getRoleBadgeClasses("admin");
      expect(classes).toContain("bg-red-100");
      expect(classes).toContain("text-red-800");
    });

    it("should use blue badge classes for contributor role", () => {
      const classes = getRoleBadgeClasses("contributor");
      expect(classes).toContain("bg-blue-100");
      expect(classes).toContain("text-blue-800");
    });
  });
});
