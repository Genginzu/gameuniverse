import { IGDBService } from "./igdbService";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

interface SyncResult {
  success: boolean;
  value?: unknown;
  error?: string;
}

/**
 * Lightweight field-specific sync for characters from IGDB.
 */
export async function syncCharacterField(
  characterId: string,
  igdbId: number,
  field: string
): Promise<SyncResult> {
  try {
    switch (field) {
      case "image":
        return await syncImage(characterId, igdbId);
      case "background":
        return await syncBackground(characterId, igdbId);
      default:
        return { success: false, error: `Unknown field: ${field}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("bulkCharacterFieldSync failed", { characterId, igdbId, field, error });
    return { success: false, error: message };
  }
}

async function fetchCharacterFromIGDB(igdbId: number) {
  // Access the private igdbFetch via the class
  const body = `fields mug_shot.image_id; where id = ${igdbId};`;
  const res = await IGDBService["igdbFetch"]("characters", body);
  if (!res.ok) return null;
  const data = await res.json();
  return data.length > 0 ? data[0] : null;
}

async function syncImage(characterId: string, igdbId: number): Promise<SyncResult> {
  const character = await fetchCharacterFromIGDB(igdbId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageId = (character?.mug_shot as any)?.image_id;

  if (!imageId) return { success: true, value: null };

  const imageUrl = IGDBService.buildImageUrl(imageId, "cover_big");
  const supabase = await createRouteHandlerClient();
  await supabase.from("characters").update({ main_image: imageUrl }).eq("id", characterId);
  return { success: true, value: imageUrl };
}

async function syncBackground(characterId: string, igdbId: number): Promise<SyncResult> {
  // IGDB characters don't have a dedicated background image
  // Use the mug_shot in 1080p as background if available
  const character = await fetchCharacterFromIGDB(igdbId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageId = (character?.mug_shot as any)?.image_id;

  if (!imageId) return { success: true, value: null };

  const bgUrl = IGDBService.buildImageUrl(imageId, "1080p");
  const supabase = await createRouteHandlerClient();
  await supabase.from("characters").update({ background_image: bgUrl }).eq("id", characterId);
  return { success: true, value: bgUrl };
}
