import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, validationError } from "@/lib/api/route";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/characters/[id]/overrides
 * Returns the list of field overrides (manually modified fields) for a character.
 */
export const GET = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id: characterId } = params;

  if (!characterId) throw validationError(undefined, "Character ID is required");

  const supabase = await createRouteHandlerClient();

  // genders/gender_translations/characters tables not in generated Supabase types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: overrides, error } = await db
    .from("character_field_overrides")
    .select("id, character_id, field_name, overridden_by, overridden_at")
    .eq("character_id", characterId);

  if (error) {
    logger.error("Error fetching character overrides", { error });
    return NextResponse.json(
      { error: `Failed to fetch overrides: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ overrides: overrides ?? [] });
});
