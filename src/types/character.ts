import type { PlatformSummary } from "@/types/platform";

export interface CharacterRelationship {
  id: string;
  relatedCharacter: {
    id: string;
    slug: string;
    name: string;
    mainImage?: string;
    role?: string;
  };
  relationshipType: string; // ally, enemy, rival, family, romantic, mentor, friend
  description?: string;
}

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
  backgroundImage?: string;
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
  weapons?: string;
  backgroundColor?: string;
  gender?: { id: string; slug: string; name: string };
  species?: { id: string; slug: string; name: string };
  games: CharacterGame[];
  primaryGame: string;
  media: CharacterMedia;
  relationships: CharacterRelationship[];
  platforms: PlatformSummary[];
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
  gender?: { id: string; slug: string; name: string };
  species?: { id: string; slug: string; name: string };
  primaryGame: string;
  gamesCount: number;
}

export interface CharacterFilters {
  search?: string;
  games?: string[];
  roles?: string[];
}

/** Option de rôle pour les filtres (avec compteur de personnages) */
export interface RoleFilterOption {
  id: string;
  slug: string;
  name: string;
  characterCount: number;
}

export interface CharacterFavoriteSummary {
  id: string;
  slug: string;
  name: string;
  role?: string;
  mainImage?: string;
  backgroundColor?: string;
  primaryGame: string;
  favoritedAt: string;
}
