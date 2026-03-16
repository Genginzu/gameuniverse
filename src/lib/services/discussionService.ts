import type {
  ConversationListResponse,
  Message,
  MessagesResponse,
  UnreadCountResponse,
} from "@/types/discussion";

/**
 * Service client pour gérer les opérations de messagerie.
 * Communique avec les endpoints /api/discussions/*.
 */
export class DiscussionService {
  /**
   * Récupère la liste des conversations du joueur authentifié.
   */
  static async fetchConversations(): Promise<ConversationListResponse> {
    const response = await fetch("/api/discussions");
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to fetch conversations");
    }
    return response.json();
  }

  /**
   * Crée une nouvelle conversation avec un ami confirmé.
   */
  static async createConversation(friendId: string): Promise<{ id: string }> {
    const response = await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to create conversation");
    }
    return response.json();
  }

  /**
   * Récupère les messages d'une conversation avec pagination cursor-based.
   */
  static async fetchMessages(
    conversationId: string,
    cursor?: string,
    limit?: number
  ): Promise<MessagesResponse> {
    const searchParams = new URLSearchParams();
    if (cursor) searchParams.set("cursor", cursor);
    if (limit !== undefined) searchParams.set("limit", String(limit));

    const query = searchParams.toString();
    const url = `/api/discussions/${conversationId}/messages${query ? `?${query}` : ""}`;

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to fetch messages");
    }
    return response.json();
  }

  /**
   * Envoie un message dans une conversation.
   */
  static async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await fetch(`/api/discussions/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to send message");
    }
    return response.json();
  }

  /**
   * Marque tous les messages non lus d'une conversation comme lus.
   */
  static async markAsRead(conversationId: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/discussions/${conversationId}/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to mark messages as read");
    }
    return response.json();
  }

  /**
   * Récupère le nombre total de messages non lus pour le joueur authentifié.
   */
  static async fetchUnreadCount(): Promise<UnreadCountResponse> {
    const response = await fetch("/api/discussions/unread-count");
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to fetch unread count");
    }
    return response.json();
  }
}
