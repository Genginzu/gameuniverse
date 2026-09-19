"use client";

import { useTranslations, useFormatter } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import type { Notification } from "@/types/notification";
import {
  getNotificationHref,
  hasContentPreview,
  isSystemNotification,
  TYPE_ICONS,
  TYPE_LABEL_KEYS,
} from "@/lib/notificationDisplay";

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onNavigate?: () => void;
}

export function NotificationItem({ notification, onDismiss, onNavigate }: NotificationItemProps) {
  const t = useTranslations("notifications");
  const format = useFormatter();

  const createdAt = new Date(notification.createdAt);
  const now = new Date();
  const safeDate = createdAt > now ? now : createdAt;
  const relativeDate = format.relativeTime(safeDate, now);

  const senderName = notification.sender?.username ?? "?";
  const isSystem = isSystemNotification(notification.type);
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
        {isSystem ? (
          <p className="text-sm text-slate-200">
            <span className="text-slate-400">{typeLabel}</span>
          </p>
        ) : (
          <p className="text-sm text-slate-200">
            <span className="font-semibold">{senderName}</span>{" "}
            <span className="text-slate-400">{typeLabel}</span>
          </p>
        )}
        {notification.contentPreview && hasContentPreview(notification.type) && (
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
