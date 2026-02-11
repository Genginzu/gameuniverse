// Types pour l'administration des langues

export interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string | null;
}

export interface FetchLanguagesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
