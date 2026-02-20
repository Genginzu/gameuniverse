import { describe, it, expect } from "vitest";
import { getUserRoleFromUser } from "../../../src/lib/auth-admin";
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

  it("returns 'admin' via metadata role", () => {
    const user = makeUser({
      email: "someone@gmail.com",
      user_metadata: { role: "admin" },
    });
    expect(getUserRoleFromUser(user)).toBe("admin");
  });

  it("returns 'contributor' via metadata role", () => {
    const user = makeUser({
      email: "someone@gmail.com",
      user_metadata: { role: "contributor" },
    });
    expect(getUserRoleFromUser(user)).toBe("contributor");
  });

  it("returns 'user' for null user", () => {
    expect(getUserRoleFromUser(null)).toBe("user");
  });

  it("returns 'user' for user without email", () => {
    const user = makeUser({ email: undefined });
    expect(getUserRoleFromUser(user)).toBe("user");
  });
});
