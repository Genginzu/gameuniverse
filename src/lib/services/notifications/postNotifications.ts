import {
  NOTHING_DELIVERED,
  deliverNotification,
  deliverNotifications,
  guardedDelivery,
} from "@/lib/services/notifications/deliverNotification";
import {
  findFollowerIds,
  findOtherParticipantId,
  findPostOwnerId,
} from "@/lib/services/notifications/notificationLookups";
import type { NotificationDeliveryResult, NotificationType } from "@/types/notification";

function fanOut(
  type: NotificationType,
  recipientIds: string[],
  post: { postId: string; authorId: string; content: string }
): Promise<NotificationDeliveryResult> {
  return deliverNotifications(
    recipientIds.map((recipientId) => ({
      recipientId,
      senderId: post.authorId,
      type,
      referenceId: post.postId,
      preview: post.content,
    }))
  );
}

export function postMentioned(input: {
  postId: string;
  authorId: string;
  content: string;
  mentionedPlayerIds: string[];
}): Promise<NotificationDeliveryResult> {
  const { mentionedPlayerIds, ...post } = input;
  return guardedDelivery("postMentioned", { postId: post.postId, authorId: post.authorId }, () =>
    fanOut("post_mention", mentionedPlayerIds, post)
  );
}

export function followersNotifiedOfPost(input: {
  postId: string;
  authorId: string;
  content: string;
}): Promise<NotificationDeliveryResult> {
  const context = { postId: input.postId, authorId: input.authorId };
  return guardedDelivery("followersNotifiedOfPost", context, async () =>
    fanOut("post_created", await findFollowerIds(input.authorId), input)
  );
}

export function postCommented(input: {
  postId: string;
  commenterId: string;
  content: string;
}): Promise<NotificationDeliveryResult> {
  const context = { postId: input.postId, commenterId: input.commenterId };
  return guardedDelivery("postCommented", context, async () => {
    const ownerId = await findPostOwnerId(input.postId);
    if (!ownerId) return NOTHING_DELIVERED;
    return deliverNotification({
      recipientId: ownerId,
      senderId: input.commenterId,
      type: "post_comment",
      referenceId: input.postId,
      preview: input.content,
    });
  });
}

export function discussionMessageSent(input: {
  conversationId: string;
  senderId: string;
  content: string;
}): Promise<NotificationDeliveryResult> {
  const context = { conversationId: input.conversationId, senderId: input.senderId };
  return guardedDelivery("discussionMessageSent", context, async () => {
    const recipientId = await findOtherParticipantId(input.conversationId, input.senderId);
    if (!recipientId) return NOTHING_DELIVERED;
    return deliverNotification({
      recipientId,
      senderId: input.senderId,
      type: "discussion_message",
      referenceId: input.conversationId,
      preview: input.content,
    });
  });
}
