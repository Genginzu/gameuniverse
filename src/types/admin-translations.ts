// Types partagés pour la gestion des traductions admin

export type { PaginationInfo } from "./pagination";

/** Les 10 types d'entités traduisibles */
export type EntityType =
  | "games"
  | "characters"
  | "genres"
  | "companies"
  | "platforms"
  | "character_roles"
  | "genders"
  | "species"
  | "content_descriptors"
  | "ratings";

/** Statut de traduction d'une entité */
export type TranslationStatus = "missing" | "partial" | "complete";

/** Champs obligatoires par type d'entité */
export const REQUIRED_FIELDS: Record<EntityType, string[]> = {
  games: ["title", "description"],
  characters: ["name", "description"],
  genres: ["name"],
  companies: ["description"],
  platforms: ["name"],
  character_roles: ["name"],
  genders: ["name"],
  species: ["name"],
  content_descriptors: ["name"],
  ratings: ["description"],
};

/** Tous les champs éditables par type d'entité (pour la modale de relecture) */
export const EDITABLE_FIELDS: Record<EntityType, string[]> = {
  games: ["title", "description", "storyline"],
  characters: ["name", "description", "biography"],
  genres: ["name", "description"],
  companies: ["description"],
  platforms: ["name", "abbreviation"],
  character_roles: ["name", "description"],
  genders: ["name"],
  species: ["name"],
  content_descriptors: ["name", "description"],
  ratings: ["description"],
};

/** Mapping type d'entité → nom de la table de traduction */
export const TRANSLATION_TABLE_MAP: Record<EntityType, string> = {
  games: "game_translations",
  characters: "character_translations",
  genres: "genre_translations",
  companies: "company_translations",
  platforms: "platform_translations",
  character_roles: "character_role_translations",
  genders: "gender_translations",
  species: "species_translations",
  content_descriptors: "content_descriptor_translations",
  ratings: "rating_translations",
};

/** Mapping type d'entité → nom de la table parente */
export const ENTITY_TABLE_MAP: Record<EntityType, string> = {
  games: "games",
  characters: "characters",
  genres: "genres",
  companies: "companies",
  platforms: "platforms",
  character_roles: "character_roles",
  genders: "genders",
  species: "species",
  content_descriptors: "content_descriptors",
  ratings: "ratings",
};

/** Mapping type d'entité → nom de la colonne FK dans la table de traduction */
export const FK_COLUMN_MAP: Record<EntityType, string> = {
  games: "game_id",
  characters: "character_id",
  genres: "genre_id",
  companies: "company_id",
  platforms: "platform_id",
  character_roles: "role_id",
  genders: "gender_id",
  species: "species_id",
  content_descriptors: "content_descriptor_id",
  ratings: "rating_id",
};

/** Mapping type d'entité → champ d'identification lisible (slug, code, etc.) */
export const IDENTIFIER_FIELD_MAP: Record<EntityType, string> = {
  games: "slug",
  characters: "slug",
  genres: "slug",
  companies: "slug",
  platforms: "slug",
  character_roles: "slug",
  genders: "slug",
  species: "slug",
  content_descriptors: "code",
  ratings: "code",
};

/** Élément avec traduction manquante retourné par l'API */
export interface TranslationMissingItem {
  entityId: string;
  identifier: string;
  sourceText: Record<string, string>;
  sourceLang: string;
  /** Languages that still need translation */
  missingLangs: string[];
}

/** Statistiques de traduction pour un type d'entité et une langue */
export interface TranslationStats {
  entityType: EntityType;
  language: string;
  total: number;
  complete: number;
  partial: number;
  missing: number;
  percentage: number;
}

/** Détail des traductions d'une entité par langue */
export interface EntityTranslationLangDetail {
  language: string;
  status: TranslationStatus;
  fields: Record<string, string | null>;
}

/** Détail complet des traductions d'une entité */
export interface EntityTranslationDetail {
  entityId: string;
  identifier: string;
  languages: EntityTranslationLangDetail[];
}

/** Résultat d'une traduction individuelle */
export interface TranslateResult {
  entityId: string;
  translatedFields: Record<string, string>;
  saved: boolean;
}

/** Événement de progression pour le traitement par lot */
export interface BatchProgressEvent {
  entityId: string;
  status: "success" | "error";
  translatedFields?: Record<string, string>;
  error?: string;
}

/** Résumé du traitement par lot */
export interface BatchSummary {
  total: number;
  succeeded: number;
  failed: number;
}
