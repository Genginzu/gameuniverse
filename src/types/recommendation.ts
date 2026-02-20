/** Résultat de recommandation pour un jeu */
export interface GameRecommendation {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  genres: Array<{ id: string; name: string }>;
  developer: string;
  metascore: number | null;
  combinedScore: number;
}

/** Réponse de l'API de recommandations */
export interface RecommendationsResponse {
  recommendations: GameRecommendation[];
  sourceGameId: string;
  generatedAt: string;
}

/** Réponse de l'API de recommandations personnalisées */
export interface PersonalRecommendationsResponse {
  recommendations: GameRecommendation[];
  basedOnGameCount: number;
  generatedAt: string;
}

/** Configuration des poids de scoring */
export interface ScoringWeights {
  genre: number;
  collaborative: number;
  review: number;
  metacritic: number;
}

/** Scores individuels d'un candidat */
export interface CandidateScores {
  genreScore: number;
  collaborativeScore: number;
  reviewScore: number;
  /** null when the candidate game has no metascore — signal is excluded from weighting */
  metacriticScore: number | null;
}
