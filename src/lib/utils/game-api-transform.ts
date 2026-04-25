/**
 * Transforms raw game API responses into AdminGameFormData.
 * Used by the edit page for initial load and post-sync refresh.
 */

import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import type { Company } from "@/types/admin-games";

export interface GameApiResponse {
  id: string;
  slug: string;
  igdb_id: number | null;
  cover_image_url: string | null;
  background_image_url: string | null;
  background_color: string | null;
  accent_color: string | null;
  label_color: string | null;
  text_color: string | null;
  release_date: string | null;
  metascore: number | null;
  playtime_hastily: number | null;
  playtime_normally: number | null;
  playtime_completely: number | null;
  translations: Array<{
    language_code: string;
    title: string;
    description: string | null;
    storyline: string | null;
  }>;
  genres: Array<{ genre_id: string }>;
  companies: Array<{
    company_id: string;
    role: string;
    is_primary: boolean;
    company?: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  screenshots: Array<{
    url: string;
    alt_text: string | null;
    caption: string | null;
    display_order: number | null;
    is_featured: boolean;
  }>;
  artwork: Array<{
    url: string;
    alt_text: string | null;
    caption: string | null;
    artwork_type: string | null;
    display_order: number | null;
    is_featured: boolean;
  }>;
  game_ratings: Array<{
    rating_id: string;
    is_primary: boolean;
    content_descriptors: string[];
  }>;
  versions: Array<{
    version_title: string;
    description: string | null;
    cover_image_url: string | null;
    display_order: number | null;
    translations?: Array<{
      language_code: string;
      title: string;
      description: string | null;
    }>;
  }>;
  languages: Array<{
    language_code: string;
    language_name: string;
    has_audio: boolean;
    has_subtitles: boolean;
    has_interface: boolean;
  }>;
  prices: Array<{
    store_id: string;
    price: number;
    currency: string;
    platform: string;
    store_url: string | null;
    is_available: boolean;
  }>;
  game_platforms: Array<{ platform_id: string }>;
  videos: Array<{
    url: string;
    title: string | null;
    thumbnail_url: string | null;
    video_type: string | null;
    display_order: number | null;
    is_featured: boolean;
  }>;
  music?: {
    composer: string | null;
    spotify_embed_url: string | null;
    youtube_video_url: string | null;
  } | null;
  is_esport?: boolean;
}

/** Convert a raw API game response to the form's data shape */
export function toFormData(game: GameApiResponse): AdminGameFormData {
  return {
    slug: game.slug,
    translations: game.translations.map((t) => ({
      language_code: t.language_code,
      title: t.title,
      description: t.description ?? "",
      storyline: t.storyline ?? "",
    })),
    cover_image_url: game.cover_image_url ?? "",
    background_image_url: game.background_image_url ?? "",
    background_color: game.background_color ?? "",
    accent_color: game.accent_color ?? "",
    label_color: game.label_color ?? "",
    text_color: game.text_color ?? "",
    release_date: game.release_date ?? "",
    metascore: game.metascore ?? "",
    playtime_hastily: game.playtime_hastily ?? "",
    playtime_normally: game.playtime_normally ?? "",
    playtime_completely: game.playtime_completely ?? "",
    genres: game.genres.map((g) => ({ genre_id: g.genre_id })),
    companies: game.companies.map((c) => ({
      company_id: c.company_id,
      role: c.role as "developer" | "publisher",
      is_primary: c.is_primary,
    })),
    screenshots: (game.screenshots ?? []).map((s) => ({
      url: s.url,
      alt_text: s.alt_text ?? "",
      caption: s.caption ?? "",
      display_order: s.display_order,
      is_featured: s.is_featured,
    })),
    artwork: (game.artwork ?? []).map((a) => ({
      url: a.url,
      alt_text: a.alt_text ?? "",
      caption: a.caption ?? "",
      artwork_type: a.artwork_type ?? "",
      display_order: a.display_order,
      is_featured: a.is_featured,
    })),
    age_ratings: (game.game_ratings ?? []).map((r) => ({
      rating_id: r.rating_id,
      is_primary: r.is_primary,
      content_descriptors: r.content_descriptors ?? [],
    })),
    versions: (game.versions ?? []).map((v) => ({
      version_title: v.version_title,
      description: v.description ?? "",
      cover_image_url: v.cover_image_url ?? "",
      display_order: v.display_order,
      translations: (v.translations ?? []).map((t) => ({
        language_code: t.language_code,
        title: t.title ?? "",
        description: t.description ?? "",
      })),
    })),
    languages: (game.languages ?? []).map((l) => ({
      language_code: l.language_code,
      language_name: l.language_name,
      has_audio: l.has_audio,
      has_subtitles: l.has_subtitles,
      has_interface: l.has_interface,
    })),
    prices: (game.prices ?? []).map((p) => ({
      store_id: p.store_id,
      price: p.price,
      currency: p.currency,
      platform: p.platform,
      store_url: p.store_url ?? "",
      is_available: p.is_available,
    })),
    game_platforms: (game.game_platforms ?? []).map((gp) => ({
      platform_id: gp.platform_id,
    })),
    videos: (game.videos ?? []).map((v) => ({
      url: v.url,
      title: v.title ?? "",
      thumbnail_url: v.thumbnail_url ?? "",
      video_type: v.video_type ?? "",
      display_order: v.display_order,
      is_featured: v.is_featured,
    })),
    music_composer: game.music?.composer ?? "",
    music_spotify_embed_url: game.music?.spotify_embed_url ?? "",
    music_youtube_video_url: game.music?.youtube_video_url ?? "",
    is_esport: game.is_esport ?? false,
  };
}

/**
 * Extract companies with their names from the API response.
 * Used to enrich the reference company list so that assigned companies
 * always appear even if they are inactive or missing from reference data.
 */
export function extractCompaniesFromApi(game: GameApiResponse): Company[] {
  return game.companies
    .filter((c) => c.company?.id && c.company?.name)
    .map((c) => ({
      id: c.company!.id,
      name: c.company!.name,
      slug: c.company!.slug ?? "",
    }));
}
