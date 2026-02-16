// Types pour l'administration des avis (reviews)

/** Review telle qu'affichée dans la liste admin */
export interface AdminReview {
  id: string;
  rating: number;
  contentExcerpt: string;
  createdAt: string;
  updatedAt: string;
  playerName: string | null;
  playerEmail: string | null;
  gameTitle: string;
  gameId: string;
}

/** Review complète pour le formulaire d'édition admin */
export interface AdminReviewDetail {
  id: string;
  userId: string;
  gameId: string;
  rating: number;
  content: string;
  positivePoints: string[];
  negativePoints: string[];
  createdAt: string;
  updatedAt: string;
  playerName: string | null;
  gameTitle: string;
}

/** Paramètres de requête pour la liste admin */
export interface FetchAdminReviewsParams {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
