// Types pour les données brutes de la base de données Supabase

export interface DatabaseGameGenre {
  id: string;
  slug: string;
  genre_translations: Array<{
    name: string;
    description: string | null;
    language_code?: string;
  }>;
}

export interface DatabaseCompanyTranslation {
  language_code: string;
  description: string | null;
}

export interface DatabaseGameCompany {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  company_translations?: DatabaseCompanyTranslation[];
}

export interface DatabaseGameCompanyRelation {
  role: string;
  is_primary: boolean | null;
  companies: DatabaseGameCompany;
}

export interface DatabaseGameScreenshot {
  id: string;
  url: string;
  alt_text: string | null;
  caption: string | null;
  display_order: number | null;
  is_featured: boolean | null;
}

export interface DatabaseGameArtwork {
  id: string;
  url: string;
  alt_text: string | null;
  caption: string | null;
  artwork_type: string | null;
  display_order: number | null;
  is_featured: boolean | null;
}

export interface DatabaseGameVideo {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  video_type: string | null;
  duration_seconds: number | null;
  display_order: number | null;
  is_featured: boolean | null;
}

export interface DatabaseGameRating {
  is_primary: boolean | null;
  assigned_date: string | null;
  ratings: {
    code: string;
    display_name: string;
    minimum_age: number | null;
    color_hex: string | null;
    icon_url: string | null;
    rating_systems: {
      name: string;
      code: string;
    } | null;
  } | null;
  game_rating_descriptors: Array<{
    content_descriptors: {
      code: string;
      content_descriptor_translations: Array<{
        name: string;
        description: string | null;
      }>;
    };
  }>;
}

export interface DatabaseGamePrice {
  price: number;
  currency: string;
  platform: string;
  is_available: boolean | null;
  last_updated: string | null;
  store_url: string | null;
  stores: {
    name: string;
    logo_url: string | null;
    website_url: string | null;
  };
}

export interface DatabaseGameData {
  id: string;
  slug: string;
  igdb_id: number | null;
  last_synced_at: string | null;
  cover_image_url: string | null;
  background_image_url: string | null;
  background_color: string | null;
  accent_color: string | null;
  label_color: string | null;
  text_color: string | null;
  release_date: string | null;
  metascore: number | null;
  system_requirements: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  game_translations: Array<{
    title: string;
    description: string | null;
    storyline: string | null;
    language_code?: string;
  }>;
  game_genres: Array<{
    genres: DatabaseGameGenre;
  }>;
  game_companies: DatabaseGameCompanyRelation[];
  game_screenshots: DatabaseGameScreenshot[];
  game_artwork: DatabaseGameArtwork[];
  game_videos: DatabaseGameVideo[];
  game_ratings: DatabaseGameRating[];
  game_prices: DatabaseGamePrice[];
}
