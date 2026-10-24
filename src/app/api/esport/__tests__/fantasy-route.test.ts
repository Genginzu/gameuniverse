import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { useTestRouteEnvironment } from "@/test-helpers/route-environment";

const routeEnv = useTestRouteEnvironment({ signedInAs: "user" });

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/services/fantasyService", () => ({
  createTeam: vi.fn(),
  getMyTeam: vi.fn(),
  getLeaderboard: vi.fn(),
}));

import { POST } from "@/app/api/esport/fantasy/route";

const post = (body: Record<string, unknown>) =>
  POST(new NextRequest("http://localhost/api/esport/fantasy", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/esport/fantasy", () => {
  it.each(["addPlayer", "removePlayer"])(
    "refuses %s with a client-supplied price until a pricing model exists",
    async (action) => {
      const res = await post({ action, teamId: "t1", proPlayerId: 1, proPlayerName: "Faker", price: 1 });
      expect(res.status).toBe(501);
    }
  );

  it("rejects createTeam without a name", async () => {
    const res = await post({ action: "createTeam", leagueId: "l1" });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: "leagueId and name are required",
      code: "validation",
    });
  });

  it("returns 401 when signed out", async () => {
    routeEnv.signOut();
    const res = await post({ action: "createTeam", leagueId: "l1", name: "Team" });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  it("refuses a suspended account, whose team name would be public", async () => {
    routeEnv.suspend();
    const res = await post({ action: "createTeam", leagueId: "l1", name: "Team" });
    expect(await res.json()).toMatchObject({ code: "suspended" });
  });

  it("answers 429 over the fantasyTeam limit", async () => {
    routeEnv.exceedRateLimit(30);
    const res = await post({ action: "createTeam", leagueId: "l1", name: "Team" });
    expect(res.status).toBe(429);
    expect(routeEnv.rateLimitHits).toEqual(["fantasyTeam:user:user-1"]);
  });
});
