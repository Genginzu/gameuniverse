/**
 * Shared logic for applying IGDB webhook update payloads to local game data.
 * Used by:
 * - igdbWebhookService (auto-apply on webhook arrival)
 * - Admin API /apply endpoint (manual apply with force overrides)
 */

import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ApplyPayloadOptions {
  gameId: string;
  payload: Record<string, unknown>;
  /** Fields to force-apply even if admin has overridden them */
  forceFields?: Set<string>;
}

export interface ApplyPayloadResult {
  appliedFields: string[];
  skippedFields: string[];
  error?: string;
}

/**
 * Apply an IGDB webhook payload to a local game, respecting admin overrides.
 * Fields without admin overrides are applied automatically.
 * Fields with overrides are skipped unless listed in forceFields.
 */
export async function applyWebhookPayload(
  supabase: SupabaseClient,
  { gameId, payload, forceFields = new Set() }: ApplyPayloadOptions
): Promise<ApplyPayloadResult> {
  // Fetch admin overrides for this game
  const { data: overrides } = await supabase
    .from("game_field_overrides")
    .select("field_name")
    .eq("game_id", gameId);

  const overrideSet = new Set((overrides ?? []).map((o) => o.field_name as string));

  const appliedFields: string[] = [];
  const skippedFields: string[] = [];

  // --- Direct game table fields ---
  const gameUpdate: Record<string, unknown> = {};

  // Release date
  if (payload.first_release_date !== undefined) {
    const canApply = !overrideSet.has("release_date") || forceFields.has("release_date");
    if (canApply) {
      gameUpdate.release_date = payload.first_release_date
        ? new Date((payload.first_release_date as number) * 1000).toISOString().split("T")[0]
        : null;
      appliedFields.push("release_date");
    } else {
      skippedFields.push("release_date");
    }
  }

  // Metascore
  if (payload.aggregated_rating !== undefined) {
    const canApply = !overrideSet.has("metascore") || forceFields.has("metascore");
    if (canApply) {
      gameUpdate.metascore = payload.aggregated_rating
        ? Math.round(payload.aggregated_rating as number)
        : null;
      appliedFields.push("metascore");
    } else {
      skippedFields.push("metascore");
    }
  }

  // Cover image
  const cover = payload.cover as { image_id?: string } | undefined;
  if (cover !== undefined) {
    const canApply = !overrideSet.has("cover_image") || forceFields.has("cover_image");
    if (canApply) {
      gameUpdate.cover_image_url = cover?.image_id
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover.image_id}.jpg`
        : null;
      appliedFields.push("cover_image");
    } else {
      skippedFields.push("cover_image");
    }
  }

  // Slug
  if (payload.slug !== undefined) {
    const canApply = !overrideSet.has("slug") || forceFields.has("slug");
    if (canApply) {
      gameUpdate.slug = payload.slug;
      appliedFields.push("slug");
    } else {
      skippedFields.push("slug");
    }
  }

  // Update game table
  if (Object.keys(gameUpdate).length > 0) {
    gameUpdate.last_synced_at = new Date().toISOString();
    const { error: updateError } = await supabase.from("games").update(gameUpdate).eq("id", gameId);

    if (updateError) {
      logger.error("Failed to apply webhook game update", { gameId, error: updateError });
      return { appliedFields: [], skippedFields: [], error: updateError.message };
    }
  }

  // --- Translations (EN) ---
  if (payload.name !== undefined || payload.summary !== undefined) {
    const canApply =
      !overrideSet.has("translations") || forceFields.has("name") || forceFields.has("summary");
    if (canApply) {
      const translationUpdate: Record<string, unknown> = {};
      if (payload.name !== undefined) translationUpdate.title = payload.name;
      if (payload.summary !== undefined) translationUpdate.description = payload.summary ?? null;

      if (Object.keys(translationUpdate).length > 0) {
        const { error: transError } = await supabase
          .from("game_translations")
          .update(translationUpdate)
          .eq("game_id", gameId)
          .eq("language_code", "en");

        if (transError) {
          logger.error("Failed to apply webhook translation update", {
            gameId,
            error: transError,
          });
        } else {
          if (payload.name !== undefined) appliedFields.push("name");
          if (payload.summary !== undefined) appliedFields.push("summary");
        }
      }
    } else {
      if (payload.name !== undefined) skippedFields.push("name");
      if (payload.summary !== undefined) skippedFields.push("summary");
    }
  }

  return { appliedFields, skippedFields };
}
