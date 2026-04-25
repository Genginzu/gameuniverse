import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockIs = vi.fn();
const mockEq = vi.fn(() => ({ is: mockIs }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ update: mockUpdate }));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { POST } from "@/app/api/admin/webhooks/events/link/route";

describe("POST /api/admin/webhooks/events/link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 500 when not admin (route has generic catch)", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const req = new NextRequest("http://localhost/api/admin/webhooks/events/link", {
      method: "POST",
      body: JSON.stringify({ igdbId: 1, gameId: "g1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  test("returns 400 when missing params", async () => {
    const req = new NextRequest("http://localhost/api/admin/webhooks/events/link", {
      method: "POST",
      body: JSON.stringify({ igdbId: 1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test("returns 200 with success", async () => {
    mockIs.mockResolvedValue({ error: null });
    const req = new NextRequest("http://localhost/api/admin/webhooks/events/link", {
      method: "POST",
      body: JSON.stringify({ igdbId: 123, gameId: "game-uuid" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("igdb_webhook_events");
    expect(mockUpdate).toHaveBeenCalledWith({ game_id: "game-uuid" });
    expect(mockEq).toHaveBeenCalledWith("igdb_id", 123);
  });
});
