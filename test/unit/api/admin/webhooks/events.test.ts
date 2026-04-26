import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockRange = vi.fn();
const mockOrder = vi.fn(() => ({ range: mockRange }));
const mockSelect = vi.fn(() => ({ order: mockOrder }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { GET } from "@/app/api/admin/webhooks/events/route";

describe("GET /api/admin/webhooks/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const req = new NextRequest("http://localhost/api/admin/webhooks/events");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  test("returns 200 with events and pagination", async () => {
    const events = [
      {
        id: "e1",
        igdb_id: 1,
        entity_type: "games",
        game_id: null,
        character_id: null,
        payload: {},
      },
    ];
    mockRange.mockResolvedValue({ data: events, count: 1, error: null });
    const req = new NextRequest("http://localhost/api/admin/webhooks/events?page=1&limit=10");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.events).toBeDefined();
    expect(json.pagination).toMatchObject({ page: 1, limit: 10, total: 1, totalPages: 1 });
  });

  test("applies filters via query chain", async () => {
    const mockEq = vi.fn().mockReturnThis();
    const mockIs = vi.fn().mockReturnThis();
    mockRange.mockResolvedValue({ data: [], count: 0, error: null });
    // Chain: select -> order -> range, then filters add eq/is
    // The route applies filters on the query object returned by range
    // We need the chain to support .eq and .is
    const chainObj = { eq: mockEq, is: mockIs, range: mockRange, order: mockOrder };
    mockSelect.mockReturnValue({ order: vi.fn(() => ({ range: vi.fn(() => chainObj) })) });
    // Re-mock to support chaining with filters
    mockEq.mockReturnValue(chainObj);
    mockIs.mockReturnValue(chainObj);
    mockRange.mockResolvedValue({ data: [], count: 0, error: null });

    const req = new NextRequest(
      "http://localhost/api/admin/webhooks/events?entityType=games&status=received"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
