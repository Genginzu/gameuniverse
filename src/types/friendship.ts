/** Statut d'une relation d'amitié */
export type FriendshipStatus = "pending" | "accepted" | "declined";

/** Statut de relation entre le joueur courant et un joueur cible */
export type RelationshipStatus =
  | "none"
  | "pending_sent" // demande envoyée par le joueur courant
  | "pending_received" // demande reçue par le joueur courant
  | "accepted"; // amis confirmés

/** Résumé d'un ami pour l'affichage dans la liste */
export interface FriendSummary {
  id: string; // ID du profil de l'ami
  friendshipId: string; // ID de la ligne friendships
  displayName: string;
  avatarUrl: string | null;
  level: number;
  acceptedAt: string; // ISO 8601
}

/** Demande d'amitié en attente */
export interface FriendRequest {
  friendshipId: string;
  sender: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  createdAt: string; // ISO 8601
}

/** Réponse de l'API pour la liste d'amis */
export interface FriendsListResponse {
  friends: FriendSummary[];
  totalCount: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
  pendingRequests?: FriendRequest[]; // uniquement pour le propriétaire
}

/** Réponse de l'API pour le statut de relation */
export interface RelationshipStatusResponse {
  status: RelationshipStatus;
  friendshipId?: string; // présent si relation existe
}

/** Paramètres de requête pour la liste d'amis */
export interface FriendsQueryParams {
  page?: number;
  limit?: number;
}
