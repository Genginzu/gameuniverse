// Types pour l'administration des genres de personnages

export interface AdminGender {
  id: string;
  slug: string;
  igdbId: number | null;
  name: string; // resolved name for current locale (used in list display)
  updatedAt: string;
}

export interface GenderTranslation {
  language_code: string;
  name: string;
}

export interface GenderPayload {
  slug: string;
  igdb_id?: number | null;
  translations: GenderTranslation[];
}
