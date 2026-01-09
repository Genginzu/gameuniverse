// Types pour les APIs et les erreurs Supabase

export interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

// Types pour les réponses d'API
export interface ApiResponse<T> {
  data?: T;
  error?: SupabaseError | null;
}

// Types pour les paramètres de requête
export interface GameQueryParams {
  locale?: string;
  page?: number;
  limit?: number;
  genre?: string;
  search?: string;
}

export interface GenreQueryParams {
  locale?: string;
}
