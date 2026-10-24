import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { translateBodySchema } from "@/lib/validations/admin-translation";
import { getSourceText, upsertTranslation } from "@/lib/services/translationService";
import { translateFields } from "@/lib/services/aiTranslateService";
import { ENTITY_TABLE_MAP } from "@/types/admin-translations";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/translations/translate - Translate a single entity to a target language
 */
export const POST = defineRoute({ auth: "admin", body: translateBodySchema }, async ({ body }) => {
  const { entityType, entityId, targetLang, saveToDb } = body;

  try {
    const supabase = await createRouteHandlerClient();

    // Check entity exists
    const entityTable = ENTITY_TABLE_MAP[entityType];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entity, error: entityError } = await (supabase as any)
      .from(entityTable)
      .select("id")
      .eq("id", entityId)
      .single();

    if (entityError || !entity) throw notFound("Entity not found");

    // Get source text
    const source = await getSourceText({
      supabase,
      entityType,
      entityId,
      excludeLang: targetLang,
    });

    if (!source) throw validationError(undefined, "No source translation available");

    // Translate via AI
    const translatedFields = await translateFields({
      sourceLang: source.sourceLang,
      targetLang,
      entityType,
      fields: source.fields,
    });

    // Save if requested
    if (saveToDb) {
      await upsertTranslation({
        supabase,
        entityType,
        entityId,
        targetLang,
        fields: translatedFields,
      });

      // Refresh stats cache before responding so SWR reads fresh data.
      // refresh_translation_stats is service_role only (migration 20261018000013).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: refreshError } = await (getSupabaseAdmin() as any).rpc(
        "refresh_translation_stats"
      );

      if (refreshError) {
        logger.error("Stats refresh failed", { error: refreshError });
      }
    }

    return NextResponse.json({
      entityId,
      translatedFields,
      saved: saveToDb,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("timed out")) {
      logger.error("Error in admin translations translate POST", { error });
      return NextResponse.json({ error: "Translation timed out after 30s" }, { status: 504 });
    }

    if (error instanceof Error && error.message.includes("AI Gateway")) {
      logger.error("Error in admin translations translate POST", { error });
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    throw error;
  }
});
