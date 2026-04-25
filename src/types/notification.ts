export type NotificationType = "post_comment" | "discussion_message" | "post_created" | "post_mention" | "coaching_requested" | "coaching_confirmed" | "coaching_declined" | "coaching_started" | "coaching_completed" | "coaching_cancelled" | "coaching_paid";

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  type: NotificationType;
  referenceId: string;
  contentPreview: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    username: string;
    avatarUrl: string | null;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
}

export interface NotificationCountResponse {
  count: number;
}
