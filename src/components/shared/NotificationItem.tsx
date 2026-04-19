"use client";

import { useTranslations, useFormatter } from "next-intl";
import { Icon } from "@iconify/react";
import type { Notification } from "@/types/notification";

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  post_comment: "mdi:comment-outline",
  discussion_message: "mdi:message-outline",
  post_created: "mdi:post-outline",
};

const TYPE_LABEL_KEYS: Record<string, string> = {
  post_comment: "typePostComment",
  discussion_message: "typeDiscussionMessage",
  post_created: "typePostCreated",
};

export function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const t = useTranslations("notifications");
  const format = useFormatter();

  const createdAt = new Date(notification.createdAt);
  const now = new Date();
  const safeDate = createdAt > now ? now : createdAt;
  const relativeDate = format.relativeTime(safeDate, now);

  const senderName = notification.sender?.username ?? "?";
  const typeLabel = t(TYPE_LABEL_KEYS[notification.type] ?? "typePostComment");

  return (
    <div
      role="menuitem"
      className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/60 dark:hover:bg-slate-700/40"
    >
      {/* Type icon */}
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 dark:bg-violet-400/10">
        <Icon
          icon={TYPE_ICONS[notification.type] ?? "mdi:bell-outline"}
          className="h-4 w-4 text-violet-500 dark:text-violet-300"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800 dark:text-slate-200">
          <span className="font-semibold">{senderName}</span>{" "}
          <span className="text-gray-600 dark:text-slate-400">{typeLabel}</span>
        </p>
        {notification.contentPreview && (
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

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => onDismiss(notification.id)}
        className="shrink-0 self-start rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-600/50 dark:hover:text-slate-300"
        aria-label={t("dismiss")}
      >
        <Icon icon="mdi:close" className="h-4 w-4" />
      </button>
    </div>
  );
}
