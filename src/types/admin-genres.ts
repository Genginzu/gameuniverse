// Types pour l'administration des genres

export interface GenreTranslation {
  language_code: string;
  name: string;
  description: string;
}

export interface AdminGenre {
  id: string;
  slug: string;
  gameCount: number;
  translations: GenreTranslation[];
}

export interface FetchGenresParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  locale?: string;
}
