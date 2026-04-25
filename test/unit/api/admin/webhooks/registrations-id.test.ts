import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("@/lib/services/igdbService", () => ({
  IGDBService: { getAccessToken: vi.fn(async () => "mock-token"), clearTokenCache: vi.fn() },
}));

import { DELETE } from "@/app/api/admin/webhooks/registrations/[id]/route";

describe("DELETE /api/admin/webhooks/registrations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
    vi.stubGlobal("fetch", vi.fn());
    process.env.IGDB_CLIENT_ID = "test-client";
  });

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const req = new NextRequest("http://localhost/api/admin/webhooks/registrations/42", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "42" }) });
    expect(res.status).toBe(403);
  });

  test("returns 200 with ok:true on success", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    const req = new NextRequest("http://localhost/api/admin/webhooks/registrations/42", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "42" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.igdb.com/v4/webhooks/42",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  test("returns 502 when IGDB API fails", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "error",
    });
    const req = new NextRequest("http://localhost/api/admin/webhooks/registrations/42", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "42" }) });
    expect(res.status).toBe(502);
  });
});
