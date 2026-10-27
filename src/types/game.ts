import type { GameDetailMetadata, RelatedGameCard } from "./game-metadata";
export type * from "./game-metadata";
import type { GamePlatform, GameSummaryPlatform } from "@/types/platform";
import type { Pagination } from "@/types/pagination";

export interface GameMedia {
  coverImage?: string;
  backgroundImage?: string;
  screenshots: Array<{
    id: string;
    url: string;
    altText?: string;
    caption?: string;
    isFeatured?: boolean;
  }>;
  artwork: Array<{
    id: string;
    url: string;
    altText?: string;
    caption?: string;
    type?: string;
    isFeatured?: boolean;
  }>;
  videos: Array<{
    id: string;
    title: string;
    description?: string;
    url: string;
    thumbnailUrl?: string;
    type?: string;
    duration?: number;
    isFeatured?: boolean;
  }>;
}

/** One entry of the game detail media viewer (screenshot or video). */
export type GameMediaViewerItem =
  | { kind: "image"; id: string; url: string; alt: string; caption?: string }
  | { kind: "video"; id: string; url: string; title: string; thumbnailUrl?: string };

export interface GamePricing {
  price: number;
  currency: string;
  platform: string;
  lastUpdated: string;
  storeUrl?: string;
  store: {
    name: string;
    logoUrl?: string;
    websiteUrl?: string;
  };
}

export interface GameRating {
  system: string;
  systemCode: string;
  rating: string;
  ratingCode: string;
  minimumAge?: number;
  colorHex?: string;
  iconUrl?: string;
  assignedDate?: string;
  isPrimary?: boolean;
  contentDescriptors: Array<{
    code: string;
    name: string;
    description?: string;
  }>;
}

export interface GameCompanies {
  developers: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    websiteUrl?: string;
    isPrimary: boolean;
  }>;
  publishers: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    websiteUrl?: string;
    isPrimary: boolean;
  }>;
}

export interface GameGenre {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

export interface GameLanguage {
  code: string;
  name: string;
  nativeName: string | null;
  hasAudio: boolean;
  hasSubtitles: boolean;
  hasInterface: boolean;
}

export interface GamePlaytime {
  hastily: number | null;
  normally: number | null;
  completely: number | null;
  lastUpdated?: string;
}

export interface GameMusic {
  composer?: string;
  spotifyEmbedUrl?: string;
  youtubeVideoUrl?: string;
}

/** Temps de jeu d'un joueur (3 catégories IGDB) */
export interface PlayerPlaytimeEntry {
  hastily: number | null;
  normally: number | null;
  completely: number | null;
}

/** Un contributeur avec son profil et ses temps */
export interface PlayerPlaytimeContributor {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  playtime: PlayerPlaytimeEntry;
}

/** Statistiques de temps de jeu des joueurs pour un jeu */
export interface PlayerPlaytimeStats {
  averages: PlayerPlaytimeEntry;
  count: number;
  userPlaytime: PlayerPlaytimeEntry | null;
  contributors: PlayerPlaytimeContributor[];
}

export interface GameVersion {
  id: string;
  igdbId: number;
  title: string;
  description?: string | null;
  coverImageUrl: string | null;
}

export type DlcExtensionCategory =
  | "dlc"
  | "expansion"
  | "bundle"
  | "mod"
  | "episode"
  | "season"
  | "remake"
  | "remaster"
  | "expanded_game"
  | "port"
  | "fork"
  | "pack"
  | "update";

export interface GameDlcExtension {
  id: string;
  igdbId: number;
  name: string;
  slug: string;
  summary: string | null;
  category: DlcExtensionCategory;
  coverImageUrl: string | null;
  releaseDate: string | null;
  gameSlug: string | null; // slug du jeu local si importé, pour le lien
}

/** Jeu similaire associé via IGDB similar_games */
export interface SimilarGame {
  igdbId: number;
  /** Données du jeu local si importé, null sinon */
  game: RelatedGameCard | null;
}

export interface GameDetails {
  id: string;
  slug: string;
  title: string;
  description?: string;
  storyline?: string;
  releaseDate?: string;
  releaseYear?: number;
  metascore?: number;
  systemRequirements?: Record<string, unknown> | null;
  backgroundColor?: string;
  accentColor?: string;
  labelColor?: string;
  textColor?: string;
  genres: GameGenre[];
  companies: GameCompanies;
  developer: string;
  publisher: string;
  media: GameMedia;
  ageRating?: GameRating;
  ageRatings?: GameRating[];
  pricing: GamePricing[];
  languages?: GameLanguage[];
  playtime?: GamePlaytime | null;
  music?: GameMusic | null;
  createdAt: string;
  updatedAt: string;
  igdbId?: number;
  lastSyncedAt?: string;
  versions?: GameVersion[];
  dlcExtensions?: GameDlcExtension[];
  similarGames?: SimilarGame[];
  platforms: GamePlatform[];
  isEsport?: boolean;
  /** IGDB metadata (themes, franchises, websites…); absent on older cached payloads. */
  metadata?: GameDetailMetadata;
}

export interface GameSummary {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  releaseDate?: string;
  releaseYear?: number;
  genres: Array<{ name: string; id?: string }>;
  developer: string;
  publisher: string;
  metascore?: number;
  igdbId?: number;
  source?: "local" | "igdb";
  platforms?: GameSummaryPlatform[];
  isEsport?: boolean;
}

export interface GamesApiResponse {
  games: GameSummary[];
  pagination: Pagination;
}

export interface UpcomingGamesResponse {
  games: GameSummary[];
  pagination: { currentPage: number; totalPages: number; totalCount: number };
}

export interface TrendingGamesData {
  /** Popularity weighted by release recency (trending_score). */
  trendingNow: GameSummary[];
  mostViewed: GameSummary[];
  mostPopular: GameSummary[];
  bestRated: GameSummary[];
  recentlyAdded: GameSummary[];
}

export const GAME_LISTING_SORT_OPTIONS = [
  "recommended",
  "popularity",
  "activity",
  "rating",
  "recent",
] as const;

export type GameListingSort = (typeof GAME_LISTING_SORT_OPTIONS)[number];

export const DEFAULT_GAME_LISTING_SORT: GameListingSort = "recommended";

export function parseGameListingSort(value: string | null | undefined): GameListingSort {
  if (!value) return DEFAULT_GAME_LISTING_SORT;
  return (GAME_LISTING_SORT_OPTIONS as readonly string[]).includes(value)
    ? (value as GameListingSort)
    : DEFAULT_GAME_LISTING_SORT;
}
