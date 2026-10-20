import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const db = vi.hoisted(() => ({ mock: null as ReturnType<typeof createSupabaseQueryMock> | null }));

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => db.mock!.client }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import {
  deliverNotification,
  deliverNotifications,
  guardedDelivery,
  PREVIEW_MAX_LENGTH,
} from "@/lib/services/notifications/deliverNotification";
import { logger } from "@/lib/logger";

const ROW = {
  id: "n1",
  recipient_id: "recipient-1",
  sender_id: "sender-1",
  type: "post_comment",
  reference_id: "post-1",
  content_preview: "hi",
  is_read: false,
  created_at: "2026-05-01T00:00:00.000Z",
};

beforeEach(() => {
  db.mock = createSupabaseQueryMock();
  vi.clearAllMocks();
});

describe("deliverNotification", () => {
  it("inserts one row and truncates the preview", async () => {
    db.mock!.enqueue("notifications", { data: ROW });
    const result = await deliverNotification({
      recipientId: "recipient-1",
      senderId: "sender-1",
      type: "post_comment",
      referenceId: "post-1",
      preview: "x".repeat(PREVIEW_MAX_LENGTH + 20),
    });

    expect(result).toEqual({ delivered: 1 });
    expect(db.mock!.callsFor("notifications", "insert")).toEqual([
      [
        {
          recipient_id: "recipient-1",
          sender_id: "sender-1",
          type: "post_comment",
          reference_id: "post-1",
          content_preview: "x".repeat(PREVIEW_MAX_LENGTH),
        },
      ],
    ]);
  });

  it("skips self-notifications for user kinds", async () => {
    const result = await deliverNotification({
      recipientId: "u1",
      senderId: "u1",
      type: "friend_request",
      referenceId: "f1",
    });
    expect(result).toEqual({ delivered: 0 });
    expect(db.mock!.calls).toHaveLength(0);
  });

  it("allows system notifications addressed to the sender", async () => {
    db.mock!.enqueue("notifications", { data: ROW });
    const result = await deliverNotification({
      recipientId: "u1",
      senderId: "anyone",
      type: "achievement_unlocked",
      referenceId: "u1",
      system: true,
    });
    expect(result).toEqual({ delivered: 1 });
    expect(db.mock!.callsFor("notifications", "insert")[0][0]).toMatchObject({
      recipient_id: "u1",
      sender_id: "u1",
      content_preview: "",
    });
  });

  it("counts only successful inserts and logs failures without throwing", async () => {
    db.mock!.enqueue("notifications", { data: ROW }, { error: { message: "boom" } });
    const result = await deliverNotifications([
      { recipientId: "a", senderId: "s", type: "post_created", referenceId: "p" },
      { recipientId: "b", senderId: "s", type: "post_created", referenceId: "p" },
    ]);
    expect(result).toEqual({ delivered: 1 });
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to create notification",
      expect.objectContaining({ error: "boom", recipientId: "b" })
    );
  });
});

describe("guardedDelivery", () => {
  it("turns thrown errors into an empty delivery", async () => {
    const result = await guardedDelivery("intent", { id: "1" }, async () => {
      throw new Error("lookup failed");
    });
    expect(result).toEqual({ delivered: 0 });
    expect(logger.error).toHaveBeenCalledWith(
      "Notification intent failed",
      expect.objectContaining({ intent: "intent", error: "lookup failed", id: "1" })
    );
  });
});
