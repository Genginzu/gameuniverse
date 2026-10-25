/** Types of the IGDB metadata shown on a game page (themes, franchises, websites…). */

/** Minimal card data of a game linked from a game page (similar, same franchise). */
export interface RelatedGameCard {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  genres: Array<{ name: string }>;
  developer: string;
  metascore: number | null;
  releaseDate?: string | null;
}

/** IGDB taxonomy shown on a game page (theme, mode, perspective, engine). */
export interface GameTaxonomyTag {
  igdbId: number | null;
  slug: string;
  name: string;
}

/** Franchise or IGDB series a game belongs to. */
export interface GameFranchiseLink {
  kind: "franchise" | "series";
  slug: string;
  name: string;
}

export interface GameWebsite {
  url: string;
  /** IGDB website type id (1 official, 13 Steam…), null = other. */
  typeId: number | null;
  trusted: boolean;
}

export interface GameMultiplayerMode {
  platformName: string | null;
  campaignCoop: boolean;
  dropIn: boolean;
  lanCoop: boolean;
  offlineCoop: boolean;
  offlineCoopMax: number | null;
  offlineMax: number | null;
  onlineCoop: boolean;
  onlineCoopMax: number | null;
  onlineMax: number | null;
  splitscreen: boolean;
  splitscreenOnline: boolean;
}

/** IGDB metadata of a game page. */
export interface GameDetailMetadata {
  themes: GameTaxonomyTag[];
  gameModes: GameTaxonomyTag[];
  playerPerspectives: GameTaxonomyTag[];
  gameEngines: GameTaxonomyTag[];
  franchises: GameFranchiseLink[];
  websites: GameWebsite[];
  multiplayerModes: GameMultiplayerMode[];
  /** Other games of the same franchises / series, by release date. */
  franchiseGames: RelatedGameCard[];
}


/** Option of an IGDB metadata filter of the games listing. */
export interface MetadataFilterOption {
  slug: string;
  igdbId: number | null;
  name: string;
}

/**
 * Options of the games listing metadata filters (`GET /api/game-metadata`).
 * Engines and franchises are too many to list: only the requested slugs are
 * resolved, to label the active filter chips.
 */
export interface GameMetadataFilterOptions {
  themes: MetadataFilterOption[];
  gameModes: MetadataFilterOption[];
  perspectives: MetadataFilterOption[];
  engines: MetadataFilterOption[];
  franchises: MetadataFilterOption[];
}


/** Selected IGDB metadata filters of the games listing (slugs). */
export interface MetadataFilterSelection {
  themes: string[];
  gameModes: string[];
  perspectives: string[];
  engines: string[];
  franchises: string[];
}


/** Reference row of the admin game form metadata pickers (`/api/admin/game-metadata`). */
export interface AdminMetadataOption {
  id: string;
  igdb_id: number | null;
  name: string | null;
}

export interface AdminMetadataOptions {
  themes: AdminMetadataOption[];
  game_modes: AdminMetadataOption[];
  player_perspectives: AdminMetadataOption[];
}

export type AdminMetadataSearchKind = "franchises" | "series" | "game_engines" | "keywords";
