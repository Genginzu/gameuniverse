// Types pour l'administration des classifications d'âge

export interface AdminRatingSystem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  country_codes: string[];
  website_url: string | null;
  ratingsCount: number;
  descriptorsCount: number;
}

export interface RatingTranslation {
  language_code: string;
  description: string;
}

export interface AdminRating {
  id: string;
  rating_system_id: string;
  code: string;
  display_name: string;
  minimum_age: number;
  color_hex: string | null;
  icon_url: string | null;
  translations: RatingTranslation[];
  sort_order: number;
  gameCount: number;
}

export interface ContentDescriptorTranslation {
  language_code: string;
  name: string;
  description: string;
}

export interface AdminContentDescriptor {
  id: string;
  rating_system_id: string;
  code: string;
  icon_url: string | null;
  translations: ContentDescriptorTranslation[];
  gameCount: number;
}

export interface FetchRatingSystemsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FetchRatingsParams {
  ratingSystemId: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FetchDescriptorsParams {
  ratingSystemId: string;
  page?: number;
  limit?: number;
  search?: string;
  locale?: string;
}
