import { describe, test, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

const mockGetActiveSuspension = vi.fn();
vi.mock("@/lib/services/suspensionGuard", () => ({
  getActiveSuspension: (...args: unknown[]) => mockGetActiveSuspension(...args),
}));

import { GET } from "@/app/api/players/me/suspension/route";

beforeEach(() => vi.clearAllMocks());

describe("GET /api/players/me/suspension", () => {
  test("401 for guests", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
    expect(mockGetActiveSuspension).not.toHaveBeenCalled();
  });

  test("not suspended", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockGetActiveSuspension.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ suspended: false, until: null });
  });

  test("suspended with an end date, never cached", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockGetActiveSuspension.mockResolvedValue({ until: "2026-10-25T11:49:00.000Z" });
    const res = await GET();
    expect(await res.json()).toEqual({ suspended: true, until: "2026-10-25T11:49:00.000Z" });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetActiveSuspension).toHaveBeenCalledWith("u1");
  });
});
