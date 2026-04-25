import type { FeedQueryParams, FeedResponse } from "@/types/feed";
import type {
  SubscriptionsListResponse,
  SubscriptionStatus,
  CreateSubscriptionPayload,
} from "@/types/subscription";

/**
 * Service client pour gérer les abonnements entre joueurs.
 * Communique avec les endpoints /api/players/{playerId}/subscriptions*.
 */
export class SubscriptionService {
  /** Liste des joueurs suivis par playerId. */
  static async getSubscriptions(playerId: string): Promise<SubscriptionsListResponse> {
    const response = await fetch(`/api/players/${playerId}/subscriptions`);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to fetch subscriptions");
    }
    return response.json();
  }

  /** Liste des abonnés de playerId. */
  static async getSubscribers(playerId: string): Promise<SubscriptionsListResponse> {
    const response = await fetch(`/api/players/${playerId}/subscribers`);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to fetch subscribers");
    }
    return response.json();
  }

  /** Statut d'abonnement entre viewerId et targetId. */
  static async getRelationship(viewerId: string, targetId: string): Promise<SubscriptionStatus> {
    const response = await fetch(`/api/players/${viewerId}/subscriptions/${targetId}`);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to fetch subscription status");
    }
    return response.json();
  }

  /** Le spectateur connecté s'abonne à targetId. */
  static async subscribe(viewerId: string, targetId: string): Promise<{ success: true }> {
    const payload: CreateSubscriptionPayload = { targetId };
    const response = await fetch(`/api/players/${viewerId}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to subscribe");
    }
    return response.json();
  }

  /** Le spectateur connecté se désabonne de targetId. */
  static async unsubscribe(viewerId: string, targetId: string): Promise<{ success: true }> {
    const response = await fetch(`/api/players/${viewerId}/subscriptions/${targetId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to unsubscribe");
    }
    return response.json();
  }

  /** Récupère une page du fil d'actualité du spectateur (owner-only côté API). */
  static async fetchFeed(viewerId: string, params: FeedQueryParams = {}): Promise<FeedResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set("page", String(params.page));
    if (params.locale !== undefined) searchParams.set("locale", params.locale);

    const query = searchParams.toString();
    const url = `/api/players/${viewerId}/feed${query ? `?${query}` : ""}`;

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to fetch feed: ${response.status}`);
    }
    return response.json();
  }
}
