// Types pour l'administration des rôles de personnages

export interface RoleTranslation {
  language_code: string;
  name: string;
  description: string;
}

export interface AdminRole {
  id: string;
  slug: string;
  characterCount: number;
  translations: RoleTranslation[];
}

export interface FetchRolesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  locale?: string;
}
