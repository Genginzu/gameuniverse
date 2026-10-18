import { describe, it, expect } from "vitest";
import {
  CATEGORY_TYPES,
  NOTIFICATION_CATEGORIES,
  categoryForType,
  categoryIcon,
  getNotificationHref,
  hasContentPreview,
  isSystemNotification,
  TYPE_ICONS,
  TYPE_LABEL_KEYS,
  typesForCategory,
} from "@/lib/notificationDisplay";
import type { NotificationType } from "@/types/notification";

const ALL_TYPES: NotificationType[] = [
  "post_comment",
  "discussion_message",
  "post_created",
  "post_mention",
  "coaching_requested",
  "coaching_confirmed",
  "coaching_declined",
  "coaching_started",
  "coaching_completed",
  "coaching_cancelled",
  "coaching_paid",
  "friend_request",
  "friend_accepted",
  "review_vote",
  "achievement_unlocked",
  "moderation_warning",
];

describe("notificationDisplay", () => {
  it("has an icon and label key for every notification type", () => {
    for (const type of ALL_TYPES) {
      expect(TYPE_ICONS[type]).toBeTruthy();
      expect(TYPE_LABEL_KEYS[type]).toBeTruthy();
    }
  });

  it("partitions every notification type into exactly one category", () => {
    const seen = new Map<NotificationType, number>();
    for (const cat of NOTIFICATION_CATEGORIES) {
      for (const type of CATEGORY_TYPES[cat]) {
        seen.set(type, (seen.get(type) ?? 0) + 1);
      }
    }
    for (const type of ALL_TYPES) {
      expect(seen.get(type)).toBe(1);
    }
    expect(seen.size).toBe(ALL_TYPES.length);
  });

  it("resolves category from type and back", () => {
    expect(categoryForType("friend_request")).toBe("friends");
    expect(categoryForType("review_vote")).toBe("reviews");
    expect(categoryForType("achievement_unlocked")).toBe("achievements");
    expect(categoryForType("coaching_paid")).toBe("coaching");
    expect(categoryForType("post_comment")).toBe("activity");
    expect(categoryForType("moderation_warning")).toBe("moderation");
  });

  it("typesForCategory returns null for 'all' and the type set otherwise", () => {
    expect(typesForCategory("all")).toBeNull();
    expect(typesForCategory("friends")).toEqual(["friend_request", "friend_accepted"]);
  });

  it("provides an icon for each category", () => {
    for (const cat of NOTIFICATION_CATEGORIES) {
      expect(categoryIcon(cat)).toBeTruthy();
    }
  });

  it("builds resource hrefs based on type", () => {
    expect(getNotificationHref("friend_request", "u1")).toBe("/players/me/friends");
    expect(getNotificationHref("friend_accepted", "u1")).toBe("/players/u1");
    expect(getNotificationHref("review_vote", "u1")).toBe("/reviews");
    expect(getNotificationHref("achievement_unlocked", "u1")).toBe("/players/me/achievements");
    expect(getNotificationHref("coaching_paid", "u1")).toBe("/coaching/sessions");
    expect(getNotificationHref("post_mention", "u1")).toBe("/players/u1?tab=posts");
    expect(getNotificationHref("discussion_message", "u1")).toBe("/discussions");
  });

  it("flags system notifications", () => {
    expect(isSystemNotification("achievement_unlocked")).toBe(true);
    expect(isSystemNotification("friend_request")).toBe(false);
  });

  it("hides content preview for coaching and friend events", () => {
    expect(hasContentPreview("coaching_requested")).toBe(false);
    expect(hasContentPreview("friend_request")).toBe(false);
    expect(hasContentPreview("friend_accepted")).toBe(false);
    expect(hasContentPreview("moderation_warning")).toBe(false);
    expect(hasContentPreview("post_comment")).toBe(true);
  });
});
