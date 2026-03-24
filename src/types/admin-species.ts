// Types pour l'administration des espèces de personnages

export interface AdminSpecies {
  id: string;
  slug: string;
  igdbId: number | null;
  name: string; // resolved name for current locale (used in list display)
  updatedAt: string;
}

export interface SpeciesTranslation {
  language_code: string;
  name: string;
}

export interface SpeciesPayload {
  slug: string;
  igdb_id?: number | null;
  translations: SpeciesTranslation[];
}
