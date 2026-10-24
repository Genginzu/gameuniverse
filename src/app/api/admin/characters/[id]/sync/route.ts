import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import type { CharacterTrackableField } from "@/types/admin-characters";
import {
  CHARACTER_TRACKABLE_FIELDS,
  syncCharacterField,
  syncAllCharacterFields,
} from "@/lib/services/igdb-character-sync";

const syncBodySchema = z.object({ field: z.string().optional() });

/**
 * POST /api/admin/characters/[id]/sync
 * Synchronise one or all fields of a character from IGDB.
 *
 * Body: { field?: string }
 * - If field is provided: sync that field only
 * - If field is absent: forced sync of all fields
 */
export const POST = defineRoute(
  { auth: "admin", body: syncBodySchema },
  async ({ params, body }) => {
    const { id: characterId } = params;

    if (!characterId) throw validationError(undefined, "Character ID is required");

    const { field } = body;

    // Validate field name if provided
    if (field && !CHARACTER_TRACKABLE_FIELDS.includes(field as CharacterTrackableField)) {
      throw validationError(undefined, `Invalid field: ${field}`);
    }

    const supabase = await createRouteHandlerClient();

    // Character tables are not yet in generated Supabase types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Fetch character to check igdb_id
    const { data: character, error: fetchError } = await db
      .from("characters")
      .select("id, igdb_id")
      .eq("id", characterId)
      .single();

    if (fetchError || !character) throw notFound("Character not found");

    if (!character.igdb_id) {
      throw validationError(undefined, "Ce personnage n'est pas lié à IGDB");
    }

    const result = field
      ? await syncCharacterField(
          db,
          characterId,
          character.igdb_id,
          field as CharacterTrackableField
        )
      : await syncAllCharacterFields(db, characterId, character.igdb_id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      syncedFields: result.syncedFields,
      character: { id: character.id, igdb_id: character.igdb_id },
    });
  }
);
