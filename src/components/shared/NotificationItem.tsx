"use client";

import { useTranslations, useFormatter } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import type { Notification, NotificationType } from "@/types/notification";

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onNavigate?: () => void;
}

/** Build the target path a notification should route to, or null if non-navigable. */
function getNotificationHref(type: NotificationType, senderId: string): string | null {
  if (type === "post_created") return `/players/${senderId}?tab=activity`;
  if (type === "post_mention") return `/players/${senderId}?tab=posts`;
  if (type.startsWith("coaching_")) return "/coaching/sessions";
  if (type === "friend_request") return "/players/me/friends";
  if (type === "friend_accepted") return `/players/${senderId}`;
  if (type === "review_vote") return "/reviews";
  if (type === "achievement_unlocked") return `/players/me/achievements`;
  return null;
}

const TYPE_ICONS: Record<string, string> = {
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

const TYPE_LABEL_KEYS: Record<string, string> = {
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

export function NotificationItem({ notification, onDismiss, onNavigate }: NotificationItemProps) {
  const t = useTranslations("notifications");
  const format = useFormatter();

  const createdAt = new Date(notification.createdAt);
  const now = new Date();
  const safeDate = createdAt > now ? now : createdAt;
  const relativeDate = format.relativeTime(safeDate, now);

  const senderName = notification.sender?.username ?? "?";
  const isSystemNotification = notification.type === "achievement_unlocked";
  const typeLabel = t(TYPE_LABEL_KEYS[notification.type] ?? "typePostComment");
  const href = getNotificationHref(notification.type, notification.senderId);

  const body = (
    <>
      {/* Type icon */}
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: "rgba(255, 255, 255, 0.05)" }}
      >
        <Icon
          icon={TYPE_ICONS[notification.type] ?? "mdi:bell-outline"}
          className="h-4 w-4"
          style={{ color: "rgb(var(--neon-primary))" }}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 text-left">
        {isSystemNotification ? (
          <p className="text-sm text-slate-200">
            <span className="text-slate-400">{typeLabel}</span>
          </p>
        ) : (
          <p className="text-sm text-slate-200">
            <span className="font-semibold">{senderName}</span>{" "}
            <span className="text-slate-400">{typeLabel}</span>
          </p>
        )}
        {notification.contentPreview &&
          !notification.type.startsWith("coaching_") &&
          notification.type !== "friend_request" &&
          notification.type !== "friend_accepted" && (
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {notification.contentPreview}
            </p>
          )}
        <time
          dateTime={notification.createdAt}
          className="mt-0.5 block text-xs text-slate-500"
          suppressHydrationWarning
        >
          {relativeDate}
        </time>
      </div>
    </>
  );

  const containerClass =
    "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5";

  const handleNavigate = () => {
    onDismiss(notification.id);
    onNavigate?.();
  };

  return (
    <div role="menuitem" className="relative">
      {href ? (
        <Link
          href={href}
          onClick={handleNavigate}
          className={`${containerClass} cursor-pointer pr-10`}
        >
          {body}
        </Link>
      ) : (
        <div className={`${containerClass} pr-10`}>{body}</div>
      )}

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => onDismiss(notification.id)}
        className="absolute top-2.5 right-2.5 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-300"
        aria-label={t("dismiss")}
      >
        <Icon icon="mdi:close" className="h-4 w-4" />
      </button>
    </div>
  );
}
