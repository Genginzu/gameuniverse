export interface Conversation {
  id: string;
  participant1: string;
  participant2: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  /** id and displayName are null once the friend deleted their account. */
  friend: {
    id: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
  lastMessage: {
    content: string;
    senderId: string | null;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  /** null once the sender deleted their account. */
  senderId: string | null;
  content: string;
  createdAt: string;
  readAt: string | null;
}

export interface ConversationListResponse {
  conversations: ConversationSummary[];
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface UnreadCountResponse {
  count: number;
}

export interface CreateConversationRequest {
  friendId: string;
}

export interface SendMessageRequest {
  content: string;
}
