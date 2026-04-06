import { describe, test, expect, beforeEach, vi } from "vitest";

let mockGetUser: ReturnType<typeof vi.fn>;
const mockGetUnreadCount = vi.fn();

vi.mock("../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      auth: {
        getUser: () => {
          if (mockGetUser) return mockGetUser();
          return Promise.resolve({ data: { user: null }, error: null });
        },
      },
    }),
}));

vi.mock("../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../../src/lib/services/discussionServerService", () => ({
  DiscussionServerService: {
    getUnreadCount: (...args: unknown[]) => mockGetUnreadCount(...args),
  },
}));

const { GET } = await import(
  "../../../src/app/api/discussions/unread-count/route"
);

describe("GET /api/discussions/unread-count", () => {
  beforeEach(() => {
    mockGetUser = vi.fn(() => Promise.resolve({ data: { user: null }, error: null }));
    vi.clearAllMocks();
  });

  test("returns 401 when not authenticated", async () => {
    mockGetUser = vi.fn(() =>
      Promise.resolve({ data: { user: null }, error: { message: "no" } })
    );
    const res = await GET();
    expect(res.status).toBe(401);
  });

  test("returns count from DiscussionServerService.getUnreadCount", async () => {
    mockGetUser = vi.fn(() =>
      Promise.resolve({ data: { user: { id: "u1" } }, error: null })
    );
    mockGetUnreadCount.mockResolvedValue(7);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(7);
    expect(mockGetUnreadCount).toHaveBeenCalledWith("u1");
  });

  test("returns 500 on error", async () => {
    mockGetUser = vi.fn(() =>
      Promise.resolve({ data: { user: { id: "u1" } }, error: null })
    );
    mockGetUnreadCount.mockRejectedValue(new Error("DB down"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
