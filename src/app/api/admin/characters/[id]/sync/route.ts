import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";
import type { CharacterTrackableField } from "@/types/admin-characters";
import {
  CHARACTER_TRACKABLE_FIELDS,
  syncCharacterField,
  syncAllCharacterFields,
} from "@/lib/services/igdb-character-sync";

/**
 * POST /api/admin/characters/[id]/sync
 * Synchronise one or all fields of a character from IGDB.
 *
 * Body: { field?: string }
 * - If field is provided: sync that field only
 * - If field is absent: forced sync of all fields
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id: characterId } = await params;

    if (!characterId) {
      return NextResponse.json({ error: "Character ID is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { field } = body as { field?: string };

    // Validate field name if provided
    if (field && !CHARACTER_TRACKABLE_FIELDS.includes(field as CharacterTrackableField)) {
      return NextResponse.json({ error: `Invalid field: ${field}` }, { status: 400 });
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

    if (fetchError || !character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    if (!character.igdb_id) {
      return NextResponse.json({ error: "Ce personnage n'est pas lié à IGDB" }, { status: 400 });
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
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    logger.error("Error in admin character sync POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
