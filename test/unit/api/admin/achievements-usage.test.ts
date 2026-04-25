import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

function chainMock(data: unknown, error: unknown = null, count: number | null = null) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve({ data, error }));
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data, error }));
  chain.then = (resolve: any) => Promise.resolve({ data, error, count }).then(resolve);
  return chain;
}

import { GET } from "@/app/api/admin/achievements/[id]/usage/route";

const params = { params: Promise.resolve({ id: "test-id" }) };

describe("GET /api/admin/achievements/[id]/usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const res = await GET(
      new NextRequest("http://localhost/api/admin/achievements/test-id/usage"),
      params
    );
    expect(res.status).toBe(403);
  });

  test("returns 404 when achievement not found", async () => {
    mockFrom.mockReturnValue(chainMock(null));
    const res = await GET(
      new NextRequest("http://localhost/api/admin/achievements/test-id/usage"),
      params
    );
    expect(res.status).toBe(404);
  });

  test("returns 200 with usageCount", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainMock({ key: "first_game" });
      // player_achievements count
      const chain: any = {};
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      chain.then = (resolve: any) => Promise.resolve({ count: 5, error: null }).then(resolve);
      return chain;
    });

    const res = await GET(
      new NextRequest("http://localhost/api/admin/achievements/test-id/usage"),
      params
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.usageCount).toBe(5);
  });
});
