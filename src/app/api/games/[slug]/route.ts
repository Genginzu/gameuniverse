import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { SupabaseError } from "@/types/api";
import { logger } from "@/lib/logger";
import { untypedTable } from "@/lib/utils/untypedTable";

// Inline types for the deeply-nested Supabase query result
interface DatabaseGameGenre {
  id?: string;
  slug?: string;
  genre_translations: Array<{ name: string; description?: string; language_code?: string }>;
}
interface DatabaseGameCompany {
  id?: string;
  name?: string;
  slug?: string;
  website_url?: string;
  company_translations?: Array<{ language_code?: string; description?: string }>;
}
interface DatabaseGameCompanyRelation {
  role: string;
  is_primary?: boolean;
  companies?: DatabaseGameCompany;
}
interface DatabaseGameScreenshot {
  id: string;
  url: string;
  alt_text?: string;
  caption?: string;
  display_order?: number;
  is_featured?: boolean;
}
interface DatabaseGameArtwork {
  id: string;
  url: string;
  alt_text?: string;
  caption?: string;
  artwork_type?: string;
  display_order?: number;
  is_featured?: boolean;
}
interface DatabaseGameVideo {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  video_type?: string;
  duration_seconds?: number;
  display_order?: number;
  is_featured?: boolean;
}
interface DatabaseGameRating {
  is_primary?: boolean;
  assigned_date?: string;
  ratings?: {
    code?: string;
    display_name?: string;
    minimum_age?: number;
    color_hex?: string;
    icon_url?: string;
    rating_systems?: { name?: string; code?: string };
  };
  game_rating_descriptors?: Array<{
    content_descriptors: {
      code: string;
      content_descriptor_translations: Array<{ name: string; description: string | null; language_code?: string }>;
    };
  }>;
}
interface DatabaseGamePrice {
  price: number;
  currency: string;
  platform: string;
  is_available?: boolean;
  last_updated?: string;
  store_url?: string;
  stores?: { name?: string; logo_url?: string; website_url?: string };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DatabaseGameData = Record<string, any>;

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";
    const { slug: gameSlug } = await params;

