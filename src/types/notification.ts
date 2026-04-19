export type NotificationType = "post_comment" | "discussion_message" | "post_created";

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
