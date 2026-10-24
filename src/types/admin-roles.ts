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
