/** Résumé d'une plateforme (utilisé dans CharacterDetails) */
export interface PlatformSummary {
  id: string;
  slug: string;
  name: string;
  abbreviation?: string;
  iconUrl?: string;
}

/** Plateforme associée à un jeu (utilisé dans GameDetails) */
export interface GamePlatform {
  id: string;
  slug: string;
  name: string;
  abbreviation?: string;
  iconUrl?: string;
}

/** Plateforme résumée pour les listings de jeux (utilisé dans GameSummary) */
export interface GameSummaryPlatform {
  name: string;
  slug: string;
}
