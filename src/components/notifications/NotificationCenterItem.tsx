"use client";

import { useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import type { Notification } from "@/types/notification";
import { presentNotification } from "@/lib/notifications/presentNotification";

interface NotificationCenterItemProps {
  notification: Notification;
  onToggleRead: (id: string, isRead: boolean) => void;
}

export function NotificationCenterItem({
  notification,
  onToggleRead,
}: NotificationCenterItemProps) {
  const t = useTranslations("notifications");
  const tc = useTranslations("notificationCenter");
  const format = useFormatter();
  const [expanded, setExpanded] = useState(false);
  const now = new Date();
  const view = presentNotification(notification, { now, translate: t });
  const isUnread = !notification.isRead;

  return (
    <div
      className={`border-editorial-line rounded-2xl border p-3 transition-colors md:p-4 ${
        isUnread ? "bg-editorial-accent/[0.06]" : "bg-editorial-2"
      }`}
      data-unread={isUnread}
    >
      <div className="flex items-start gap-3">
        <div className="bg-editorial-accent/15 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full">
          <Icon icon={view.icon} className="text-editorial-accent size-4.5" />
        </div>

        <button
          type="button"
          onClick={() => view.preview && setExpanded((v) => !v)}
          className={`min-w-0 flex-1 text-left ${view.preview ? "cursor-pointer" : "cursor-default"}`}
          aria-expanded={view.preview ? expanded : undefined}
        >
          <p className="text-sm text-white">
            {view.senderName && <span className="font-semibold">{view.senderName} </span>}
            <span className="text-editorial-muted">{view.label}</span>
          </p>
          {view.preview && (
            <p className={`text-editorial-muted mt-0.5 text-xs ${expanded ? "" : "truncate"}`}>
              {view.preview}
            </p>
          )}
          <time
            dateTime={notification.createdAt}
            className="mt-1 block text-xs text-slate-500"
            suppressHydrationWarning
          >
            {format.relativeTime(view.date, now)}
          </time>
        </button>

        {isUnread && (
          <span aria-hidden className="bg-editorial-accent mt-2 size-2 shrink-0 rounded-full" />
        )}
      </div>

      <div className="border-editorial-line mt-2.5 flex items-center gap-2 border-t pt-2.5">
        {view.href && (
          <Link
            href={view.href}
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
