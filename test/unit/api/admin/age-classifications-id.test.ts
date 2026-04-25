import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("@/lib/validations/admin-rating-system-form", () => ({
  adminRatingSystemFormSchema: { safeParse: (d: any) => ({ success: true, data: d }) },
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

function chainMock(data: unknown, error: unknown = null, count: number | null = null) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.neq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve({ data, error }));
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data, error }));
  chain.then = (resolve: any) => Promise.resolve({ data, error, count }).then(resolve);
  return chain;
}

import { GET, PUT, DELETE } from "@/app/api/admin/age-classifications/[id]/route";

const params = { params: Promise.resolve({ id: "test-id" }) };
const url = "http://localhost/api/admin/age-classifications/test-id";

describe("GET /api/admin/age-classifications/[id]", () => {
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

  test("returns 200 with rating system", async () => {
    const system = {
      id: "test-id",
      code: "PEGI",
      name: "PEGI",
      description: null,
      country_codes: [],
      website_url: null,
    };
    mockFrom.mockReturnValue(chainMock(system));
    const res = await GET(new NextRequest(url), params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ratingSystem.code).toBe("PEGI");
  });
});

describe("PUT /api/admin/age-classifications/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 200 on update", async () => {
    const updated = {
      id: "test-id",
      code: "PEGI",
      name: "PEGI Updated",
      description: null,
      country_codes: [],
      website_url: null,
    };
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainMock({ id: "test-id" }); // exists check
      if (callCount === 2) return chainMock(null); // duplicate check (none)
      if (callCount === 3) return chainMock(updated); // update
      return chainMock(null, null, 0); // ratings/descriptors count
    });
    const req = new NextRequest(url, {
      method: "PUT",
      body: JSON.stringify({ code: "PEGI", name: "PEGI Updated" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(req, params);
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/admin/age-classifications/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 409 when in use", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainMock({ id: "test-id" }); // exists check
      return chainMock(null, null, 3); // ratings/descriptors count
    });
    const req = new NextRequest(url, { method: "DELETE" });
    const res = await DELETE(req, params);
    expect(res.status).toBe(409);
  });
});
