import type { NotificationType } from "@/types/notification";

/**
 * Shared display metadata for notifications, reused by the header bell dropdown
 * (`NotificationItem`) and the unified notification center (`/notifications`).
 *
 * Keeping the href builder, icon map, label keys and category mapping in one
 * place avoids drift between the two surfaces.
 */

/** Build the target path a notification should route to, or null if non-navigable. */
export function getNotificationHref(type: NotificationType, senderId: string): string | null {
  if (type === "post_created") return `/players/${senderId}?tab=activity`;
  if (type === "post_mention") return `/players/${senderId}?tab=posts`;
  if (type === "post_comment") return `/players/${senderId}?tab=posts`;
  if (type === "discussion_message") return "/discussions";
  if (type.startsWith("coaching_")) return "/coaching/sessions";
  if (type === "friend_request") return "/players/me/friends";
  if (type === "friend_accepted") return `/players/${senderId}`;
  if (type === "review_vote") return "/reviews";
  if (type === "achievement_unlocked") return "/players/me/achievements";
  return null;
}

/** Iconify icon per notification type. */
export const TYPE_ICONS: Record<NotificationType, string> = {
  post_comment: "mdi:comment-outline",
  discussion_message: "mdi:message-outline",
  post_created: "mdi:post-outline",
  post_mention: "mdi:at",
  coaching_requested: "lucide:calendar-plus",
  coaching_confirmed: "lucide:check-circle",
  coaching_declined: "lucide:x-circle",
  coaching_started: "lucide:play-circle",
  coaching_completed: "lucide:check-check",
  coaching_cancelled: "lucide:x-circle",
  coaching_paid: "lucide:credit-card",
  friend_request: "mdi:account-plus-outline",
  friend_accepted: "mdi:account-check-outline",
  review_vote: "mdi:thumb-up-outline",
  achievement_unlocked: "mdi:trophy-outline",
};

/** i18n sub-key (under the `notifications` namespace) per notification type. */
export const TYPE_LABEL_KEYS: Record<NotificationType, string> = {
  post_comment: "typePostComment",
  discussion_message: "typeDiscussionMessage",
  post_created: "typePostCreated",
  post_mention: "typePostMention",
  coaching_requested: "typeCoachingRequested",
  coaching_confirmed: "typeCoachingConfirmed",
  coaching_declined: "typeCoachingDeclined",
  coaching_started: "typeCoachingStarted",
  coaching_completed: "typeCoachingCompleted",
  coaching_cancelled: "typeCoachingCancelled",
  coaching_paid: "typeCoachingPaid",
  friend_request: "typeFriendRequest",
  friend_accepted: "typeFriendAccepted",
  review_vote: "typeReviewVote",
  achievement_unlocked: "typeAchievementUnlocked",
};

/** Notification types treated as system events (no human sender to display). */
export const SYSTEM_NOTIFICATION_TYPES: readonly NotificationType[] = ["achievement_unlocked"];

export function isSystemNotification(type: NotificationType): boolean {
  return SYSTEM_NOTIFICATION_TYPES.includes(type);
}

/** Types whose content preview is not meaningful and should be hidden. */
export function hasContentPreview(type: NotificationType): boolean {
  return (
    !type.startsWith("coaching_") && type !== "friend_request" && type !== "friend_accepted"
  );
}

/**
 * Filter categories exposed in the notification center. Each maps to a set of
 * concrete notification types. `all` is handled separately (no type filter).
 */
export type NotificationCategory =
  | "friends"
  | "reviews"
  | "mentions"
  | "achievements"
  | "coaching"
  | "activity";

/** Ordered list of categories for rendering filter tabs. */
export const NOTIFICATION_CATEGORIES: readonly NotificationCategory[] = [
  "friends",
  "reviews",
  "mentions",
  "achievements",
  "coaching",
  "activity",
];

/** Exhaustive partition of every NotificationType into a display category. */
export const CATEGORY_TYPES: Record<NotificationCategory, readonly NotificationType[]> = {
  friends: ["friend_request", "friend_accepted"],
  reviews: ["review_vote"],
  mentions: ["post_mention"],
  achievements: ["achievement_unlocked"],
  coaching: [
    "coaching_requested",
    "coaching_confirmed",
    "coaching_declined",
    "coaching_started",
    "coaching_completed",
    "coaching_cancelled",
    "coaching_paid",
  ],
  activity: ["post_comment", "post_created", "discussion_message"],
};

const CATEGORY_ICONS: Record<NotificationCategory, string> = {
  friends: "mdi:account-multiple-outline",
  reviews: "mdi:thumb-up-outline",
  mentions: "mdi:at",
  achievements: "mdi:trophy-outline",
  coaching: "lucide:graduation-cap",
  activity: "mdi:message-outline",
};

export function categoryIcon(category: NotificationCategory): string {
  return CATEGORY_ICONS[category];
}

/** Resolve the list of notification types for a category, or null for `all`. */
export function typesForCategory(
  category: NotificationCategory | "all"
): NotificationType[] | null {
  if (category === "all") return null;
  return [...CATEGORY_TYPES[category]];
}

const CATEGORY_BY_TYPE: Partial<Record<NotificationType, NotificationCategory>> = Object.entries(
  CATEGORY_TYPES
).reduce<Partial<Record<NotificationType, NotificationCategory>>>((acc, [category, types]) => {
  for (const type of types) {
    acc[type] = category as NotificationCategory;
  }
  return acc;
}, {});

export function categoryForType(type: NotificationType): NotificationCategory | null {
  return CATEGORY_BY_TYPE[type] ?? null;
}
