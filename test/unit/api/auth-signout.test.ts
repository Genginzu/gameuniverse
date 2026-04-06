import { describe, test, expect, beforeEach, vi } from "vitest";

let mockSignOut: any;

vi.mock("../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      auth: {
        signOut: () => mockSignOut?.() ?? Promise.resolve({ error: null }),
      },
    }),
}));

vi.mock("../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { POST } = await import("../../../src/app/api/auth/signout/route");

describe("POST /api/auth/signout", () => {
  beforeEach(() => {
    mockSignOut = null;
  });

  test("returns 200 with { success: true } on success", async () => {
    mockSignOut = vi.fn(() => Promise.resolve({ error: null }));

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
  });

  test("returns 500 when signOut has error", async () => {
    mockSignOut = vi.fn(() =>
      Promise.resolve({ error: { message: "Sign out failed" } })
    );

    const res = await POST();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to sign out");
  });
});
