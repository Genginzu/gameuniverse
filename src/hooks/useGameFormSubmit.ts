import { generateSlugFromTitle } from "@/lib/utils/slug-utils";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";

/**
 * Builds the API payload from form data for game creation/editing
 */
export function buildGamePayload(data: AdminGameFormData, mode: "create" | "edit") {
  const validTranslations = data.translations
    .filter((t) => t.title && t.title.trim().length > 0)
    .map((t) => ({
      language_code: t.language_code,
      title: t.title!,
      description: t.description || null,
    }));

  const toNum = (v: unknown) =>
    v === "" || v === undefined || v === null ? null : Number(v);

  const metascoreValue =
    data.metascore === "" || data.metascore === undefined || data.metascore === null
      ? null
      : Number(data.metascore);

  return {
    game: {
      slug:
        mode === "edit"
          ? data.slug
          : generateSlugFromTitle(validTranslations[0]?.title || "untitled"),
      cover_image_url: data.cover_image_url || null,
      background_image_url: data.background_image_url || null,
      background_color: data.background_color || null,
      accent_color: data.accent_color || null,
      label_color: data.label_color || null,
      text_color: data.text_color || null,
      release_date: data.release_date || null,
      metascore: metascoreValue,
      playtime_hastily: toNum(data.playtime_hastily),
      playtime_normally: toNum(data.playtime_normally),
      playtime_completely: toNum(data.playtime_completely),
    },
    translations: validTranslations,
    genres: data.genres,
    companies: data.companies,
    screenshots: data.screenshots
      .filter((s) => s.url.trim().length > 0)
      .map((s, i) => ({
        url: s.url,
        alt_text: s.alt_text || null,
        caption: s.caption || null,
        display_order: i,
        is_featured: s.is_featured,
      })),
    artwork: data.artwork
      .filter((a) => a.url.trim().length > 0)
      .map((a, i) => ({
        url: a.url,
        alt_text: a.alt_text || null,
        caption: a.caption || null,
        artwork_type: a.artwork_type || null,
        display_order: i,
        is_featured: a.is_featured,
      })),
    age_ratings: data.age_ratings,
    versions: data.versions
      .filter((v) => v.version_title.trim().length > 0)
      .map((v, i) => ({
        version_title: v.version_title,
        description: v.description || null,
        cover_image_url: v.cover_image_url || null,
        display_order: i,
        translations: (v.translations ?? [])
          .filter((t) => t.title || t.description)
          .map((t) => ({
            language_code: t.language_code,
            title: t.title || null,
            description: t.description || null,
          })),
      })),
    languages: data.languages
      .filter((l) => l.language_code.trim().length > 0 && l.language_name.trim().length > 0)
      .map((l) => ({
        language_code: l.language_code,
        language_name: l.language_name,
        has_audio: l.has_audio,
        has_subtitles: l.has_subtitles,
        has_interface: l.has_interface,
      })),
    prices: data.prices.map((p) => ({
      store_id: p.store_id,
      price: p.price,
      currency: p.currency,
      platform: p.platform,
      store_url: p.store_url || null,
      is_available: p.is_available,
    })),
    music: {
      composer: data.music_composer || null,
      spotify_embed_url: data.music_spotify_embed_url || null,
      youtube_video_url: data.music_youtube_video_url || null,
    },
    game_platforms: data.game_platforms,
  };
}
