"use client";

import { useState } from "react";
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

interface NotificationCenterItemProps {
  notification: Notification;
  onToggleRead: (id: string, isRead: boolean) => void;
}

/**
 * Row for the notification center list: expandable preview, read/unread toggle
 * and a direct link to the related resource.
 */
export function NotificationCenterItem({ notification, onToggleRead }: NotificationCenterItemProps) {
  const t = useTranslations("notifications");
  const tc = useTranslations("notificationCenter");
  const format = useFormatter();
  const [expanded, setExpanded] = useState(false);

  const createdAt = new Date(notification.createdAt);
  const now = new Date();
  const safeDate = createdAt > now ? now : createdAt;
  const relativeDate = format.relativeTime(safeDate, now);

  const senderName = notification.sender?.username ?? "?";
  const system = isSystemNotification(notification.type);
  const typeLabel = t(TYPE_LABEL_KEYS[notification.type] ?? "typePostComment");
  const href = getNotificationHref(notification.type, notification.senderId);
  const showPreview = Boolean(notification.contentPreview) && hasContentPreview(notification.type);
  const isUnread = !notification.isRead;

  return (
    <div
      className={`border-editorial-line rounded-2xl border p-3 transition-colors md:p-4 ${
        isUnread ? "bg-editorial-accent/[0.06]" : "bg-editorial-2"
      }`}
      data-unread={isUnread}
    >
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className="bg-editorial-accent/15 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full">
          <Icon
            icon={TYPE_ICONS[notification.type] ?? "mdi:bell-outline"}
            className="text-editorial-accent size-4.5"
          />
        </div>

        {/* Main */}
        <button
          type="button"
          onClick={() => showPreview && setExpanded((v) => !v)}
          className={`min-w-0 flex-1 text-left ${showPreview ? "cursor-pointer" : "cursor-default"}`}
          aria-expanded={showPreview ? expanded : undefined}
        >
          <p className="text-sm text-white">
            {!system && <span className="font-semibold">{senderName} </span>}
            <span className="text-editorial-muted">{typeLabel}</span>
          </p>
          {showPreview && (
            <p
              className={`text-editorial-muted mt-0.5 text-xs ${expanded ? "" : "truncate"}`}
            >
              {notification.contentPreview}
            </p>
          )}
          <time
            dateTime={notification.createdAt}
            className="mt-1 block text-xs text-slate-500"
            suppressHydrationWarning
          >
            {relativeDate}
          </time>
        </button>

        {/* Unread dot */}
        {isUnread && (
          <span
            aria-hidden
            className="bg-editorial-accent mt-2 size-2 shrink-0 rounded-full"
          />
        )}
      </div>

      {/* Actions */}
      <div className="border-editorial-line mt-2.5 flex items-center gap-2 border-t pt-2.5">
        {href && (
          <Link
            href={href}
            onClick={() => isUnread && onToggleRead(notification.id, true)}
            className="text-editorial-accent inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-medium hover:underline"
          >
            <Icon icon="lucide:arrow-up-right" className="size-3.5" />
            {tc("viewResource")}
          </Link>
        )}
        <button
          type="button"
          onClick={() => onToggleRead(notification.id, isUnread)}
          className="text-editorial-muted ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors hover:text-white"
        >
          <Icon
            icon={isUnread ? "mdi:email-open-outline" : "mdi:email-outline"}
            className="size-3.5"
          />
          {isUnread ? tc("markAsRead") : tc("markAsUnread")}
        </button>
      </div>
    </div>
  );
}
