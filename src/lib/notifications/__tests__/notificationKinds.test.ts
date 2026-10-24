import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_KINDS,
  NOTIFICATION_TYPES,
  categoryIcon,
  notificationKind,
  typesForCategory,
} from "@/lib/notifications/notificationKinds";
import type { NotificationHrefContext, NotificationType } from "@/types/notification";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

function typesAllowedByLatestMigration(): string[] {
  const latest = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => readFileSync(join(MIGRATIONS_DIR, file), "utf8"))
    .filter((sql) => sql.includes("ADD CONSTRAINT notifications_type_check"))
    .pop();
  const constraint = latest?.split("ADD CONSTRAINT notifications_type_check")[1] ?? "";
  const checkList = constraint.slice(0, constraint.indexOf(");"));
  return (checkList.match(/'[a-z_]+'/g) ?? []).map((quoted) => quoted.slice(1, -1));
}

const CONTEXT: NotificationHrefContext = {
  referenceId: "ref-1",
  senderId: "sender-1",
  recipientId: "recipient-1",
  contentPreview: "",
};

function hrefFor(type: NotificationType, overrides: Partial<NotificationHrefContext> = {}) {
  return NOTIFICATION_KINDS[type].href({ ...CONTEXT, ...overrides });
}

describe("notification kind registry", () => {
  it("covers exactly the notification types allowed by the database", () => {
    expect([...NOTIFICATION_TYPES].sort()).toEqual(typesAllowedByLatestMigration().sort());
  });

  it("gives every kind an icon, a label key and a known category", () => {
    for (const type of NOTIFICATION_TYPES) {
      const kind = NOTIFICATION_KINDS[type];
      expect(kind.icon).toBeTruthy();
      expect(kind.labelKey).toMatch(/^type[A-Z]/);
      expect(NOTIFICATION_CATEGORIES).toContain(kind.category);
    }
  });

  it("partitions every type into exactly one category", () => {
    const partitioned = NOTIFICATION_CATEGORIES.flatMap((category) => typesForCategory(category)!);
    expect([...partitioned].sort()).toEqual([...NOTIFICATION_TYPES].sort());
  });

  it("resolves categories and their icons", () => {
    expect(typesForCategory("all")).toBeNull();
    expect(typesForCategory("friends")).toEqual(["friend_request", "friend_accepted"]);
    expect(typesForCategory("moderation")).toEqual(["moderation_warning"]);
    for (const category of NOTIFICATION_CATEGORIES) {
      expect(categoryIcon(category)).toBeTruthy();
    }
  });

  it("flags only achievements as system notifications", () => {
    expect(NOTIFICATION_TYPES.filter((type) => NOTIFICATION_KINDS[type].system)).toEqual([
      "achievement_unlocked",
    ]);
  });

  it("falls back to a neutral kind for unknown types", () => {
    const kind = notificationKind("constructor" as NotificationType);
    expect(kind.icon).toBe("mdi:bell-outline");
    expect(kind.href(CONTEXT)).toBeNull();
  });
});

describe("notification kind hrefs", () => {
  it("links a post comment to the recipient's own posts, not the commenter's", () => {
    expect(hrefFor("post_comment")).toBe("/players/recipient-1?tab=activity");
  });

  it("links posts created by or mentioning the recipient to the author's activity", () => {
    expect(hrefFor("post_created")).toBe("/players/sender-1?tab=activity");
    expect(hrefFor("post_mention")).toBe("/players/sender-1?tab=activity");
  });

  it("links social and progression kinds to existing pages", () => {
    expect(hrefFor("friend_request")).toBe("/friends");
    expect(hrefFor("friend_accepted")).toBe("/players/sender-1");
    expect(hrefFor("review_vote")).toBe("/players/recipient-1?tab=reviews");
    expect(hrefFor("achievement_unlocked")).toBe("/players/recipient-1/achievements");
    expect(hrefFor("discussion_message")).toBe("/discussions");
    expect(hrefFor("coaching_paid")).toBe("/coaching/sessions");
  });

  it("links a moderation warning according to the warned content type", () => {
    expect(hrefFor("moderation_warning", { contentPreview: "review" })).toBe(
      "/players/recipient-1?tab=reviews"
    );
    expect(hrefFor("moderation_warning", { contentPreview: "post" })).toBe(
      "/players/recipient-1?tab=activity"
    );
    expect(hrefFor("moderation_warning", { contentPreview: "profile" })).toBe(
      "/players/recipient-1"
    );
    expect(hrefFor("moderation_warning", { contentPreview: "comment" })).toBeNull();
    expect(hrefFor("moderation_warning", { contentPreview: "" })).toBeNull();
    expect(hrefFor("moderation_warning", { contentPreview: "toString" })).toBeNull();
  });
});
