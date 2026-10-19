import { describe, it, expect, vi, beforeEach } from "vitest";

const mockResolve = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => ({}) }));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () => Promise.resolve({ auth: { getUser: mockGetUser } }),
}));
vi.mock("@/lib/services/affiliateRedirectService", () => ({
  resolveAffiliateRedirect: (...args: unknown[]) => mockResolve(...args),
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { GET } = await import("@/app/api/go/route");
const { NextRequest } = await import("next/server");

const PRICE_ID = "11111111-2222-3333-4444-555555555555";

function request(query: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/go${query}`, { headers });
}

beforeEach(() => {
  mockResolve.mockReset();
  mockGetUser.mockReset();
  mockGetUser.mockResolvedValue({ data: { user: { id: "player-1" } } });
});

describe("GET /api/go", () => {
  it("302-redirects to the resolved url with no-store headers", async () => {
    mockResolve.mockResolvedValue({ ok: true, url: "https://www.amazon.fr/dp/X?tag=gu-21" });
    const res = await GET(
      request(`?price=${PRICE_ID}`, { referer: "https://gameuniverse.gg/fr/games/x" })
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://www.amazon.fr/dp/X?tag=gu-21");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-robots-tag")).toContain("noindex");
    expect(mockResolve).toHaveBeenCalledWith(expect.anything(), PRICE_ID, {
      playerId: "player-1",
      referrer: "https://gameuniverse.gg/fr/games/x",
    });
  });

  it("logs anonymous clicks with a null player id", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockResolve.mockResolvedValue({ ok: true, url: "https://www.amazon.fr/dp/X" });
    await GET(request(`?price=${PRICE_ID}`));
    expect(mockResolve.mock.calls[0][2]).toEqual({ playerId: null, referrer: null });
  });

  it("never redirects when the target is refused (open-redirect guard)", async () => {
    mockResolve.mockResolvedValue({ ok: false, status: 403, reason: "target_not_allowed" });
    const res = await GET(request(`?price=${PRICE_ID}&url=https://evil.com`));
    expect(res.status).toBe(403);
    expect(res.headers.get("location")).toBeNull();
    expect(await res.json()).toEqual({ error: "target_not_allowed" });
  });

  it("ignores any url query param and only forwards the price id", async () => {
    mockResolve.mockResolvedValue({ ok: false, status: 400, reason: "invalid_price" });
    const res = await GET(request("?url=https://evil.com"));
    expect(res.status).toBe(400);
    expect(mockResolve.mock.calls[0][1]).toBeNull();
  });

  it("returns 404 for unknown prices", async () => {
    mockResolve.mockResolvedValue({ ok: false, status: 404, reason: "price_not_found" });
    const res = await GET(request(`?price=${PRICE_ID}`));
    expect(res.status).toBe(404);
  });

  it("returns 500 when resolution throws", async () => {
    mockResolve.mockRejectedValue(new Error("db down"));
    const res = await GET(request(`?price=${PRICE_ID}`));
    expect(res.status).toBe(500);
    expect(res.headers.get("location")).toBeNull();
  });
});
