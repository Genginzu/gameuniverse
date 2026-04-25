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
vi.mock("@/types/webhooks", () => ({ IGDB_ENDPOINTS: ["games", "characters"] }));

import { GET, POST } from "@/app/api/admin/webhooks/registrations/route";

describe("GET /api/admin/webhooks/registrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
    vi.stubGlobal("fetch", vi.fn());
    process.env.IGDB_CLIENT_ID = "test-client";
    process.env.IGDB_WEBHOOK_SECRET = "test-secret";
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
  });

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  test("GET returns 200 with webhooks", async () => {
    const webhooks = [{ id: 1, url: "https://example.com/api/webhooks/igdb" }];
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => webhooks,
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.webhooks).toEqual(webhooks);
  });
});

describe("POST /api/admin/webhooks/registrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
    vi.stubGlobal("fetch", vi.fn());
    process.env.IGDB_CLIENT_ID = "test-client";
    process.env.IGDB_WEBHOOK_SECRET = "test-secret";
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
  });

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const req = new NextRequest("http://localhost/api/admin/webhooks/registrations", {
      method: "POST",
      body: JSON.stringify({ endpoint: "games", method: "update" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  test("POST returns 201 with webhook", async () => {
    const webhook = { id: 42, url: "https://example.com/api/webhooks/igdb" };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => webhook,
    });
    const req = new NextRequest("http://localhost/api/admin/webhooks/registrations", {
      method: "POST",
      body: JSON.stringify({ endpoint: "games", method: "update" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.webhook).toEqual(webhook);
  });
});
