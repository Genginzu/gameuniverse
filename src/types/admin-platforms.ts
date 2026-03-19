/** Traduction d'une plateforme (FR/EN) */
export interface PlatformTranslation {
  language_code: string;
  name: string;
  abbreviation?: string;
}

/** Plateforme dans le panneau d'administration */
export interface AdminPlatform {
  id: string;
  slug: string;
  iconUrl?: string;
  gameCount: number;
  translations: PlatformTranslation[];
}

/** Paramètres de requête pour le listing admin des plateformes */
export interface FetchPlatformsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  locale?: string;
}
