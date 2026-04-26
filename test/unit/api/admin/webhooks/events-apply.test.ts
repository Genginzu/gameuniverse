import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("@/lib/services/webhookDiffApplier", () => ({
  applyWebhookPayload: vi.fn(async () => ({
    appliedFields: ["name"],
    skippedFields: [],
    error: null,
  })),
}));

const mockSingleEvent = vi.fn();
const mockEqEvent = vi.fn(() => ({ single: mockSingleEvent }));
const mockSelectEvent = vi.fn(() => ({ eq: mockEqEvent }));
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockFrom = vi.fn((table: string) => {
  if (table === "igdb_webhook_events") {
    return { select: mockSelectEvent, update: mockUpdate };
  }
  return { select: vi.fn() };
});
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { POST } from "@/app/api/admin/webhooks/events/[eventId]/apply/route";

describe("POST /api/admin/webhooks/events/[eventId]/apply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const req = new NextRequest("http://localhost/api/admin/webhooks/events/evt1/apply", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req, { params: Promise.resolve({ eventId: "evt1" }) });
    expect(res.status).toBe(403);
  });

  test("returns 404 when event not found", async () => {
    mockSingleEvent.mockResolvedValue({ data: null, error: { message: "not found" } });
    const req = new NextRequest("http://localhost/api/admin/webhooks/events/evt1/apply", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req, { params: Promise.resolve({ eventId: "evt1" }) });
    expect(res.status).toBe(404);
  });

  test("returns 200 with appliedFields", async () => {
    mockSingleEvent.mockResolvedValue({
      data: { id: "evt1", event_type: "update", game_id: "g1", payload: { name: "New" } },
      error: null,
    });
    mockUpdateEq.mockResolvedValue({ error: null });
    const req = new NextRequest("http://localhost/api/admin/webhooks/events/evt1/apply", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req, { params: Promise.resolve({ eventId: "evt1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.appliedFields).toEqual(["name"]);
    expect(json.success).toBe(true);
  });
});
