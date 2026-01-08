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

export interface GameDetails {
  id: string;
  slug: string;
  title: string;
  description?: string;
  releaseDate?: string;
  releaseYear?: number;
  metascore?: number;
  systemRequirements?: Record<string, any> | null;
  backgroundColor?: string;
  genres: GameGenre[];
  companies: GameCompanies;
  developer: string;
  publisher: string;
  media: GameMedia;
  ageRating?: GameRating;
  pricing: GamePricing[];
  createdAt: string;
  updatedAt: string;
}

export interface GameSummary {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  releaseDate?: string;
  releaseYear?: number;
  genres: Array<{ name: string; id?: string }>;
  developer: string;
  publisher: string;
  metascore?: number;
}
