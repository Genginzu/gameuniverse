import type { CommentFormData, CommentsResponse } from "@/types/comment";

/**
 * Service pour la gestion des commentaires de personnages.
 * Centralise les appels API vers /api/comments.
 */
export class CommentService {
  /**
   * Récupère tous les commentaires d'un personnage.
   * @param characterId - L'identifiant du personnage
   * @returns Les commentaires, le total et le statut de l'utilisateur
   */
  static async fetchComments(characterId: string): Promise<CommentsResponse> {
    const response = await fetch(`/api/comments?characterId=${encodeURIComponent(characterId)}`);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to fetch comments");
    }

    return response.json();
  }

  /**
   * Soumet un nouveau commentaire pour un personnage.
   * @param characterId - L'identifiant du personnage
   * @param data - Les données du formulaire de commentaire
   * @returns La réponse de l'API avec le commentaire créé
   */
  static async submitComment(
    characterId: string,
    data: CommentFormData
  ): Promise<{ success: boolean }> {
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, ...data }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to submit comment");
    }

    return response.json();
  }

  /**
   * Met à jour un commentaire existant pour un personnage.
   */
  static async updateComment(
    characterId: string,
    data: CommentFormData
  ): Promise<{ success: boolean }> {
    const response = await fetch("/api/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, ...data }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to update comment");
    }

    return response.json();
  }
}
