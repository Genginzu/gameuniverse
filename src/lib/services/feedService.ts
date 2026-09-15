import type { FeedQueryParams, FeedResponse } from "@/types/feed";

/**
 * Service client pour le fil d'actualité d'un joueur.
 * Communique avec l'endpoint /api/players/{playerId}/feed (owner-only côté API).
 *
 * Contrepartie serveur : `FeedServerService` dans `feedServerService.ts`.
 */
export class FeedService {
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
