import type { PlayerReviewsQueryParams, PlayerReviewsResponse } from "@/types/playerReview";
import { buildReviewsUrl } from "@/lib/utils/playerReviewUtils";

/**
 * Service client pour récupérer les avis d'un joueur.
 * Communique avec GET /api/players/{playerId}/reviews.
 */
export class PlayerReviewsService {
  /**
   * Récupère les avis d'un joueur avec pagination et tri optionnel.
   * @param playerId - UUID du joueur
   * @param params - Paramètres de requête (page, sort, locale)
   * @returns La réponse avec reviews, stats et pagination
   * @throws Error avec message descriptif si l'appel échoue
   */
  static async fetchReviews(
    playerId: string,
    params: PlayerReviewsQueryParams = {}
  ): Promise<PlayerReviewsResponse> {
    const url = buildReviewsUrl(playerId, params);

    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = body?.error || `Failed to fetch reviews (${response.status})`;
      throw new Error(message);
    }

    return response.json();
  }
}
