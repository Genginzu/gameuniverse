import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/services/notificationServerService", () => ({
  NotificationServerService: {
    getUnread: vi.fn(async () => []),
    getAll: vi.fn(async () => ({ notifications: [], total: 0 })),
    getUnreadCount: vi.fn(async () => 0),
    markAsRead: vi.fn(async () => true),
    setReadStatus: vi.fn(async () => true),
    markAllAsRead: vi.fn(async () => true),
  },
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: vi.fn() })),
}));

import { GET } from "@/app/api/notifications/route";
import { GET as GET_COUNT } from "@/app/api/notifications/count/route";
import { PATCH as PATCH_READ } from "@/app/api/notifications/[id]/read/route";
import { PATCH as PATCH_ID } from "@/app/api/notifications/[id]/route";
import { PATCH as PATCH_READ_ALL } from "@/app/api/notifications/read-all/route";
import { NotificationServerService } from "@/lib/services/notificationServerService";

describe("GET /api/notifications", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no auth" } });
    const req = new NextRequest("http://localhost/api/notifications");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  test("returns 200 with notifications when authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const mockNotifications = [{ id: "n1", type: "post_comment" }];
    vi.mocked(NotificationServerService.getUnread).mockResolvedValue(mockNotifications as any);
    const req = new NextRequest("http://localhost/api/notifications");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ notifications: mockNotifications });
  });

  test("center mode: paginated/filtered response includes total", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(NotificationServerService.getAll).mockResolvedValue({
      notifications: [{ id: "n1" }] as any,
      total: 1,
    });
    const req = new NextRequest(
      "http://localhost/api/notifications?page=1&limit=20&status=unread&type=friends"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ notifications: [{ id: "n1" }], total: 1 });
    expect(NotificationServerService.getAll).toHaveBeenCalledWith("u1", {
      page: 1,
      limit: 20,
      types: ["friend_request", "friend_accepted"],
      status: "unread",
    });
  });

  test("center mode: unknown category falls back to all types (null)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(NotificationServerService.getAll).mockResolvedValue({ notifications: [], total: 0 });
    const req = new NextRequest("http://localhost/api/notifications?page=1&type=bogus");
    await GET(req);
    expect(NotificationServerService.getAll).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ types: null, status: "all" })
    );
  });
});

describe("PATCH /api/notifications/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no auth" } });
    const req = new NextRequest("http://localhost/api/notifications/n1", {
      method: "PATCH",
      body: JSON.stringify({ isRead: true }),
    });
    const res = await PATCH_ID(req, { params: Promise.resolve({ id: "n1" }) });
    expect(res.status).toBe(401);
  });

  test("returns 400 when isRead is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const req = new NextRequest("http://localhost/api/notifications/n1", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const res = await PATCH_ID(req, { params: Promise.resolve({ id: "n1" }) });
    expect(res.status).toBe(400);
  });

  test("returns 404 when notification not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(NotificationServerService.setReadStatus).mockResolvedValue(false);
    const req = new NextRequest("http://localhost/api/notifications/n1", {
      method: "PATCH",
      body: JSON.stringify({ isRead: false }),
    });
    const res = await PATCH_ID(req, { params: Promise.resolve({ id: "n1" }) });
    expect(res.status).toBe(404);
  });

  test("returns 200 and forwards isRead when successful", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(NotificationServerService.setReadStatus).mockResolvedValue(true);
    const req = new NextRequest("http://localhost/api/notifications/n1", {
      method: "PATCH",
      body: JSON.stringify({ isRead: false }),
    });
    const res = await PATCH_ID(req, { params: Promise.resolve({ id: "n1" }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(NotificationServerService.setReadStatus).toHaveBeenCalledWith("n1", "u1", false);
  });
});

describe("GET /api/notifications/count", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no auth" } });
    const res = await GET_COUNT();
    expect(res.status).toBe(401);
  });

  test("returns 200 with count when authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(NotificationServerService.getUnreadCount).mockResolvedValue(5);
    const res = await GET_COUNT();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ count: 5 });
  });
});

describe("PATCH /api/notifications/[id]/read", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no auth" } });
    const req = new Request("http://localhost/api/notifications/n1/read", { method: "PATCH" });
    const res = await PATCH_READ(req, { params: Promise.resolve({ id: "n1" }) });
    expect(res.status).toBe(401);
  });

  test("returns 404 when notification not found (markAsRead returns false)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(NotificationServerService.markAsRead).mockResolvedValue(false);
    const req = new Request("http://localhost/api/notifications/n1/read", { method: "PATCH" });
    const res = await PATCH_READ(req, { params: Promise.resolve({ id: "n1" }) });
    expect(res.status).toBe(404);
  });

  test("returns 200 when successful", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(NotificationServerService.markAsRead).mockResolvedValue(true);
    const req = new Request("http://localhost/api/notifications/n1/read", { method: "PATCH" });
    const res = await PATCH_READ(req, { params: Promise.resolve({ id: "n1" }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });
});

describe("PATCH /api/notifications/read-all", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no auth" } });
    const res = await PATCH_READ_ALL();
    expect(res.status).toBe(401);
  });

  test("returns 200 when successful", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const res = await PATCH_READ_ALL();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });
});
