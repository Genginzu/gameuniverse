import { describe, test, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { NextRequest } from "next/server";

// --- Mocks ---

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/services/notificationServerService", () => ({
  NotificationServerService: {
    getUnread: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

// --- Imports (after mocks) ---

import { GET } from "@/app/api/notifications/route";
import { GET as GET_COUNT } from "@/app/api/notifications/count/route";
import { PATCH as PATCH_READ } from "@/app/api/notifications/[id]/read/route";
import { PATCH as PATCH_READ_ALL } from "@/app/api/notifications/read-all/route";
import { NotificationServerService } from "@/lib/services/notificationServerService";

// --- Helpers ---

const AUTHENTICATED_USER = { id: "user-123" };

function authenticateUser() {
  mockGetUser.mockResolvedValue({
    data: { user: AUTHENTICATED_USER },
    error: null,
  });
}

/** Generate a notification object with a specific date */
function makeNotification(overrides: Partial<{ id: string; createdAt: string }> = {}) {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    recipientId: AUTHENTICATED_USER.id,
    senderId: crypto.randomUUID(),
    type: "post_comment" as const,
    referenceId: crypto.randomUUID(),
    contentPreview: "Some preview",
    isRead: false,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  };
}

// --- Property 6: Notifications triées par date décroissante avec limite ---
// **Validates: Requirements 4.1, 6.1**

describe("Feature: notifications-system, Property 6: Notifications triées par date décroissante avec limite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticateUser();
  });

  test("GET /api/notifications returns at most `limit` notifications sorted by createdAt DESC", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate N notifications (1-50) with random dates
        fc.array(fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }), {
          minLength: 1,
          maxLength: 50,
        }),
        // Generate a limit (1-50)
        fc.integer({ min: 1, max: 50 }),
        async (dates, limit) => {
          // Build notifications sorted by date DESC (as the service would return)
          const allNotifications = dates
            .map((d) => makeNotification({ createdAt: d.toISOString() }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          const limited = allNotifications.slice(0, limit);

          vi.mocked(NotificationServerService.getUnread).mockResolvedValue(limited);

          const req = new NextRequest(`http://localhost/api/notifications?limit=${limit}`);
          const res = await GET(req);
          const body = await res.json();

          // At most `limit` notifications
          expect(body.notifications.length).toBeLessThanOrEqual(limit);

          // Sorted by createdAt DESC
          for (let i = 1; i < body.notifications.length; i++) {
            const prev = new Date(body.notifications[i - 1].createdAt).getTime();
            const curr = new Date(body.notifications[i].createdAt).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- Property 7: Compteur de notifications non lues ---
// **Validates: Requirements 4.2**

describe("Feature: notifications-system, Property 7: Compteur de notifications non lues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticateUser();
  });

  test("GET /api/notifications/count returns the exact unread count", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 1000 }), async (count) => {
        vi.mocked(NotificationServerService.getUnreadCount).mockResolvedValue(count);

        const req = new NextRequest("http://localhost/api/notifications/count");
        const res = await GET_COUNT();
        const body = await res.json();

        expect(body.count).toBe(count);
      }),
      { numRuns: 100 }
    );
  });
});

// --- Property 8: Transition d'état — marquer comme lue ---
// **Validates: Requirements 4.3**

describe("Feature: notifications-system, Property 8: Transition d'état — marquer comme lue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticateUser();
  });

  test("PATCH /api/notifications/[id]/read returns success:true when markAsRead succeeds", async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (notificationId) => {
        vi.mocked(NotificationServerService.markAsRead).mockResolvedValue(true);

        const req = new Request(`http://localhost/api/notifications/${notificationId}/read`, {
          method: "PATCH",
        });
        const res = await PATCH_READ(req, {
          params: Promise.resolve({ id: notificationId }),
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({ success: true });
        expect(NotificationServerService.markAsRead).toHaveBeenCalledWith(
          notificationId,
          AUTHENTICATED_USER.id
        );
      }),
      { numRuns: 100 }
    );
  });

  test("PATCH /api/notifications/[id]/read returns 404 when markAsRead returns false", async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (notificationId) => {
        vi.mocked(NotificationServerService.markAsRead).mockResolvedValue(false);

        const req = new Request(`http://localhost/api/notifications/${notificationId}/read`, {
          method: "PATCH",
        });
        const res = await PATCH_READ(req, {
          params: Promise.resolve({ id: notificationId }),
        });
        const body = await res.json();

        expect(res.status).toBe(404);
        expect(body.error).toBe("Notification not found");
      }),
      { numRuns: 100 }
    );
  });
});

// --- Property 9: Transition d'état — marquer toutes comme lues ---
// **Validates: Requirements 4.4**

describe("Feature: notifications-system, Property 9: Transition d'état — marquer toutes comme lues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticateUser();
  });

  test("PATCH /api/notifications/read-all returns success:true", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Use an arbitrary to drive multiple runs even though input is constant
        fc.boolean(),
        async () => {
          vi.mocked(NotificationServerService.markAllAsRead).mockResolvedValue(true);

          const res = await PATCH_READ_ALL();
          const body = await res.json();

          expect(res.status).toBe(200);
          expect(body).toEqual({ success: true });
          expect(NotificationServerService.markAllAsRead).toHaveBeenCalledWith(
            AUTHENTICATED_USER.id
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
