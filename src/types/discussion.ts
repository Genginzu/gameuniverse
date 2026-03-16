export interface Conversation {
  id: string;
  participant1: string;
  participant2: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  friend: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
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
