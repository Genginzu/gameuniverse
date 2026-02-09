import { describe, it, expect } from "bun:test";
import { getUserRoleFromUser, getPermissionsForRole } from "../../../src/hooks/useAdminAuth";
import type { User } from "@supabase/supabase-js";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "test-id",
    email: "regular@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

describe("getUserRoleFromUser", () => {
  it("returns 'admin' for admin domain email", () => {
    const user = makeUser({ email: "john@admin.gamesuniverse.com" });
    expect(getUserRoleFromUser(user)).toBe("admin");
  });

  it("returns 'contributor' for contributor domain email", () => {
    const user = makeUser({ email: "jane@contributor.gamesuniverse.com" });
    expect(getUserRoleFromUser(user)).toBe("contributor");
  });

  it("returns 'user' for regular email", () => {
    const user = makeUser({ email: "someone@gmail.com" });
    expect(getUserRoleFromUser(user)).toBe("user");
  });

  it("returns 'admin' when metadata role is admin", () => {
    const user = makeUser({
      email: "someone@gmail.com",
      user_metadata: { role: "admin" },
    });
    expect(getUserRoleFromUser(user)).toBe("admin");
  });

  it("returns 'contributor' when metadata role is contributor", () => {
    const user = makeUser({
      email: "someone@gmail.com",
      user_metadata: { role: "contributor" },
    });
    expect(getUserRoleFromUser(user)).toBe("contributor");
  });

  it("email domain takes precedence over metadata", () => {
    const user = makeUser({
      email: "someone@admin.gamesuniverse.com",
      user_metadata: { role: "contributor" },
    });
    expect(getUserRoleFromUser(user)).toBe("admin");
  });

  it("returns 'user' for null user", () => {
    expect(getUserRoleFromUser(null)).toBe("user");
  });

  it("returns 'user' for user without email", () => {
    const user = makeUser({ email: undefined });
    expect(getUserRoleFromUser(user)).toBe("user");
  });

  it("returns 'user' for unknown metadata role", () => {
    const user = makeUser({
      email: "someone@gmail.com",
      user_metadata: { role: "superadmin" },
    });
    expect(getUserRoleFromUser(user)).toBe("user");
  });
});

describe("getPermissionsForRole", () => {
  it("admin has full permissions", () => {
    expect(getPermissionsForRole("admin")).toEqual({
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
    });
  });

  it("contributor can create, read, update but not delete", () => {
    expect(getPermissionsForRole("contributor")).toEqual({
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: false,
    });
  });

  it("regular user has no permissions", () => {
    expect(getPermissionsForRole("user")).toEqual({
      canCreate: false,
      canRead: false,
      canUpdate: false,
      canDelete: false,
    });
  });
});
