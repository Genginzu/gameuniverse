export type NotificationType =
  | "post_comment"
  | "discussion_message"
  | "post_created"
  | "post_mention"
  | "coaching_requested"
  | "coaching_confirmed"
  | "coaching_declined"
  | "coaching_started"
  | "coaching_completed"
  | "coaching_cancelled"
  | "coaching_paid"
  | "friend_request"
  | "friend_accepted"
  | "review_vote"
  | "achievement_unlocked"
  | "moderation_warning";

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

/** Read-status filter for the notification center list. */
export type NotificationStatusFilter = "all" | "unread" | "read";

/** Paginated response returned by the notification center list endpoint. */
export interface PaginatedNotificationsResponse {
  notifications: Notification[];
  total: number;
}

export interface NotificationCountResponse {
  count: number;
}

export type NotificationCategory =
  "friends" | "reviews" | "mentions" | "achievements" | "coaching" | "activity" | "moderation";

export type NotificationHrefContext = Pick<
  Notification,
  "referenceId" | "senderId" | "recipientId" | "contentPreview"
>;

export type NotificationPreviewPolicy =
  | { kind: "none" }
  | { kind: "text" }
  | { kind: "translated"; keys: Readonly<Record<string, string>> };

export interface NotificationKindDescriptor {
  icon: string;
  labelKey: string;
  category: NotificationCategory;
  system: boolean;
  preview: NotificationPreviewPolicy;
  href: (context: NotificationHrefContext) => string | null;
}

export interface NotificationPresentation {
  icon: string;
  label: string;
  href: string | null;
  preview: string | null;
  senderName: string | null;
  date: Date;
}

export interface NotificationDeliveryResult {
  delivered: number;
}

export type CoachingTransitionNotificationType = Extract<
  NotificationType,
  | "coaching_confirmed"
  | "coaching_declined"
  | "coaching_started"
  | "coaching_completed"
  | "coaching_cancelled"
>;
