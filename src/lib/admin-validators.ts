import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

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
      logger.error("Error validating slug", { error });
      return false;
    }
    return !data;
  } catch (error) {
    logger.error("Error in validateGameSlug", { error });
    return false;
  }
}

/**
 * Validate required fields for game creation
 */
export function validateGameData(gameData: GameDataInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

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

  return { isValid: errors.length === 0, errors };
}
