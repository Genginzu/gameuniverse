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

export interface GameVersion {
  id: string;
  igdbId: number;
  title: string;
  description?: string | null;
  coverImageUrl: string | null;
}

export interface GameDetails {
  id: string;
  slug: string;
  title: string;
  description?: string;
  releaseDate?: string;
  releaseYear?: number;
  metascore?: number;
  systemRequirements?: Record<string, unknown> | null;
  backgroundColor?: string;
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
  createdAt: string;
  updatedAt: string;
  igdbId?: number;
  lastSyncedAt?: string;
  versions?: GameVersion[];
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
}
