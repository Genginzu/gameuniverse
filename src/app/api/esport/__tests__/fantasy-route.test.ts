import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
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
      mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
      const res = await post({ action, teamId: "t1", proPlayerId: 1, proPlayerName: "Faker", price: 1 });
      expect(res.status).toBe(501);
    }
  );

  it("rejects createTeam without a name", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await post({ action: "createTeam", leagueId: "l1" });
    expect(res.status).toBe(400);
  });
});
