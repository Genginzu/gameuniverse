import type { ReviewFormData, ReviewsResponse } from "@/types/review";

/**
 * Service pour la gestion des reviews de jeux.
 * Centralise les appels API vers /api/reviews.
 */
export class ReviewService {
  /**
   * Récupère toutes les reviews d'un jeu.
   * @param gameId - L'identifiant du jeu
   * @returns Les reviews, la note moyenne, et le statut de l'utilisateur
   */
  static async fetchReviews(gameId: string): Promise<ReviewsResponse> {
    const response = await fetch(`/api/reviews?gameId=${encodeURIComponent(gameId)}`);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to fetch reviews");
    }

    return response.json();
  }

  /**
   * Soumet une nouvelle review pour un jeu.
   * @param gameId - L'identifiant du jeu
   * @param data - Les données du formulaire de review
   * @returns La réponse de l'API avec la review créée
   */
  static async submitReview(gameId: string, data: ReviewFormData): Promise<{ success: boolean }> {
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, ...data }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to submit review");
    }

    return response.json();
  }

  /**
   * Met à jour une review existante pour un jeu.
   */
  static async updateReview(gameId: string, data: ReviewFormData): Promise<{ success: boolean }> {
    const response = await fetch("/api/reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, ...data }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to update review");
    }

    return response.json();
  }
}
