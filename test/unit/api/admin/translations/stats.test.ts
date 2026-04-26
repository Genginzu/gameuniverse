import { describe, test, expect, beforeEach, vi } from "vitest";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const mockRpc = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom, rpc: mockRpc })),
}));

import { GET } from "../../../../../src/app/api/admin/translations/stats/route";

describe("GET /api/admin/translations/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  test("returns 200 with stats array", async () => {
    mockSelect.mockResolvedValue({
      data: [
        {
          entity_type: "games",
          language_code: "en",
          total: 10,
          complete: 5,
          partial: 3,
          missing: 2,
          percentage: 50,
        },
      ],
      error: null,
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.stats).toHaveLength(1);
    expect(json.stats[0].entityType).toBe("games");
  });

  test("returns 500 on supabase error", async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: "fail" } });
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
