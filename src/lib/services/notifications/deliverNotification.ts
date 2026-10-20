import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import {
  NOTIFICATION_COLUMNS,
  toNotification,
  type NotificationRow,
} from "@/lib/services/notifications/notificationRow";
import type {
  Notification,
  NotificationDeliveryResult,
  NotificationType,
} from "@/types/notification";

export interface NotificationDraft {
  recipientId: string;
  senderId: string;
  type: NotificationType;
  referenceId: string;
  preview?: string;
  system?: boolean;
}

export const PREVIEW_MAX_LENGTH = 100;

export const NOTHING_DELIVERED: NotificationDeliveryResult = { delivered: 0 };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isSelfNotification(draft: NotificationDraft): boolean {
  return !draft.system && draft.recipientId === draft.senderId;
}

async function insertNotification(draft: NotificationDraft): Promise<Notification | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("notifications")
      .insert({
        recipient_id: draft.recipientId,
        sender_id: draft.system ? draft.recipientId : draft.senderId,
        type: draft.type,
        reference_id: draft.referenceId,
        content_preview: (draft.preview ?? "").slice(0, PREVIEW_MAX_LENGTH),
      })
      .select(NOTIFICATION_COLUMNS)
      .single();

    if (error || !data) {
      logger.error("Failed to create notification", {
        error: error?.message,
        recipientId: draft.recipientId,
        type: draft.type,
      });
      return null;
    }
    return toNotification(data as unknown as NotificationRow);
  } catch (error) {
    logger.error("Failed to create notification", {
      error: errorMessage(error),
      recipientId: draft.recipientId,
      type: draft.type,
    });
    return null;
  }
}

export async function deliverNotifications(
  drafts: NotificationDraft[]
): Promise<NotificationDeliveryResult> {
  const eligible = drafts.filter((draft) => !isSelfNotification(draft));
  if (eligible.length === 0) return NOTHING_DELIVERED;
  const created = await Promise.all(eligible.map(insertNotification));
  return { delivered: created.filter(Boolean).length };
}

export function deliverNotification(draft: NotificationDraft): Promise<NotificationDeliveryResult> {
  return deliverNotifications([draft]);
}

export async function guardedDelivery(
  intent: string,
  context: Record<string, unknown>,
  deliver: () => Promise<NotificationDeliveryResult>
): Promise<NotificationDeliveryResult> {
  try {
    return await deliver();
  } catch (error) {
    logger.error("Notification intent failed", { intent, error: errorMessage(error), ...context });
    return NOTHING_DELIVERED;
  }
}
