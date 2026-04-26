import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockRange = vi.fn();
const mockOrder = vi.fn(() => ({ range: mockRange }));
const mockIs = vi.fn(() => ({ order: mockOrder }));
const mockEq = vi.fn(() => ({ is: mockIs }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { GET } from "@/app/api/admin/webhooks/events/not-imported-ids/route";

describe("GET /api/admin/webhooks/events/not-imported-ids", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 500 when not admin (route has generic catch)", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const req = new NextRequest("http://localhost/api/admin/webhooks/events/not-imported-ids");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  test("returns 200 with igdbIds array", async () => {
    mockRange.mockResolvedValue({
      data: [{ igdb_id: 10 }, { igdb_id: 20 }, { igdb_id: 10 }],
      error: null,
    });
    const req = new NextRequest(
      "http://localhost/api/admin/webhooks/events/not-imported-ids?limit=5"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.igdbIds).toEqual([10, 20]);
    expect(json.total).toBe(2);
  });

  test("returns empty array when no data", async () => {
    mockRange.mockResolvedValue({ data: [], error: null });
    const req = new NextRequest("http://localhost/api/admin/webhooks/events/not-imported-ids");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.igdbIds).toEqual([]);
  });
});
