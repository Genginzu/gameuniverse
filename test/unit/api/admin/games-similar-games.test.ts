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

function chainMock(data: unknown, error: unknown = null) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve({ data, error }));
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.then = (resolve: any) => Promise.resolve({ data, error }).then(resolve);
  return chain;
}

import { GET, POST, DELETE } from "@/app/api/admin/games/[id]/similar-games/route";

const params = { params: Promise.resolve({ id: "test-id" }) };

describe("GET /api/admin/games/[id]/similar-games", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 200 with similar games array", async () => {
    const rows = [{ id: "s1", similar_igdb_id: 10, similar_game_id: null, display_order: 0 }];
    mockFrom.mockReturnValue(chainMock(rows));

    const res = await GET(
      new NextRequest("http://localhost/api/admin/games/test-id/similar-games"),
      params
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
  });
});

describe("POST /api/admin/games/[id]/similar-games", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 201 when adding similar game", async () => {
    const targetGame = { id: "other-id", igdb_id: 99 };
    const existing: any[] = [];
    const inserted = { id: "new-entry" };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainMock(targetGame); // games lookup
      if (callCount === 2) return chainMock(existing); // existing order
      return chainMock(inserted); // insert
    });

    const req = new NextRequest("http://localhost/api/admin/games/test-id/similar-games", {
      method: "POST",
      body: JSON.stringify({ gameSlug: "other-game" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, params);
    expect(res.status).toBe(201);
  });
});

describe("DELETE /api/admin/games/[id]/similar-games", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 200 on successful delete", async () => {
    mockFrom.mockReturnValue(chainMock(null, null));

    const req = new NextRequest(
      "http://localhost/api/admin/games/test-id/similar-games?entryId=e1",
      { method: "DELETE" }
    );
    const res = await DELETE(req, params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
