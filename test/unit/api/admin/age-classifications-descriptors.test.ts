import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("@/lib/validations/admin-descriptor-form", () => ({
  adminDescriptorFormSchema: { safeParse: (d: any) => ({ success: true, data: d }) },
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

function chainMock(data: unknown, error: unknown = null) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve({ data, error }));
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data, error }));
  chain.then = (resolve: any) => Promise.resolve({ data, error }).then(resolve);
  return chain;
}

import { GET, POST } from "@/app/api/admin/age-classifications/[id]/descriptors/route";

const params = { params: Promise.resolve({ id: "sys1" }) };
const url = "http://localhost/api/admin/age-classifications/sys1/descriptors";

describe("GET /api/admin/age-classifications/[id]/descriptors", () => {
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

  test("returns 200 with descriptors", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainMock({ id: "sys1" }); // system exists
      if (callCount === 2)
        return chainMock([
          {
            id: "d1",
            rating_system_id: "sys1",
            code: "VIOLENCE",
            icon_url: null,
            content_descriptor_translations: [],
          },
        ]);
      return chainMock([]); // game_rating_descriptors
    });
    const res = await GET(new NextRequest(url), params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.descriptors).toBeDefined();
  });
});

describe("POST /api/admin/age-classifications/[id]/descriptors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 201 on create", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainMock({ id: "sys1" }); // system exists
      if (callCount === 2) return chainMock(null); // no duplicate
      if (callCount === 3)
        return chainMock({ id: "d-new", rating_system_id: "sys1", code: "FEAR", icon_url: null });
      return chainMock(null); // translations insert
    });
    const body = {
      code: "FEAR",
      icon_url: null,
      translations: [{ language_code: "fr", name: "Peur", description: "" }],
    };
    const req = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, params);
    expect(res.status).toBe(201);
  });
});
