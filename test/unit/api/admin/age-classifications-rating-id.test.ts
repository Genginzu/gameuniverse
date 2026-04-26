import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("@/lib/validations/admin-rating-form", () => ({
  adminRatingFormSchema: { safeParse: (d: any) => ({ success: true, data: d }) },
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

function chainMock(data: unknown, error: unknown = null, count: number | null = null) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.neq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve({ data, error }));
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data, error }));
  chain.then = (resolve: any) => Promise.resolve({ data, error, count }).then(resolve);
  return chain;
}

import { GET, DELETE } from "@/app/api/admin/age-classifications/[id]/ratings/[ratingId]/route";

const params = { params: Promise.resolve({ id: "sys1", ratingId: "r1" }) };
const url = "http://localhost/api/admin/age-classifications/sys1/ratings/r1";

describe("GET /api/admin/age-classifications/[id]/ratings/[ratingId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const res = await GET(new NextRequest(url), params);
    expect(res.status).toBe(403);
  });

  test("returns 200 with rating", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1)
        return chainMock({
          id: "r1",
          rating_system_id: "sys1",
          code: "3",
          display_name: "PEGI 3",
          minimum_age: 3,
          color_hex: null,
          icon_url: null,
          sort_order: 0,
          rating_translations: [],
        });
      return chainMock(null, null, 1); // game count
    });
    const res = await GET(new NextRequest(url), params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.rating.id).toBe("r1");
  });
});

describe("DELETE /api/admin/age-classifications/[id]/ratings/[ratingId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 409 when in use", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainMock({ id: "r1" }); // exists
      return chainMock(null, null, 5); // usage count
    });
    const req = new NextRequest(url, { method: "DELETE" });
    const res = await DELETE(req, params);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.type).toBe("IN_USE");
  });
});
