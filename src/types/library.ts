/** Statut « dans ma bibliothèque » d'un jeu (clé SWR `/api/library/{gameId}`) */
export interface LibraryStatusResponse {
  inLibrary: boolean;
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
