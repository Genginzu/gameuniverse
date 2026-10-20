import {
  deliverNotification,
  guardedDelivery,
} from "@/lib/services/notifications/deliverNotification";
import type { NotificationDeliveryResult } from "@/types/notification";
import type { ReportContentType } from "@/types/report";
import type { VoteType } from "@/types/review";

export function friendRequested(input: {
  friendshipId: string;
  requesterId: string;
  receiverId: string;
}): Promise<NotificationDeliveryResult> {
  return guardedDelivery("friendRequested", input, () =>
    deliverNotification({
      recipientId: input.receiverId,
      senderId: input.requesterId,
      type: "friend_request",
      referenceId: input.friendshipId,
    })
  );
}

export function friendAccepted(input: {
  friendshipId: string;
  accepterId: string;
  requesterId: string;
}): Promise<NotificationDeliveryResult> {
  return guardedDelivery("friendAccepted", input, () =>
    deliverNotification({
      recipientId: input.requesterId,
      senderId: input.accepterId,
      type: "friend_accepted",
      referenceId: input.friendshipId,
    })
  );
}

export function reviewVoted(input: {
  reviewId: string;
  voterId: string;
  authorId: string;
  voteType: VoteType;
}): Promise<NotificationDeliveryResult> {
  return guardedDelivery("reviewVoted", input, () =>
    deliverNotification({
      recipientId: input.authorId,
      senderId: input.voterId,
      type: "review_vote",
      referenceId: input.reviewId,
      preview: input.voteType,
    })
  );
}

export function achievementUnlocked(input: {
  userId: string;
  achievementKey: string;
}): Promise<NotificationDeliveryResult> {
  return guardedDelivery("achievementUnlocked", input, () =>
    deliverNotification({
      recipientId: input.userId,
      senderId: input.userId,
      type: "achievement_unlocked",
      referenceId: input.userId,
      preview: input.achievementKey,
      system: true,
    })
  );
}

export function contentAuthorWarned(input: {
  authorId: string;
  moderatorId: string;
  contentType: ReportContentType;
  contentId: string;
}): Promise<NotificationDeliveryResult> {
  return guardedDelivery("contentAuthorWarned", input, () =>
    deliverNotification({
      recipientId: input.authorId,
      senderId: input.moderatorId,
      type: "moderation_warning",
      referenceId: input.contentId,
      preview: input.contentType,
    })
  );
}
