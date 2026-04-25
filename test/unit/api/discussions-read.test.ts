import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/services/discussionServerService", () => ({
  DiscussionServerService: { markAsRead: vi.fn(async () => {}) },
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: vi.fn() })),
}));

import { PATCH } from "@/app/api/discussions/[conversationId]/read/route";

const params = { params: Promise.resolve({ conversationId: "conv1" }) };

describe("PATCH /api/discussions/[conversationId]/read", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no auth" } });
    const res = await PATCH(new Request("http://localhost"), params);
    expect(res.status).toBe(401);
  });

  test("returns 200 with success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const res = await PATCH(new Request("http://localhost"), params);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });
});
