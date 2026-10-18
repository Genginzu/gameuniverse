import { notificationKind, ownEntry } from "@/lib/notifications/notificationKinds";
import type {
  Notification,
  NotificationPresentation,
  NotificationPreviewPolicy,
} from "@/types/notification";

export interface PresentNotificationContext {
  now: Date;
  translate: (key: string) => string;
}

const UNKNOWN_SENDER = "?";

function resolvePreview(
  policy: NotificationPreviewPolicy,
  rawPreview: string,
  translate: (key: string) => string
): string | null {
  if (!rawPreview || policy.kind === "none") return null;
  if (policy.kind === "text") return rawPreview;
  const key = ownEntry(policy.keys, rawPreview);
  return key ? translate(key) : null;
}

export function presentNotification(
  notification: Notification,
  { now, translate }: PresentNotificationContext
): NotificationPresentation {
  const kind = notificationKind(notification.type);
  const createdAt = new Date(notification.createdAt);

  return {
    icon: kind.icon,
    label: translate(kind.labelKey),
    href: kind.href(notification),
    preview: resolvePreview(kind.preview, notification.contentPreview, translate),
    senderName: kind.system ? null : (notification.sender?.username ?? UNKNOWN_SENDER),
    date: createdAt > now ? now : createdAt,
  };
}
