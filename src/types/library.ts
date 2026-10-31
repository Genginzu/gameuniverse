/** Status a player can give a game of their library. */
export type LibraryStatus = "owned" | "playing" | "completed" | "wishlist";

/** List a game card quick action puts a game in (or takes it out of). */
export type QuickAction = "library" | "wishlist";

/** Reactions of a caller to the quick add of a game card. */
export interface QuickAddCallbacks {
  /** The game is being added to `list` (optimistic, before the server confirms). */
  onAdd?: (list: QuickAction) => void;
  /** That addition failed (already rolled back and reported to the player). */
  onAddFailed?: (list: QuickAction) => void;
}

/** Statut « dans ma bibliothèque » d'un jeu (clé SWR `/api/library/{gameId}`) */
export interface LibraryStatusResponse {
  inLibrary: boolean;
  /** Library status; absent when the game is not in the library. */
  status?: LibraryStatus;
}

/** Game entry returned by `GET /api/library` for the current user. */
export interface LibraryGame {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  releaseDate?: string;
  releaseYear?: number;
  genres: Array<{ name: string; id?: string }>;
  developer: string;
  publisher: string;
  metascore?: number;
  libraryStatus: string;
  addedAt: string;
  playTimeHours: number;
  userRating?: number;
  notes?: string;
}

/** Aggregates returned by `GET /api/library/stats`. */
export interface LibraryStats {
  totalGames: number;
  ownedGames: number;
  completedGames: number;
  totalPlayTime: number;
  averageRating?: number;
}

export interface LibraryResponse {
  games: LibraryGame[];
}
