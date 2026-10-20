import type { Notification, NotificationType } from "@/types/notification";

export const NOTIFICATION_COLUMNS =
  "id, recipient_id, sender_id, type, reference_id, content_preview, is_read, created_at";

export const NOTIFICATION_WITH_SENDER_COLUMNS = `${NOTIFICATION_COLUMNS}, sender:profiles!sender_id(username, avatar_url)`;

export interface NotificationRow {
  id: string;
  recipient_id: string;
  sender_id: string;
  type: NotificationType;
  reference_id: string;
  content_preview: string;
  is_read: boolean;
  created_at: string;
  sender?: { username: string; avatar_url: string | null } | null;
}

export function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    senderId: row.sender_id,
    type: row.type,
    referenceId: row.reference_id,
    contentPreview: row.content_preview,
    isRead: row.is_read,
    createdAt: row.created_at,
    sender: row.sender
      ? { username: row.sender.username, avatarUrl: row.sender.avatar_url }
      : undefined,
  };
}
