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
