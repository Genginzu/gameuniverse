export interface CharacterMedia {
  mainImage?: string;
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

export interface CharacterGame {
  id: string;
  slug: string;
  title: string;
  coverImage?: string;
  releaseYear?: number;
  isPrimary: boolean;
}

export interface CharacterDetails {
  id: string;
  slug: string;
  name: string;
  role?: string;
  description?: string;
  biography?: string;
  backgroundColor?: string;
  games: CharacterGame[];
  primaryGame: string; // Nom du jeu principal
  media: CharacterMedia;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterSummary {
  id: string;
  slug: string;
  name: string;
  role?: string;
  description?: string;
  mainImage?: string;
  backgroundColor?: string;
  primaryGame: string;
  gamesCount: number;
}

export interface CharacterFilters {
  search?: string;
  games?: string[];
  roles?: string[];
}
