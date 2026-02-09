import { createRouteHandlerClient } from "@/lib/supabase-server";

// Type definitions for Supabase query results
interface GenreStatItem {
  genre_id: string;
  genres: {
    slug: string;
    genre_translations: Array<{ name: string }> | null;
  } | null;
}

interface GameDataTranslation {
  title?: string;
  language_code?: string;
}

interface GameDataInput {
  game?: {
    slug?: string;
  };
  translations?: GameDataTranslation[];
  companies?: unknown[];
  genres?: unknown[];
}

/**
 * Get available companies for game creation/editing
 */
export async function getAvailableCompanies() {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: companies, error } = await supabase
      .from("companies")
      .select("id, name, slug, description, website_url")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching companies:", error);
      return [];
    }

    return companies || [];
  } catch (error) {
    console.error("Error in getAvailableCompanies:", error);
    return [];
  }
}

/**
 * Get available genres for game creation/editing
 */
export async function getAvailableGenres(locale: string = "fr") {
  try {
    const supabase = await createRouteHandlerClient();

    // Fetch all genres with all translations (no locale filter)
    // so genres without a translation in the requested locale still appear
    const { data: genres, error } = await supabase
      .from("genres")
      .select(
        `
        id,
        slug,
        genre_translations(
          name,
          description,
          language_code
        )
      `
      )
      .order("slug");

    if (error) {
      console.error("Error fetching genres:", error);
      return [];
    }

    return (
      genres?.map((genre) => {
        const translations = genre.genre_translations ?? [];
        const translation =
          translations.find((t: { language_code: string }) => t.language_code === locale) ||
          translations[0] ||
          null;
        return {
          id: genre.id,
          slug: genre.slug,
          name: translation?.name || "Unknown",
          description: translation?.description,
        };
      }) || []
    );
  } catch (error) {
    console.error("Error in getAvailableGenres:", error);
    return [];
  }
}

/**
 * Get available stores for pricing
 */
export async function getAvailableStores() {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: stores, error } = await supabase
      .from("stores")
      .select("id, name, logo_url, website_url")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching stores:", error);
      return [];
    }

    return stores || [];
  } catch (error) {
    console.error("Error in getAvailableStores:", error);
    return [];
  }
}
/**
 * Get available supported languages for game language assignment
 */
export async function getAvailableSupportedLanguages() {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: languages, error } = await supabase
      .from("supported_languages")
      .select("code, name, native_name")
      .order("name");

    if (error) {
      console.error("Error fetching supported languages:", error);
      return [];
    }

    return languages || [];
  } catch (error) {
    console.error("Error in getAvailableSupportedLanguages:", error);
    return [];
  }
}

/**
 * Get available ratings grouped by rating system for game creation/editing
 */
export async function getAvailableRatings() {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: ratings, error } = await supabase
      .from("ratings")
      .select(
        `
        id,
        code,
        display_name,
        minimum_age,
        color_hex,
        icon_url,
        sort_order,
        rating_systems(
          id,
          code,
          name
        )
      `
      )
      .order("sort_order");

    if (error) {
      console.error("Error fetching ratings:", error);
      return [];
    }

    return (
      ratings?.map((r) => ({
        id: r.id,
        code: r.code,
        display_name: r.display_name,
        minimum_age: r.minimum_age,
        color_hex: r.color_hex,
        icon_url: r.icon_url,
        system: r.rating_systems
          ? {
              id: (r.rating_systems as { id: string; code: string; name: string }).id,
              code: (r.rating_systems as { id: string; code: string; name: string }).code,
              name: (r.rating_systems as { id: string; code: string; name: string }).name,
            }
          : null,
      })) || []
    );
  } catch (error) {
    console.error("Error in getAvailableRatings:", error);
    return [];
  }
}

/**
 * Get available content descriptors for age rating management
 */
