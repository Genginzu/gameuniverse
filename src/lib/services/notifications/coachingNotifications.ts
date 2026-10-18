import {
  NOTHING_DELIVERED,
  deliverNotification,
  guardedDelivery,
} from "@/lib/services/notifications/deliverNotification";
import {
  findCoachPlayerId,
  findSessionCoachPlayerId,
} from "@/lib/services/notifications/notificationLookups";
import type {
  CoachingTransitionNotificationType,
  NotificationDeliveryResult,
} from "@/types/notification";

export function coachingSessionRequested(input: {
  sessionId: string;
  studentId: string;
  coachProfileId: string;
}): Promise<NotificationDeliveryResult> {
  return guardedDelivery("coachingSessionRequested", input, async () => {
    const coachPlayerId = await findCoachPlayerId(input.coachProfileId);
    if (!coachPlayerId) return NOTHING_DELIVERED;
    return deliverNotification({
      recipientId: coachPlayerId,
      senderId: input.studentId,
      type: "coaching_requested",
      referenceId: input.sessionId,
    });
  });
}

export function coachingSessionTransitioned(input: {
  sessionId: string;
  actorId: string;
  recipientId: string | null;
  type: CoachingTransitionNotificationType;
}): Promise<NotificationDeliveryResult> {
  const { recipientId } = input;
  return guardedDelivery("coachingSessionTransitioned", input, async () => {
    if (!recipientId) return NOTHING_DELIVERED;
    return deliverNotification({
      recipientId,
      senderId: input.actorId,
      type: input.type,
      referenceId: input.sessionId,
    });
  });
}

export function coachingSessionPaid(input: {
  sessionId: string;
  studentId: string;
}): Promise<NotificationDeliveryResult> {
  return guardedDelivery("coachingSessionPaid", input, async () => {
    const coachPlayerId = await findSessionCoachPlayerId(input.sessionId);
    if (!coachPlayerId) return NOTHING_DELIVERED;
    return deliverNotification({
      recipientId: coachPlayerId,
      senderId: input.studentId,
      type: "coaching_paid",
      referenceId: input.sessionId,
    });
  });
}
