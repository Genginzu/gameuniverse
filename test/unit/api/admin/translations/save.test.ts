import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const mockRpc = vi.fn(async () => ({ error: null }));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom, rpc: mockRpc })),
}));

vi.mock("@/lib/services/translationService", () => ({
  upsertTranslation: vi.fn(async () => {}),
}));

vi.mock("@/lib/validations/admin-translation", () => ({
  saveTranslationBodySchema: {
    safeParse: vi.fn(() => ({
      success: true,
      data: {
        entityType: "games",
        entityId: "e1",
        targetLang: "en",
        translations: { title: "Test" },
      },
    })),
  },
}));

vi.mock("@/types/admin-translations", () => ({
  ENTITY_TABLE_MAP: { games: "games", characters: "characters" },
}));

import { PUT } from "../../../../../src/app/api/admin/translations/save/route";

describe("PUT /api/admin/translations/save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
    mockSingle.mockResolvedValue({ data: { id: "e1" }, error: null });
  });

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const req = new NextRequest("http://localhost/api/admin/translations/save", {
      method: "PUT",
      body: "{}",
    });
    const res = await PUT(req);
    expect(res.status).toBe(403);
  });

  test("returns 200 with success:true", async () => {
    const req = new NextRequest("http://localhost/api/admin/translations/save", {
      method: "PUT",
      body: "{}",
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  test("returns 404 when entity not found", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "not found" } });
    const req = new NextRequest("http://localhost/api/admin/translations/save", {
      method: "PUT",
      body: "{}",
    });
    const res = await PUT(req);
    expect(res.status).toBe(404);
  });
});
