import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

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

vi.mock("@/i18n/routing", () => ({ routing: { locales: ["fr", "en"] } }));

const mockGetDetail = vi.fn(async () => ({ entityId: "e1", translations: {} }));
vi.mock("@/lib/services/translationService", () => ({
  getEntityTranslationDetail: (...args: unknown[]) => mockGetDetail(...args),
}));

import { GET } from "../../../../../src/app/api/admin/translations/entity-detail/route";

describe("GET /api/admin/translations/entity-detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
    mockGetDetail.mockResolvedValue({ entityId: "e1", translations: {} });
  });

  const validId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const req = new NextRequest(
      `http://localhost/api/admin/translations/entity-detail?type=games&entityId=${validId}`
    );
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  test("returns 400 with invalid params", async () => {
    const req = new NextRequest(
      "http://localhost/api/admin/translations/entity-detail?type=invalid&entityId=not-uuid"
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  test("returns 200 with detail", async () => {
    const req = new NextRequest(
      `http://localhost/api/admin/translations/entity-detail?type=games&entityId=${validId}`
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.detail.entityId).toBe("e1");
  });

  test("returns 404 when entity not found", async () => {
    mockGetDetail.mockResolvedValue(null);
    const req = new NextRequest(
      `http://localhost/api/admin/translations/entity-detail?type=games&entityId=${validId}`
    );
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});