    if (!gameSlug) {
      return NextResponse.json({ error: "Game slug is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Fetch game details by slug with all related data (except languages which may not exist)
    // Use left join on translations so games with only 'en' translations still appear for 'fr' locale
    const { data: game, error } = (await supabase
      .from("games")
      .select(
        `
        id,
        slug,
        igdb_id,
        last_synced_at,
        cover_image_url,
        background_image_url,
        background_color,
        accent_color,
        label_color,
        text_color,
        release_date,
        metascore,
        system_requirements,
        created_at,
        updated_at,
        game_translations(
          title,
          description,
          storyline,
          language_code
        ),
        game_genres(
          genres(
            id,
            slug,
            genre_translations(
              name,
              description,
              language_code
            )
          )
        ),
        game_companies(
          role,
          is_primary,
          companies(
            id,
            name,
            slug,
            website_url,
            company_translations(
              language_code,
              description
            )
          )
        ),
        game_screenshots(
          id,
          url,
          alt_text,
          caption,
          display_order,
          is_featured
        ),
        game_artwork(
          id,
          url,
          alt_text,
          caption,
          artwork_type,
          display_order,
          is_featured
        ),
        game_videos(
          id,
          title,
          description,
          url,
          thumbnail_url,
          video_type,
          duration_seconds,
          display_order,
          is_featured
        ),
        game_ratings(
          is_primary,
          assigned_date,
          ratings(
            code,
            display_name,
            minimum_age,
            color_hex,
            icon_url,
            rating_systems(
              name,
              code
            )
          ),
          game_rating_descriptors(
            content_descriptors(
              code,
              content_descriptor_translations(
                name,
                description
              )
            )
          )
        ),
        game_prices(
          price,
          currency,
          platform,
          is_available,
          last_updated,
          store_url,
          stores(
            name,
            logo_url,
            website_url
          )
        )
      `
      )
      .eq("slug", gameSlug)
      .single()) as { data: DatabaseGameData | null; error: SupabaseError | null };

    if (error) {
      logger.error("Error fetching game details by slug", { error });
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch game details" }, { status: 500 });
    }

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Fetch languages separately (table may not exist yet)
    let gameLanguages: Array<{
      language_code: string;
      language_name: string;
      native_name: string | null;
      has_audio: boolean;
      has_subtitles: boolean;
      has_interface: boolean;
    }> = [];

    try {
      const { data: langData } = await supabase
        .from("game_languages")
        .select("language_code, language_name, has_audio, has_subtitles, has_interface")
        .eq("game_id", game.id);

      if (langData && langData.length > 0) {
        // Fetch supported_languages to get native_name
        const codes = langData.map((l) => l.language_code);
        const { data: supportedLangs } = await supabase
          .from("supported_languages")
          .select("code, name, native_name")
          .in("code", codes);

        const supportedMap = new Map((supportedLangs ?? []).map((sl) => [sl.code, sl]));

        gameLanguages = langData.map((lang) => {
          const supported = supportedMap.get(lang.language_code);
          return {
            language_code: lang.language_code,
            language_name: supported?.name ?? lang.language_name,
            native_name: supported?.native_name ?? null,
            has_audio: lang.has_audio ?? false,
            has_subtitles: lang.has_subtitles ?? false,
            has_interface: lang.has_interface ?? false,
          };
        });
      }
    } catch {
      // Table may not exist yet, ignore error
      logger.warn("game_languages table not available yet");
    }

    // Fetch playtime separately (columns may not exist yet)
    let gamePlaytime: {
      playtime_hastily: number | null;
      playtime_normally: number | null;
      playtime_completely: number | null;
      playtime_updated_at: string | null;
    } | null = null;

    try {
      const { data: playtimeData } = await supabase
        .from("games")
        .select("playtime_hastily, playtime_normally, playtime_completely, playtime_updated_at")
        .eq("id", game.id)
        .single();

      if (playtimeData) {
        gamePlaytime = {
          playtime_hastily: playtimeData.playtime_hastily ?? null,
          playtime_normally: playtimeData.playtime_normally ?? null,
          playtime_completely: playtimeData.playtime_completely ?? null,
          playtime_updated_at: playtimeData.playtime_updated_at ?? null,
        };
      }
    } catch {
      // Columns may not exist yet, ignore error
      logger.warn("playtime columns not available yet");
    }

    // Fetch music/soundtrack info
    let gameMusic: {
      composer: string | null;
      spotify_embed_url: string | null;
      youtube_video_url: string | null;
    } | null = null;

    try {
      const { data: musicData } = await (
        supabase.from("game_music") as ReturnType<typeof supabase.from>
      )
        .select("composer, spotify_embed_url, youtube_video_url")
        .eq("game_id", game.id)
        .single();

      if (musicData) {
        gameMusic = musicData;
      }
    } catch {
      logger.warn("game_music table not available yet");
    }

    // Fetch game versions (Requirements 5.1)
    let gameVersions: Array<{
      id: string;
      igdb_id: number | null;
      version_title: string;
      description: string | null;
      cover_image_url: string | null;
      game_version_translations?: Array<{
        language_code: string;
        title: string;
        description: string | null;
      }>;
    }> = [];

    try {
      const { data: versionsData } = await supabase
        .from("game_versions")
        .select(
          "id, igdb_id, version_title, description, cover_image_url, game_version_translations(language_code, title, description)"
        )
        .eq("game_id", game.id)
        .order("display_order", { ascending: true });

      if (versionsData) {
        gameVersions = versionsData;
      }
    } catch {
      // Table may not exist yet, ignore error
      logger.warn("game_versions table not available yet");
    }

    // Fetch DLC/extensions (Requirements 6.1, 6.2, 7.5)
    let gameDlcExtensions: Array<{
      id: string;
      igdb_id: number;
      name: string;
      slug: string | null;
      summary: string | null;
      category: string;
      cover_image_url: string | null;
      release_date: string | null;
    }> = [];

    try {
      const { data: dlcData } = await supabase
        .from("game_dlc_extensions")
        .select("id, igdb_id, name, slug, summary, category, cover_image_url, release_date")
        .eq("game_id", game.id)
        .order("category", { ascending: true })
        .order("release_date", { ascending: true, nullsFirst: false });

      if (dlcData) {
        gameDlcExtensions = dlcData;
      }
    } catch {
      // Table may not exist yet, ignore error
      logger.warn("game_dlc_extensions table not available yet");
    }

    // Resolve local game slugs for DLC/extensions that are also imported games
    let localGameMap = new Map<number, string>();
    try {
      if (gameDlcExtensions.length > 0) {
        const igdbIds = gameDlcExtensions.map((d) => d.igdb_id);
        const { data: localGames } = await supabase
          .from("games")
          .select("igdb_id, slug")
          .in("igdb_id", igdbIds);

        localGameMap = new Map(
          localGames
            ?.filter((g): g is typeof g & { igdb_id: number } => g.igdb_id !== null)
            .map((g) => [g.igdb_id, g.slug]) ?? []
        );
      }
    } catch {
      // Non-critical, continue without local game links
      logger.warn("Failed to resolve local game slugs for DLC extensions");
    }

    // Fetch similar games
    interface SimilarGameRow {
      similar_igdb_id: number;
      similar_game_id: string | null;
      display_order: number;
    }
    let gameSimilarGames: SimilarGameRow[] = [];

    try {
      const { data: similarData } = await untypedTable(supabase, "game_similar_games")
        .select("similar_igdb_id, similar_game_id, display_order")
        .eq("game_id", game.id)
        .order("display_order", { ascending: true });

      if (similarData) {
        gameSimilarGames = similarData;
      }
    } catch {
      logger.warn("game_similar_games table not available yet");
    }

    // Resolve similar game details for those that exist locally
    const similarGameDetailsMap = new Map<
      string,
      {
        id: string;
        slug: string;
        title: string;
        coverImage: string | null;
        genres: Array<{ name: string }>;
        developer: string;
        metascore: number | null;
      }
    >();

    try {
      const resolvedIds = gameSimilarGames
        .map((sg) => sg.similar_game_id)
        .filter((id): id is string => id !== null);

      if (resolvedIds.length > 0) {
        const { data: similarGamesData } = await supabase
          .from("games")
          .select(
            `id, slug, cover_image_url, metascore,
             game_translations(title, language_code),
             game_genres(genres(genre_translations(name, language_code))),
             game_companies(role, is_primary, companies(name))`
          )
          .in("id", resolvedIds);

        for (const sg of similarGamesData ?? []) {
          const translations = (sg.game_translations ?? []) as Array<{
            title: string;
            language_code: string;
          }>;
          const t =
            translations.find((tr) => tr.language_code === locale) ||
            translations.find((tr) => tr.language_code === "en") ||
            translations[0];

          const genreNames = (
            (sg.game_genres ?? []) as Array<{
              genres: {
                genre_translations: Array<{ name: string; language_code: string }>;
              };
            }>
          ).map((gg) => {
            const gts = gg.genres?.genre_translations ?? [];
            const gt =
              gts.find((tr) => tr.language_code === locale) ||
              gts.find((tr) => tr.language_code === "en") ||
              gts[0];
            return { name: gt?.name || "Unknown" };
          });

          const companies = (sg.game_companies ?? []) as Array<{
            role: string;
            is_primary: boolean;
            companies: { name: string } | null;
          }>;
          const dev =
            companies.find((c) => c.role === "developer" && c.is_primary) ||
            companies.find((c) => c.role === "developer");

          similarGameDetailsMap.set(sg.id, {
            id: sg.id,
            slug: sg.slug,
            title: t?.title || sg.slug,
            coverImage: sg.cover_image_url,
            genres: genreNames,
            developer: dev?.companies?.name ?? "",
            metascore: sg.metascore ?? null,
          });
        }
      }
    } catch {
      logger.warn("Failed to resolve similar game details");
    }

    // Fetch platforms for this game
    let gamePlatforms: Array<{
      id: string;
      slug: string;
      name: string;
      abbreviation: string | null;
      iconUrl: string | null;
    }> = [];

    try {
      const { data: gpData } = await supabase
        .from("game_platforms")
        .select("platform_id")
        .eq("game_id", game.id);

      if (gpData && gpData.length > 0) {
        const platformIds = gpData.map((gp: { platform_id: string }) => gp.platform_id);
        const { data: platformData } = await supabase
          .from("platforms")
          .select(
            `
            id,
            slug,
            icon_url,
            platform_translations(
              name,
              abbreviation,
              language_code
            )
          `
          )
          .in("id", platformIds);

        if (platformData) {
          gamePlatforms = platformData.map(
            (p: {
              id: string;
              slug: string;
              icon_url: string | null;
              platform_translations: Array<{
                name: string;
                abbreviation: string | null;
                language_code: string;
              }>;
            }) => {
              const translations = p.platform_translations ?? [];
              const t =
                translations.find((tr) => tr.language_code === locale) ||
                translations.find((tr) => tr.language_code === "en") ||
                translations[0];
              return {
                id: p.id,
                slug: p.slug,
                name: t?.name || p.slug,
                abbreviation: t?.abbreviation || null,
                iconUrl: p.icon_url,
              };
            }
          );
        }
      }
    } catch {
      logger.warn("game_platforms table not available yet");
    }

    // Transform the data to match the expected format
    // Prefer translation matching the requested locale, fallback to first available
    const translations = game.game_translations ?? [];
    const translation =
      translations.find((t: { language_code?: string }) => t.language_code === locale) ||
      translations[0] ||
      null;

    // Process genres — prefer locale match, fallback to first translation
    const genres =
      game.game_genres?.map((gg: { genres: DatabaseGameGenre }) => {
        const genreTranslations = gg.genres?.genre_translations ?? [];
        const gt =
          genreTranslations.find((t: { language_code?: string }) => t.language_code === locale) ||
          genreTranslations[0] ||
          null;
        return {
          id: gg.genres?.id,
          slug: gg.genres?.slug,
          name: gt?.name || "Unknown",
          description: gt?.description,
        };
      }) || [];

    // Process companies — resolve description from company_translations by locale
    const resolveCompanyDescription = (company: DatabaseGameCompany | undefined): string | null => {
      if (!company) return null;
      const translations = company.company_translations ?? [];
      const localeTranslation = translations.find((t: { language_code?: string }) => t.language_code === locale);
      const fallbackTranslation = translations[0];
      return localeTranslation?.description ?? fallbackTranslation?.description ?? null;
    };

    const mapCompany = (gc: DatabaseGameCompanyRelation) => ({
      id: gc.companies?.id,
      name: gc.companies?.name,
      slug: gc.companies?.slug,
      description: resolveCompanyDescription(gc.companies),
      websiteUrl: gc.companies?.website_url,
      isPrimary: gc.is_primary || false,
    });

    const companies = {
      developers:
        game.game_companies
          ?.filter((gc: DatabaseGameCompanyRelation) => gc.role === "developer")
          .map(mapCompany) || [],
      publishers:
        game.game_companies
          ?.filter((gc: DatabaseGameCompanyRelation) => gc.role === "publisher")
          .map(mapCompany) || [],
    };

    // Get primary developer and publisher for backward compatibility
    const primaryDeveloper =
      companies.developers.find((dev: { isPrimary: boolean }) => dev.isPrimary) ||
      companies.developers[0];
    const primaryPublisher =
      companies.publishers.find((pub: { isPrimary: boolean }) => pub.isPrimary) ||
      companies.publishers[0];

    // Process media — deduplicate by id (PostgREST can return duplicates with deep nested joins)
    const dedup = <T extends { id: string }>(items: T[]): T[] => {
      const seen = new Set<string>();
      return items.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    };

    const media = {
      coverImage: game.cover_image_url,
      backgroundImage: game.background_image_url,
      screenshots: dedup(
        game.game_screenshots
          ?.sort(
            (a: DatabaseGameScreenshot, b: DatabaseGameScreenshot) =>
              (a.display_order || 0) - (b.display_order || 0)
          )
          .map((screenshot: DatabaseGameScreenshot) => ({
            id: screenshot.id,
            url: screenshot.url,
            altText: screenshot.alt_text,
            caption: screenshot.caption,
            isFeatured: screenshot.is_featured || false,
          })) || []
      ),
      artwork: dedup(
        game.game_artwork
          ?.sort(
            (a: DatabaseGameArtwork, b: DatabaseGameArtwork) =>
              (a.display_order || 0) - (b.display_order || 0)
          )
          .map((art: DatabaseGameArtwork) => ({
            id: art.id,
            url: art.url,
            altText: art.alt_text,
            caption: art.caption,
            type: art.artwork_type || "unknown",
            isFeatured: art.is_featured || false,
          })) || []
      ),
      videos: dedup(
        game.game_videos
          ?.sort(
            (a: DatabaseGameVideo, b: DatabaseGameVideo) =>
              (a.display_order || 0) - (b.display_order || 0)
          )
          .map((video: DatabaseGameVideo) => ({
            id: video.id,
            title: video.title,
            description: video.description,
            url: video.url,
            thumbnailUrl: video.thumbnail_url,
            type: video.video_type || "unknown",
            duration: video.duration_seconds,
            isFeatured: video.is_featured || false,
          })) || []
      ),
    };

    // Process ratings - get all ratings, not just primary
    const processRating = (gr: DatabaseGameRating) => ({
      system: gr.ratings?.rating_systems?.name,
      systemCode: gr.ratings?.rating_systems?.code,
      rating: gr.ratings?.display_name,
      ratingCode: gr.ratings?.code,
      minimumAge: gr.ratings?.minimum_age,
      colorHex: gr.ratings?.color_hex,
      iconUrl: gr.ratings?.icon_url,
      assignedDate: gr.assigned_date,
      isPrimary: gr.is_primary,
      contentDescriptors:
        gr.game_rating_descriptors?.map(
          (grd: {
            content_descriptors: {
              code: string;
              content_descriptor_translations: Array<{
                name: string;
                description: string | null;
                language_code?: string;
              }>;
            };
          }) => {
            const cdTranslations = grd.content_descriptors?.content_descriptor_translations ?? [];
            const cdt =
              cdTranslations.find((t) => t.language_code === locale) || cdTranslations[0] || null;
            return {
              code: grd.content_descriptors?.code,
              name: cdt?.name,
              description: cdt?.description,
            };
          }
        ) || [],
    });

    // Sort ratings: PEGI first, then by system name
    const gameRatingsArray = game.game_ratings || [];
    const sortedGameRatings =
      gameRatingsArray.length > 0
        ? [...gameRatingsArray].sort((a: DatabaseGameRating, b: DatabaseGameRating) => {
            const aCode = a.ratings?.rating_systems?.code?.toUpperCase() || "";
            const bCode = b.ratings?.rating_systems?.code?.toUpperCase() || "";
            // PEGI comes first
            if (aCode === "PEGI" && bCode !== "PEGI") return -1;
            if (bCode === "PEGI" && aCode !== "PEGI") return 1;
            // Then alphabetically by system code
            return aCode.localeCompare(bCode);
          })
        : [];

    const ageRatings = sortedGameRatings.map((gr: DatabaseGameRating) => processRating(gr));
    const primaryRating = gameRatingsArray.find((gr: DatabaseGameRating) => gr.is_primary);
    const ageRating = primaryRating ? processRating(primaryRating) : null;

    // Process pricing
    const pricing =
      game.game_prices
        ?.filter((gp: DatabaseGamePrice) => gp.is_available)
        .map((price: DatabaseGamePrice) => ({
          price: price.price,
          currency: price.currency,
          platform: price.platform,
          lastUpdated: price.last_updated || "",
          storeUrl: price.store_url,
          store: {
            name: price.stores?.name,
            logoUrl: price.stores?.logo_url,
            websiteUrl: price.stores?.website_url,
          },
        })) || [];

    // Process languages from separate query
    const languages = gameLanguages.map((lang) => ({
      code: lang.language_code,
      name: lang.language_name,
      nativeName: lang.native_name,
      hasAudio: lang.has_audio || false,
      hasSubtitles: lang.has_subtitles || false,
      hasInterface: lang.has_interface || false,
    }));

    // Process playtime (may be null if columns don't exist or not yet fetched)
    const playtime =
      gamePlaytime &&
      (gamePlaytime.playtime_hastily ||
        gamePlaytime.playtime_normally ||
        gamePlaytime.playtime_completely)
        ? {
            hastily: gamePlaytime.playtime_hastily,
            normally: gamePlaytime.playtime_normally,
            completely: gamePlaytime.playtime_completely,
            lastUpdated: gamePlaytime.playtime_updated_at,
          }
        : null;

    // Process versions - map to GameVersion format with locale-aware translations
    const versions = gameVersions.map((v) => {
      const tr = v.game_version_translations?.find((t) => t.language_code === locale);
      const fallbackTr = v.game_version_translations?.find((t) => t.language_code === "fr");
      return {
        id: v.id,
        igdbId: v.igdb_id,
        title: tr?.title || fallbackTr?.title || v.version_title,
        description: tr?.description || fallbackTr?.description || v.description,
        coverImageUrl: v.cover_image_url,
      };
    });

    // Process DLC/extensions - map to GameDlcExtension format (Requirements 6.1, 6.2, 7.5)
    const dlcExtensions = gameDlcExtensions.map((d) => ({
      id: d.id,
      igdbId: d.igdb_id,
      name: d.name,
      slug: d.slug,
      summary: d.summary,
      category: d.category,
      coverImageUrl: d.cover_image_url,
      releaseDate: d.release_date,
      gameSlug: localGameMap.get(d.igdb_id) ?? null,
    }));

    const transformedGame = {
      id: game.id,
      slug: game.slug,
      igdbId: game.igdb_id ?? undefined,
      lastSyncedAt: game.last_synced_at ?? undefined,
      title: translation?.title || "Untitled",
      description: translation?.description,
      storyline: translation?.storyline ?? undefined,
      releaseDate: game.release_date,
      releaseYear: game.release_date ? new Date(game.release_date).getFullYear() : null,
      metascore: game.metascore,
      backgroundColor: game.background_color,
      accentColor: game.accent_color,
      labelColor: game.label_color,
      textColor: game.text_color,
      systemRequirements: game.system_requirements,
      genres,
      companies,
      developer: primaryDeveloper?.name || "Unknown",
      publisher: primaryPublisher?.name || "Unknown",
      media,
      ageRating,
      ageRatings,
      pricing,
      languages,
      playtime,
      music: gameMusic
        ? {
            composer: gameMusic.composer ?? undefined,
            spotifyEmbedUrl: gameMusic.spotify_embed_url ?? undefined,
            youtubeVideoUrl: gameMusic.youtube_video_url ?? undefined,
          }
        : null,
      versions,
      dlcExtensions,
      similarGames: gameSimilarGames.map((sg) => ({
        igdbId: sg.similar_igdb_id,
        game: sg.similar_game_id ? (similarGameDetailsMap.get(sg.similar_game_id) ?? null) : null,
      })),
      platforms: gamePlatforms,
      createdAt: game.created_at,
      updatedAt: game.updated_at,
    };

    return NextResponse.json(transformedGame);
  } catch (error) {
    logger.error("Error in game details API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
