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
};

export function NotificationItem({ notification, onDismiss, onNavigate }: NotificationItemProps) {
  const t = useTranslations("notifications");
  const format = useFormatter();

  const createdAt = new Date(notification.createdAt);
  const now = new Date();
  const safeDate = createdAt > now ? now : createdAt;
  const relativeDate = format.relativeTime(safeDate, now);

  const senderName = notification.sender?.username ?? "?";
  const typeLabel = t(TYPE_LABEL_KEYS[notification.type] ?? "typePostComment");
  const href = getNotificationHref(notification.type, notification.senderId);

  const body = (
    <>
      {/* Type icon */}
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-palette-primary-500/10 dark:bg-palette-primary-400/10">
        <Icon
          icon={TYPE_ICONS[notification.type] ?? "mdi:bell-outline"}
          className="h-4 w-4 text-palette-primary-500 dark:text-palette-primary-300"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm text-gray-800 dark:text-slate-200">
          <span className="font-semibold">{senderName}</span>{" "}
          <span className="text-gray-600 dark:text-slate-400">{typeLabel}</span>
        </p>
        {notification.contentPreview && !notification.type.startsWith("coaching_") && (
          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-slate-400">
            {notification.contentPreview}
          </p>
        )}
        <time
          dateTime={notification.createdAt}
          className="mt-0.5 block text-xs text-gray-400 dark:text-slate-500"
          suppressHydrationWarning
        >
          {relativeDate}
        </time>
      </div>
    </>
  );

  const containerClass =
    "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/60 dark:hover:bg-slate-700/40";

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
          className={`${containerClass} pr-10 cursor-pointer`}
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
        className="absolute top-2.5 right-2.5 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-600/50 dark:hover:text-slate-300"
        aria-label={t("dismiss")}
      >
        <Icon icon="mdi:close" className="h-4 w-4" />
      </button>
    </div>
  );
}