export async function getAvailableContentDescriptors(locale: string = "fr") {
  try {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("content_descriptors")
      .select(
        `
        id,
        code,
        rating_system_id,
        content_descriptor_translations(
          name,
          description,
          language_code
        )
      `
      )
      .order("code");

    if (error) {
      console.error("Error fetching content descriptors:", error);
      return [];
    }

    return (
      data?.map((cd) => {
        const translations = cd.content_descriptor_translations ?? [];
        const translation =
          translations.find((t: { language_code: string }) => t.language_code === locale) ||
          translations[0] ||
          null;
        return {
          id: cd.id,
          code: cd.code,
          rating_system_id: cd.rating_system_id,
          name: translation?.name || cd.code,
          description: translation?.description || null,
        };
      }) || []
    );
  } catch (error) {
    console.error("Error in getAvailableContentDescriptors:", error);
    return [];
  }
}

/**
 * Validate game slug uniqueness
 */
export async function validateGameSlug(slug: string, excludeGameId?: string) {
  try {
    const supabase = await createRouteHandlerClient();

    let query = supabase.from("games").select("id").eq("slug", slug);

    if (excludeGameId) {
      query = query.neq("id", excludeGameId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error validating slug:", error);
      return false;
    }

    return !data; // Return true if no existing game found (slug is available)
  } catch (error) {
    console.error("Error in validateGameSlug:", error);
    return false;
  }
}

/**
 * Generate a unique slug from a title
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Get game statistics for admin dashboard
 */
export async function getGameStatistics() {
  try {
    const supabase = await createRouteHandlerClient();

    // Get total games count
    const { count: totalGames, error: gamesError } = await supabase
      .from("games")
      .select("*", { count: "exact", head: true });

    if (gamesError) {
      console.error("Error counting games:", gamesError);
    }

    // Get games created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentGames, error: recentError } = await supabase
      .from("games")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (recentError) {
      console.error("Error counting recent games:", recentError);
    }

    // Get games by genre
    const { data: genreStats, error: genreError } = await supabase
      .from("game_genres")
      .select(
        `
        genre_id,
        genres(
          slug,
          genre_translations(name)
        )
      `
      )
      .eq("genres.genre_translations.language_code", "fr");

    if (genreError) {
      console.error("Error fetching genre stats:", genreError);
    }

    // Process genre statistics
    const genreCount: Record<string, { name: string; count: number }> = {};
    (genreStats as unknown as GenreStatItem[])?.forEach((item) => {
      const genreName = item.genres?.genre_translations?.[0]?.name || "Unknown";
      const genreSlug = item.genres?.slug || "unknown";

      if (!genreCount[genreSlug]) {
        genreCount[genreSlug] = { name: genreName, count: 0 };
      }
      genreCount[genreSlug].count++;
    });

    return {
      totalGames: totalGames || 0,
      recentGames: recentGames || 0,
      genreDistribution: Object.entries(genreCount).map(([slug, data]) => ({
        slug,
        name: data.name,
        count: data.count,
      })),
    };
  } catch (error) {
    console.error("Error in getGameStatistics:", error);
    return {
      totalGames: 0,
      recentGames: 0,
      genreDistribution: [],
    };
  }
}

/**
 * Validate required fields for game creation
 */
export function validateGameData(gameData: GameDataInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!gameData.game?.slug) {
    errors.push("Game slug is required");
  }

  if (!gameData.translations || gameData.translations.length === 0) {
    errors.push("At least one translation is required");
  } else {
    gameData.translations.forEach((translation, index) => {
      if (!translation.title) {
        errors.push(`Translation ${index + 1}: Title is required`);
      }
      if (!translation.language_code) {
        errors.push(`Translation ${index + 1}: Language code is required`);
      }
    });
  }

  if (!gameData.companies || gameData.companies.length === 0) {
    errors.push("At least one company is required");
  }

  if (!gameData.genres || gameData.genres.length === 0) {
    errors.push("At least one genre is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
