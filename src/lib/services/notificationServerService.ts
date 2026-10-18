import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import {
  NOTIFICATION_WITH_SENDER_COLUMNS,
  toNotification,
  type NotificationRow,
} from "@/lib/services/notifications/notificationRow";
import type {
  Notification,
  NotificationStatusFilter,
  NotificationType,
} from "@/types/notification";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

function toNotifications(data: unknown): Notification[] {
  return ((data ?? []) as NotificationRow[]).map(toNotification);
}

async function notificationsTable() {
  const supabase = await createRouteHandlerClient();
  return supabase.from("notifications" as UntypedFrom);
}

export class NotificationServerService {
  static async getUnread(recipientId: string, limit: number = 20): Promise<Notification[]> {
    const { data, error } = await (
      await notificationsTable()
    )
      .select(NOTIFICATION_WITH_SENDER_COLUMNS)
      .eq("recipient_id", recipientId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Failed to fetch unread notifications", { error: error.message, recipientId });
      return [];
    }
    return toNotifications(data);
  }

  static async getAll(
    recipientId: string,
    options: {
      page?: number;
      limit?: number;
      types?: NotificationType[] | null;
      status?: NotificationStatusFilter;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(50, Math.max(1, options.limit ?? 20));
    const from = (page - 1) * limit;

    let query = (await notificationsTable())
      .select(NOTIFICATION_WITH_SENDER_COLUMNS, { count: "exact" })
      .eq("recipient_id", recipientId);

    if (options.status === "unread") query = query.eq("is_read", false);
    else if (options.status === "read") query = query.eq("is_read", true);

    if (options.types && options.types.length > 0) {
      query = query.in("type", options.types);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    if (error) {
      logger.error("Failed to fetch notifications page", { error: error.message, recipientId });
      return { notifications: [], total: 0 };
    }
    return { notifications: toNotifications(data), total: count ?? 0 };
  }

  static async getUnreadCount(recipientId: string): Promise<number> {
    const { count, error } = await (
      await notificationsTable()
    )
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", recipientId)
      .eq("is_read", false);

    if (error) {
      logger.error("Failed to count unread notifications", { error: error.message, recipientId });
      return 0;
    }
    return count ?? 0;
  }

  static async setReadStatus(
    notificationId: string,
    recipientId: string,
    isRead: boolean
  ): Promise<boolean> {
    const { data, error } = await (
      await notificationsTable()
    )
      .update({ is_read: isRead })
      .eq("id", notificationId)
      .eq("recipient_id", recipientId)
      .select("id")
      .single();

    if (error || !data) {
      logger.error("Failed to set notification read status", {
        error: error?.message,
        notificationId,
        recipientId,
        isRead,
      });
      return false;
    }
    return true;
  }

  static markAsRead(notificationId: string, recipientId: string): Promise<boolean> {
    return NotificationServerService.setReadStatus(notificationId, recipientId, true);
  }

  static async markAllAsRead(recipientId: string): Promise<boolean> {
    const { error } = await (
      await notificationsTable()
    )
      .update({ is_read: true })
      .eq("recipient_id", recipientId)
      .eq("is_read", false);

    if (error) {
      logger.error("Failed to mark all notifications as read", {
        error: error.message,
        recipientId,
      });
      return false;
    }
    return true;
  }
}
