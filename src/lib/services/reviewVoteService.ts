import type { VoteType } from "@/types/review";

/**
 * Service pour la gestion des votes sur les reviews.
 * Centralise les appels API vers /api/review-votes.
 */
export class ReviewVoteService {
  /**
   * Soumet ou modifie un vote sur une review.
   * Si le vote est identique au vote existant, il est supprimé (toggle).
   * @param reviewId - L'identifiant de la review
   * @param voteType - Le type de vote ("helpful" ou "not_helpful")
   * @returns Le vote résultant (null si supprimé par toggle)
   */
  static async submitVote(
    reviewId: string,
    voteType: VoteType
  ): Promise<{ vote: VoteType | null }> {
    const response = await fetch("/api/review-votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, voteType }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to submit vote");
    }

    return response.json();
  }

  /**
   * Supprime le vote de l'utilisateur courant sur une review.
   * @param reviewId - L'identifiant de la review
   */
  static async removeVote(reviewId: string): Promise<void> {
    const response = await fetch("/api/review-votes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to remove vote");
    }
  }
}
