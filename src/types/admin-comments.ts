// Types pour l'administration des commentaires sur les personnages

/** Commentaire tel qu'affiché dans la liste admin */
export interface AdminComment {
  id: string;
  contentExcerpt: string;
  createdAt: string;
  updatedAt: string;
  playerName: string | null;
  playerEmail: string | null;
  characterName: string;
  characterId: string;
}

/** Commentaire complet pour le formulaire d'édition admin */
export interface AdminCommentDetail {
  id: string;
  userId: string;
  characterId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  playerName: string | null;
  characterName: string;
}

/** Paramètres de requête pour la liste admin */
export interface FetchAdminCommentsParams {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
