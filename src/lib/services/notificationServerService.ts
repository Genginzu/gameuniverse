import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import type { Notification, NotificationType } from "@/types/notification";

// Table not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

/** Raw row shape from Supabase notifications table */
interface NotificationRow {
  id: string;
  recipient_id: string;
  sender_id: string;
  type: NotificationType;
  reference_id: string;
  content_preview: string;
  is_read: boolean;
  created_at: string;
  sender: { username: string; avatar_url: string | null } | null;
}

function transformRow(row: NotificationRow): Notification {
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

/**
 * Server-side service for notifications.
 * Queries the notifications table via Supabase.
 */
export class NotificationServerService {
  /** Create a notification. Returns null if self-notification or on error. */
  static async create(
    recipientId: string,
    senderId: string,
    type: NotificationType,
    referenceId: string,
    contentPreview: string
  ): Promise<Notification | null> {
    if (recipientId === senderId) return null;

    // Use the admin client to bypass RLS: the insert is authored by the sender,
    // but the notifications SELECT policy only grants reads to the recipient, so
    // RLS would strip the RETURNING row when using a user-context client.
    const supabase = getSupabaseAdmin();
    const truncatedPreview = contentPreview.slice(0, 100);

    const { data, error } = await supabase
      .from("notifications" as UntypedFrom)
      .insert({
        recipient_id: recipientId,
        sender_id: senderId,
        type,
        reference_id: referenceId,
        content_preview: truncatedPreview,
      })
      .select(
        "id, recipient_id, sender_id, type, reference_id, content_preview, is_read, created_at"
      )
      .single();

    if (error || !data) {
      logger.error("Failed to create notification", { error: error?.message, recipientId, type });
      return null;
    }

    const row = data as unknown as Omit<NotificationRow, "sender">;
    return {
      id: row.id,
      recipientId: row.recipient_id,
      senderId: row.sender_id,
      type: row.type,
      referenceId: row.reference_id,
      contentPreview: row.content_preview,
      isRead: row.is_read,
      createdAt: row.created_at,
    };
  }

  /** Fetch unread notifications for a recipient, with sender profile info. */
  static async getUnread(recipientId: string, limit: number = 20): Promise<Notification[]> {
    const supabase = await createRouteHandlerClient();

    // notifications has two FKs to profiles (sender_id + recipient_id), so the
    // embed needs the `!<column>` hint to disambiguate which relationship to follow.
    const { data, error } = await supabase
      .from("notifications" as UntypedFrom)
      .select(
        "id, recipient_id, sender_id, type, reference_id, content_preview, is_read, created_at, sender:profiles!sender_id(username, avatar_url)"
      )
      .eq("recipient_id", recipientId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Failed to fetch unread notifications", { error: error.message, recipientId });
      return [];
    }

    return ((data ?? []) as unknown as NotificationRow[]).map(transformRow);
  }

  /** Count unread notifications for a recipient. */
  static async getUnreadCount(recipientId: string): Promise<number> {
    const supabase = await createRouteHandlerClient();

    const { count, error } = await supabase
      .from("notifications" as UntypedFrom)
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", recipientId)
      .eq("is_read", false);

    if (error) {
      logger.error("Failed to count unread notifications", { error: error.message, recipientId });
      return 0;
    }

    return count ?? 0;
  }

  /** Mark a single notification as read. Returns true on success. */
  static async markAsRead(notificationId: string, recipientId: string): Promise<boolean> {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("notifications" as UntypedFrom)
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("recipient_id", recipientId)
      .select("id")
      .single();

    if (error || !data) {
      logger.error("Failed to mark notification as read", {
        error: error?.message,
        notificationId,
        recipientId,
      });
      return false;
    }

    return true;
  }

  /** Mark all unread notifications as read for a recipient. Returns true on success. */
  static async markAllAsRead(recipientId: string): Promise<boolean> {
    const supabase = await createRouteHandlerClient();

    const { error } = await supabase
      .from("notifications" as UntypedFrom)
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
