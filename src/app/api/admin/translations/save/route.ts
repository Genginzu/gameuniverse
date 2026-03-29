import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { saveTranslationBodySchema } from "@/lib/validations/admin-translation";
import { upsertTranslation } from "@/lib/services/translationService";
import {
  ENTITY_TABLE_MAP,
  TRANSLATION_TABLE_MAP,
  FK_COLUMN_MAP,
  REQUIRED_FIELDS,
} from "@/types/admin-translations";
import { logger } from "@/lib/logger";

/**
 * PUT /api/admin/translations/save - Save a manually edited translation
 */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parseResult = saveTranslationBodySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { entityType, entityId, targetLang, translations } = parseResult.data;

    const supabase = await createRouteHandlerClient();

    // Check entity exists
    const entityTable = ENTITY_TABLE_MAP[entityType];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entity, error: entityError } = await (supabase as any)
      .from(entityTable)
      .select("id")
      .eq("id", entityId)
      .single();

    if (entityError || !entity) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    // Save translation
    await upsertTranslation({
      supabase,
      entityType,
      entityId,
      targetLang,
      fields: translations,
    });

    // Refresh stats cache in background
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .rpc("refresh_translation_stats_for_type", {
        p_entity_type: entityType,
        p_translation_table: TRANSLATION_TABLE_MAP[entityType],
        p_fk_column: FK_COLUMN_MAP[entityType],
        p_required_fields: REQUIRED_FIELDS[entityType],
      })
      .then(() => {})
      .catch((e: unknown) => logger.error("Stats refresh failed", { error: e }));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in admin translations save PUT", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
