// Types pour l'onglet activité du profil joueur
// Agrège les événements d'activité (reviews, commentaires, bibliothèque, etc.)

/** Types d'événements d'activité */
export type ActivityEventType =
  | "review"
  | "comment"
  | "library"
  | "playtime"
  | "favorite"
  | "collection"
  | "friendship"
  | "session";

/** Données d'une review publiée */
export interface ReviewEventData {
  type: "review";
  gameId: string;
  gameSlug: string;
  gameName: string;
  rating: number;
  contentExcerpt: string;
}

/** Données d'un commentaire publié */
export interface CommentEventData {
  type: "comment";
  characterId: string;
  characterSlug: string;
  characterName: string;
  contentExcerpt: string;
}

/** Données d'un ajout à la bibliothèque */
export interface LibraryEventData {
  type: "library";
  gameId: string;
  gameSlug: string;
  gameName: string;
  coverImage: string | null;
  status: string;
}

/** Données d'un temps de jeu renseigné */
export interface PlaytimeEventData {
  type: "playtime";
  gameId: string;
  gameSlug: string;
  gameName: string;
  playTimeHastily: number | null;
  playTimeNormally: number | null;
  playTimeCompletely: number | null;
}

/** Données d'un personnage mis en favori */
export interface FavoriteEventData {
  type: "favorite";
  characterId: string;
  characterSlug: string;
  characterName: string;
}

/** Données d'une collection créée */
export interface CollectionEventData {
  type: "collection";
  collectionId: string;
  collectionSlug: string;
  collectionName: string;
  gamesCount: number;
}

/** Données d'un événement d'amitié (envoi, acceptation, suppression) */
export interface FriendshipEventData {
  type: "friendship";
  friendId: string;
  friendName: string;
  friendAvatarUrl: string | null;
  action: "request_sent" | "request_accepted" | "friend_removed";
}

/** Données d'une session de jeu (issue #2) */
export interface SessionEventData {
  type: "session";
  gameId: string;
  gameSlug: string;
  gameName: string;
  coverImage: string | null;
  durationMinutes: number;
  startedAt: string;
}

/** Union discriminée des données par type d'événement */
export type ActivityEventData =
  | ReviewEventData
  | CommentEventData
  | LibraryEventData
  | PlaytimeEventData
  | FavoriteEventData
  | CollectionEventData
  | FriendshipEventData
  | SessionEventData;

/** Événement d'activité générique */
export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  date: string; // ISO 8601
  data: ActivityEventData;
}

/** Réponse de l'API d'activité */
export interface ActivityResponse {
  events: ActivityEvent[];
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

/** Paramètres de requête pour l'API d'activité */
export interface ActivityQueryParams {
  page?: number;
  type?: ActivityEventType;
  locale?: string;
}
