import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/services/igdbWebhookService", () => ({
  processWebhookEvent: vi.fn(async () => ({ eventId: "evt1", status: "received" })),
}));
vi.mock("@/types/webhooks", () => ({ IGDB_ENDPOINTS: ["games", "characters"] }));

import { POST } from "@/app/api/webhooks/igdb/route";

const makeReq = (secret: string, query: string, body: object) =>
  new NextRequest(`http://localhost/api/webhooks/igdb${query}`, {
    method: "POST",
    headers: { "x-secret": secret },
    body: JSON.stringify(body),
  });

describe("POST /api/webhooks/igdb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.IGDB_WEBHOOK_SECRET = "test-secret";
  });

  test("returns 401 when wrong secret", async () => {
    const res = await POST(makeReq("wrong", "?entity=games&method=update", { id: 1 }));
    expect(res.status).toBe(401);
  });

  test("returns 400 when invalid entity", async () => {
    const res = await POST(makeReq("test-secret", "?entity=invalid&method=update", { id: 1 }));
    expect(res.status).toBe(400);
  });

  test("returns 200 with ok:true", async () => {
    const res = await POST(makeReq("test-secret", "?entity=games&method=update", { id: 123 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.eventId).toBe("evt1");
  });
});
