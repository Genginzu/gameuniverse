import type { ActivityQueryParams, ActivityResponse } from "@/types/activity";

/**
 * Service client pour récupérer le flux d'activité d'un joueur.
 * Communique avec GET /api/players/{playerId}/activity.
 */
export class ActivityService {
  /**
   * Récupère les événements d'activité d'un joueur avec pagination et filtre optionnel.
   * @param playerId - UUID du joueur
   * @param params - Paramètres de requête (page, type, locale)
   * @returns La réponse d'activité avec événements et pagination
   * @throws Error avec message descriptif si l'appel échoue
   */
  static async fetchActivity(
    playerId: string,
    params: ActivityQueryParams = {}
  ): Promise<ActivityResponse> {
    const url = this.buildUrl(playerId, params);

    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message =
        body.error || `Failed to fetch activity: ${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    return response.json();
  }

  /**
   * Construit l'URL de l'API avec les query params non-undefined.
   */
  private static buildUrl(playerId: string, params: ActivityQueryParams): string {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined) {
      searchParams.set("page", String(params.page));
    }
    if (params.type !== undefined) {
      searchParams.set("type", params.type);
    }
    if (params.locale !== undefined) {
      searchParams.set("locale", params.locale);
    }

    const query = searchParams.toString();
    return `/api/players/${playerId}/activity${query ? `?${query}` : ""}`;
  }
}
