import type {
  NotificationCategory,
  NotificationHrefContext,
  NotificationKindDescriptor,
  NotificationPreviewPolicy,
  NotificationType,
} from "@/types/notification";
import {
  contentHref,
  isReportContentType,
  playerActivityHref,
  playerReviewsHref,
} from "@/lib/moderation/contentHref";
import { ownEntry } from "@/lib/utils/ownEntry";

const NO_PREVIEW: NotificationPreviewPolicy = { kind: "none" };
const TEXT_PREVIEW: NotificationPreviewPolicy = { kind: "text" };

function moderatedContentHref({ contentPreview, recipientId }: NotificationHrefContext) {
  if (!isReportContentType(contentPreview)) return null;
  return contentHref(contentPreview, { authorId: recipientId });
}

function coachingKind(icon: string, labelKey: string): NotificationKindDescriptor {
  return {
    icon,
    labelKey,
    category: "coaching",
    system: false,
    preview: NO_PREVIEW,
    href: () => "/coaching/sessions",
  };
}

export const NOTIFICATION_KINDS: Record<NotificationType, NotificationKindDescriptor> = {
  post_comment: {
    icon: "mdi:comment-outline",
    labelKey: "typePostComment",
    category: "activity",
    system: false,
    preview: TEXT_PREVIEW,
    href: ({ recipientId }) => playerActivityHref(recipientId),
  },
  discussion_message: {
    icon: "mdi:message-outline",
    labelKey: "typeDiscussionMessage",
    category: "activity",
    system: false,
    preview: TEXT_PREVIEW,
    href: () => "/discussions",
  },
  post_created: {
    icon: "mdi:post-outline",
    labelKey: "typePostCreated",
    category: "activity",
    system: false,
    preview: TEXT_PREVIEW,
    href: ({ senderId }) => playerActivityHref(senderId),
  },
  post_mention: {
    icon: "mdi:at",
    labelKey: "typePostMention",
    category: "mentions",
    system: false,
    preview: TEXT_PREVIEW,
    href: ({ senderId }) => playerActivityHref(senderId),
  },
  coaching_requested: coachingKind("lucide:calendar-plus", "typeCoachingRequested"),
  coaching_confirmed: coachingKind("lucide:check-circle", "typeCoachingConfirmed"),
  coaching_declined: coachingKind("lucide:x-circle", "typeCoachingDeclined"),
  coaching_started: coachingKind("lucide:play-circle", "typeCoachingStarted"),
  coaching_completed: coachingKind("lucide:check-check", "typeCoachingCompleted"),
  coaching_cancelled: coachingKind("lucide:x-circle", "typeCoachingCancelled"),
  coaching_paid: coachingKind("lucide:credit-card", "typeCoachingPaid"),
  friend_request: {
    icon: "mdi:account-plus-outline",
    labelKey: "typeFriendRequest",
    category: "friends",
    system: false,
    preview: NO_PREVIEW,
    href: () => "/friends",
  },
  friend_accepted: {
    icon: "mdi:account-check-outline",
    labelKey: "typeFriendAccepted",
    category: "friends",
    system: false,
    preview: NO_PREVIEW,
    href: ({ senderId }) => `/players/${senderId}`,
  },
  review_vote: {
    icon: "mdi:thumb-up-outline",
    labelKey: "typeReviewVote",
    category: "reviews",
    system: false,
    preview: {
      kind: "translated",
      keys: { helpful: "reviewVoteHelpful", not_helpful: "reviewVoteNotHelpful" },
    },
    href: ({ recipientId }) => playerReviewsHref(recipientId),
  },
  achievement_unlocked: {
    icon: "mdi:trophy-outline",
    labelKey: "typeAchievementUnlocked",
    category: "achievements",
    system: true,
    preview: NO_PREVIEW,
    href: ({ recipientId }) => `/players/${recipientId}/achievements`,
  },
  moderation_warning: {
    icon: "lucide:shield-alert",
    labelKey: "typeModerationWarning",
    category: "moderation",
    system: false,
    preview: {
      kind: "translated",
      keys: {
        review: "moderationContentReview",
        post: "moderationContentPost",
        comment: "moderationContentComment",
        profile: "moderationContentProfile",
      },
    },
    href: moderatedContentHref,
  },
};

const FALLBACK_KIND: NotificationKindDescriptor = {
  icon: "mdi:bell-outline",
  labelKey: "typePostComment",
  category: "activity",
  system: false,
  preview: NO_PREVIEW,
  href: () => null,
};

export const NOTIFICATION_TYPES = Object.keys(NOTIFICATION_KINDS) as NotificationType[];

const CATEGORY_ICONS: Record<NotificationCategory, string> = {
  friends: "mdi:account-multiple-outline",
  reviews: "mdi:thumb-up-outline",
  mentions: "mdi:at",
  achievements: "mdi:trophy-outline",
  coaching: "lucide:graduation-cap",
  activity: "mdi:message-outline",
  moderation: "lucide:shield-alert",
};

export const NOTIFICATION_CATEGORIES = Object.keys(CATEGORY_ICONS) as NotificationCategory[];

export function notificationKind(type: NotificationType): NotificationKindDescriptor {
  return ownEntry(NOTIFICATION_KINDS, type) ?? FALLBACK_KIND;
}

export function isSystemNotification(type: NotificationType): boolean {
  return notificationKind(type).system;
}

export function categoryIcon(category: NotificationCategory): string {
  return CATEGORY_ICONS[category];
}

export function categoryForType(type: NotificationType): NotificationCategory | null {
  return ownEntry(NOTIFICATION_KINDS, type)?.category ?? null;
}

export function typesForCategory(
  category: NotificationCategory | "all"
): NotificationType[] | null {
  if (category === "all") return null;
  return NOTIFICATION_TYPES.filter((type) => NOTIFICATION_KINDS[type].category === category);
}
