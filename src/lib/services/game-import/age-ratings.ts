import { IGDBGame, IGDB_RATING_CATEGORIES, IGDB_ALL_RATINGS } from "@/types/igdb";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBService } from "../igdbService";
import { logger } from "@/lib/logger";

/**
 * Creates age ratings for a game from IGDB data.
 */
export async function createAgeRatings(gameId: string, igdbGame: IGDBGame): Promise<void> {
  if (!igdbGame.age_ratings || igdbGame.age_ratings.length === 0) {
    return;
  }

  const ageRatingIds = igdbGame.age_ratings
    .map((ar) => ar.id)
    .filter((id): id is number => id !== undefined);

  const ageRatings = await IGDBService.getAgeRatings(ageRatingIds);

  if (ageRatings.length === 0) {
    return;
  }

  const supabase = await getSupabaseAdmin();

  // Sort to prioritize PEGI as primary
  ageRatings.sort((a, b) => {
    const aIsPegi = IGDB_RATING_CATEGORIES[a.organization ?? -1] === "PEGI" ? 0 : 1;
    const bIsPegi = IGDB_RATING_CATEGORIES[b.organization ?? -1] === "PEGI" ? 0 : 1;
    return aIsPegi - bIsPegi;
  });

  for (let i = 0; i < ageRatings.length; i++) {
    const ageRating = ageRatings[i];
    const organization = ageRating.organization;
    const ratingCategory = ageRating.rating_category;

    if (organization === undefined || ratingCategory === undefined) {
      continue;
    }

    const systemCode = IGDB_RATING_CATEGORIES[organization];

    if (!systemCode) {
      logger.warn("Unknown IGDB age rating organization", { organization });
      continue;
    }

    const ratingInfo = IGDB_ALL_RATINGS[ratingCategory];

    let ratingCode: string;
    let displayName: string;
    let minimumAge: number | null = null;
    const iconUrl = ageRating.rating_cover_url || null;

    if (ratingInfo) {
      ratingCode = ratingInfo.code;
      displayName = ratingInfo.name;
      minimumAge = ratingInfo.age;
    } else {
      ratingCode = String(ratingCategory);
      displayName = `${systemCode} ${ratingCategory}`;
    }

    // Find or create rating system
    let { data: ratingSystem } = await supabase
      .from("rating_systems")
      .select("id")
      .eq("code", systemCode)
      .single();

    if (!ratingSystem) {
      const { data: newSystem, error } = await supabase
        .from("rating_systems")
        .insert({ code: systemCode, name: systemCode })
        .select("id")
        .single();

      if (error || !newSystem) {
        logger.error("Failed to create rating system", { systemCode, error });
        continue;
      }
      ratingSystem = newSystem;
    }

    // Find or create rating
    let { data: rating } = await supabase
      .from("ratings")
      .select("id, icon_url")
      .eq("rating_system_id", ratingSystem.id)
      .eq("code", ratingCode)
      .single();

    if (!rating) {
      const { data: newRating, error } = await supabase
        .from("ratings")
        .insert({
          rating_system_id: ratingSystem.id,
          code: ratingCode,
          display_name: displayName,
          minimum_age: minimumAge,
          icon_url: iconUrl,
        })
        .select("id")
        .single();

      if (error || !newRating) {
        logger.error("Failed to create rating", { displayName, error });
        continue;
      }
      rating = { id: newRating.id, icon_url: iconUrl };
    } else if (iconUrl && !rating.icon_url) {
      await supabase.from("ratings").update({ icon_url: iconUrl }).eq("id", rating.id);
    }

    // Create game_rating link
    const { data: gameRating, error: gameRatingError } = await supabase
      .from("game_ratings")
      .insert({
        game_id: gameId,
        rating_id: rating.id,
        is_primary: i === 0,
      })
      .select("id")
      .single();

    if (gameRatingError || !gameRating) {
      logger.error("Failed to link rating to game", { gameId, error: gameRatingError });
      continue;
    }

    // Create content descriptors if available
    if (ageRating.content_descriptions && ageRating.content_descriptions.length > 0) {
      for (const desc of ageRating.content_descriptions) {
        let { data: descriptor } = await supabase
          .from("content_descriptors")
          .select("id")
          .eq("rating_system_id", ratingSystem.id)
          .eq("code", String(desc.category))
          .single();

        if (!descriptor) {
          const { data: newDescriptor, error } = await supabase
            .from("content_descriptors")
            .insert({
              rating_system_id: ratingSystem.id,
              code: String(desc.category),
            })
            .select("id")
            .single();

          if (error || !newDescriptor) {
            logger.error("Failed to create content descriptor", { error });
            continue;
          }
          descriptor = newDescriptor;

          await supabase.from("content_descriptor_translations").insert([
            { content_descriptor_id: descriptor.id, language_code: "en", name: desc.description },
            { content_descriptor_id: descriptor.id, language_code: "fr", name: desc.description },
          ]);
        }

        await supabase.from("game_rating_descriptors").insert({
          game_rating_id: gameRating.id,
          content_descriptor_id: descriptor.id,
        });
      }
    }
  }
}

/**
 * Updates age ratings for an existing game.
 */
export async function updateAgeRatings(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const supabase = await getSupabaseAdmin();

  const { data: existingRatings } = await supabase
    .from("game_ratings")
    .select("id")
    .eq("game_id", gameId);

  if (existingRatings && existingRatings.length > 0) {
    for (const rating of existingRatings) {
      await supabase.from("game_rating_descriptors").delete().eq("game_rating_id", rating.id);
    }
    await supabase.from("game_ratings").delete().eq("game_id", gameId);
  }

  await createAgeRatings(gameId, igdbGame);
}
