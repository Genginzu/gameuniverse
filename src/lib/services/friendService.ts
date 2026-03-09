import type {
  FriendsListResponse,
  FriendsQueryParams,
  RelationshipStatusResponse,
} from "@/types/friendship";

/**
 * Service client pour gérer les opérations d'amitié.
 * Communique avec les endpoints /api/players/{playerId}/friends/*.
 */
export class FriendService {
  /**
   * Récupère la liste d'amis d'un joueur avec pagination.
   */
  static async getFriends(
    playerId: string,
    params: FriendsQueryParams = {}
  ): Promise<FriendsListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set("page", String(params.page));
    if (params.limit !== undefined) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const url = `/api/players/${playerId}/friends${query ? `?${query}` : ""}`;

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to fetch friends");
    }
    return response.json();
  }

  /**
   * Récupère le statut de relation entre le joueur courant et un joueur cible.
   */
  static async getRelationshipStatus(playerId: string): Promise<RelationshipStatusResponse> {
    const response = await fetch(`/api/players/${playerId}/friends/status`);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to fetch relationship status");
    }
    return response.json();
  }

  /**
   * Envoie une demande d'ami au joueur cible.
   */
  static async sendFriendRequest(playerId: string) {
    const response = await fetch(`/api/players/${playerId}/friends`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to send friend request");
    }
    return response.json();
  }

  /**
   * Accepte une demande d'ami en attente.
   */
  static async acceptFriendRequest(playerId: string, friendshipId: string) {
    const response = await fetch(`/api/players/${playerId}/friends/${friendshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to accept friend request");
    }
    return response.json();
  }

  /**
   * Refuse une demande d'ami en attente.
   */
  static async declineFriendRequest(
    playerId: string,
    friendshipId: string
  ): Promise<{ success: true }> {
    const response = await fetch(`/api/players/${playerId}/friends/${friendshipId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to decline friend request");
    }
    return response.json();
  }

  /**
   * Retire un ami confirmé.
   */
  static async removeFriend(playerId: string, friendshipId: string): Promise<{ success: true }> {
    const response = await fetch(`/api/players/${playerId}/friends/${friendshipId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to remove friend");
    }
    return response.json();
  }
}
