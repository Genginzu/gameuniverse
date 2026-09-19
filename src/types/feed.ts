import type {
  ReviewEventData,
  PlaytimeEventData,
  CommentEventData,
  LibraryEventData,
  FavoriteEventData,
  CollectionEventData,
  FriendshipEventData,
  SessionEventData,
} from "./activity";

/** Auteur (acteur) d'un événement du fil d'actualité */
export interface FeedActor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

/** Données d'un post publié sur un profil */
export interface PostEventData {
  type: "post";
  postId: string;
  contentExcerpt: string;
}

/** Données d'un succès débloqué */
export interface AchievementEventData {
  type: "achievement";
  achievementKey: string;
  achievementName: string;
  achievementIcon: string;
  achievementDescription: string;
}

/** Types d'événements agrégés dans le fil d'actualité */
export type FeedEventType =
  | "review"
  | "post"
  | "comment"
  | "library"
  | "playtime"
  | "favorite"
  | "collection"
  | "friendship"
  | "session"
  | "achievement";

/** Données d'événement avec acteur intégré, discriminées par `type` */
export type FeedEventData =
  | (ReviewEventData & { actor: FeedActor })
  | (PostEventData & { actor: FeedActor })
  | (CommentEventData & { actor: FeedActor })
  | (LibraryEventData & { actor: FeedActor })
  | (PlaytimeEventData & { actor: FeedActor })
  | (FavoriteEventData & { actor: FeedActor })
  | (CollectionEventData & { actor: FeedActor })
  | (FriendshipEventData & { actor: FeedActor })
  | (SessionEventData & { actor: FeedActor })
  | (AchievementEventData & { actor: FeedActor });

/** Événement du fil d'actualité générique */
export interface FeedEvent {
  id: string;
  type: FeedEventType;
  date: string; // ISO 8601
  data: FeedEventData;
}

/** Réponse de l'API du fil d'actualité */
export interface FeedResponse {
  events: FeedEvent[];
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

/** Paramètres de requête pour l'API du fil d'actualité */
export interface FeedQueryParams {
  page?: number;
  type?: FeedEventType;
  locale?: string;
}
