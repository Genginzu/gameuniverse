import { describe, it, expect } from "vitest";
import { getUserRoleFromUser } from "@/lib/auth-admin";
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

describe("auth-admin getUserRoleFromUser", () => {
  it("returns 'admin' when app_metadata.role is admin", () => {
    const user = makeUser({ app_metadata: { role: "admin" } });
    expect(getUserRoleFromUser(user)).toBe("admin");
  });

  it("returns 'contributor' when app_metadata.role is contributor", () => {
    const user = makeUser({ app_metadata: { role: "contributor" } });
    expect(getUserRoleFromUser(user)).toBe("contributor");
  });

  it("returns 'user' for a regular account", () => {
    expect(getUserRoleFromUser(makeUser())).toBe("user");
  });

  it("ignores a self-assigned user_metadata role (user-editable)", () => {
    const admin = makeUser({ user_metadata: { role: "admin" } });
    const contributor = makeUser({ user_metadata: { role: "contributor" } });
    expect(getUserRoleFromUser(admin)).toBe("user");
    expect(getUserRoleFromUser(contributor)).toBe("user");
  });

  it("no longer grants a role from the email domain", () => {
    expect(getUserRoleFromUser(makeUser({ email: "john@admin.gamesuniverse.com" }))).toBe("user");
    expect(getUserRoleFromUser(makeUser({ email: "jane@contributor.gamesuniverse.com" }))).toBe(
      "user"
    );
  });

  it("returns 'user' for an unknown app_metadata role", () => {
    expect(getUserRoleFromUser(makeUser({ app_metadata: { role: "superuser" } }))).toBe("user");
  });

  it("keeps the app_metadata role for an account without email", () => {
    const user = makeUser({ email: undefined, app_metadata: { role: "admin" } });
    expect(getUserRoleFromUser(user)).toBe("admin");
  });

  it("returns 'user' for null user", () => {
    expect(getUserRoleFromUser(null)).toBe("user");
  });
});
