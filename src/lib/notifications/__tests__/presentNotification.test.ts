import { describe, it, expect } from "vitest";
import { presentNotification } from "@/lib/notifications/presentNotification";
import type { Notification } from "@/types/notification";

const NOW = new Date("2026-05-01T12:00:00.000Z");
const translate = (key: string) => `t:${key}`;

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    recipientId: "recipient-1",
    senderId: "sender-1",
    type: "post_comment",
    referenceId: "post-1",
    contentPreview: "Nice post",
    isRead: false,
    createdAt: "2026-05-01T11:00:00.000Z",
    sender: { username: "Alice", avatarUrl: null },
    ...overrides,
  };
}

function present(overrides: Partial<Notification> = {}) {
  return presentNotification(makeNotification(overrides), { now: NOW, translate });
}

describe("presentNotification", () => {
  it("returns ready-to-render fields for a user notification", () => {
    expect(present()).toEqual({
      icon: "mdi:comment-outline",
      label: "t:typePostComment",
      href: "/players/recipient-1?tab=activity",
      preview: "Nice post",
      senderName: "Alice",
      date: new Date("2026-05-01T11:00:00.000Z"),
    });
  });

  it("clamps future dates to now", () => {
    expect(present({ createdAt: "2026-06-01T00:00:00.000Z" }).date).toEqual(NOW);
  });

  it("falls back to a placeholder when the sender profile is missing", () => {
    expect(present({ sender: undefined }).senderName).toBe("?");
  });

  it("hides the sender and the raw achievement key for system notifications", () => {
    const view = present({ type: "achievement_unlocked", contentPreview: "library_5" });
    expect(view.senderName).toBeNull();
    expect(view.preview).toBeNull();
    expect(view.label).toBe("t:typeAchievementUnlocked");
  });

  it("translates review vote types instead of showing the raw value", () => {
    expect(present({ type: "review_vote", contentPreview: "helpful" }).preview).toBe(
      "t:reviewVoteHelpful"
    );
    expect(present({ type: "review_vote", contentPreview: "not_helpful" }).preview).toBe(
      "t:reviewVoteNotHelpful"
    );
    expect(present({ type: "review_vote", contentPreview: "up" }).preview).toBeNull();
  });

  it("translates the warned content type of a moderation warning", () => {
    const view = present({ type: "moderation_warning", contentPreview: "post" });
    expect(view.preview).toBe("t:moderationContentPost");
    expect(view.href).toBe("/players/recipient-1?tab=activity");
    expect(present({ type: "moderation_warning", contentPreview: "" }).preview).toBeNull();
  });

  it("hides previews for kinds without meaningful content", () => {
    expect(present({ type: "friend_request", contentPreview: "x" }).preview).toBeNull();
    expect(present({ type: "coaching_paid", contentPreview: "coaching_paid" }).preview).toBeNull();
  });

  it("returns no preview when the text preview is empty", () => {
    expect(present({ contentPreview: "" }).preview).toBeNull();
  });
});
