import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { adminGuardResponse } from "@/lib/auth-admin";

const user = (appMetadata: Record<string, unknown>, userMetadata: Record<string, unknown> = {}) => ({
  id: "u1",
  email: "player@example.com",
  app_metadata: appMetadata,
  user_metadata: userMetadata,
});

describe("adminGuardResponse", () => {
  beforeEach(() => mockGetUser.mockReset());

  it("lets an admin through", async () => {
    mockGetUser.mockResolvedValue({ data: { user: user({ role: "admin" }) }, error: null });
    expect(await adminGuardResponse()).toBeNull();
  });

  it("rejects a non-admin with 403, even with a self-assigned user_metadata role", async () => {
    mockGetUser.mockResolvedValue({ data: { user: user({}, { role: "admin" }) }, error: null });
    expect((await adminGuardResponse())?.status).toBe(403);
  });

  it("rejects an anonymous caller with 401", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await adminGuardResponse())?.status).toBe(401);
  });
});
