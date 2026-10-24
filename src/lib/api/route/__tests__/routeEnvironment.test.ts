import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: async () => ({ auth: { getUser } }),
}));

import { supabaseRouteEnvironment } from "@/lib/api/route/routeEnvironment";

describe("supabaseRouteEnvironment.getUser", () => {
  beforeEach(() => getUser.mockReset());

  it("returns the session user", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    expect(await supabaseRouteEnvironment.getUser()).toEqual({ id: "u1" });
  });

  it("returns null when signed out or when Supabase reports an auth error", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    getUser.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: { message: "expired" } });
    expect(await supabaseRouteEnvironment.getUser()).toBeNull();
    expect(await supabaseRouteEnvironment.getUser()).toBeNull();
  });
});
