import { describe, test, expect, beforeEach, vi } from "vitest";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockFrom = vi.fn();
const mockRpc = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom, rpc: mockRpc })),
}));

import { POST } from "../../../../../src/app/api/admin/translations/refresh-stats/route";

describe("POST /api/admin/translations/refresh-stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const res = await POST();
    expect(res.status).toBe(403);
  });

  test("returns 200 with success:true", async () => {
    mockRpc.mockResolvedValue({ error: null });
    const res = await POST();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  test("returns 500 on rpc error", async () => {
    mockRpc.mockResolvedValue({ error: { message: "fail" } });
    const res = await POST();
    expect(res.status).toBe(500);
  });
});
