import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/characters/[id]/overrides
 * Returns the list of field overrides (manually modified fields) for a character.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id: characterId } = await params;

    if (!characterId) {
      return NextResponse.json({ error: "Character ID is required" }, { status: 400 });
    }

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
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    logger.error("Error in admin character overrides GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
