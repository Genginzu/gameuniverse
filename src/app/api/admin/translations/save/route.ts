import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { defineRoute, notFound } from "@/lib/api/route";
import { saveTranslationBodySchema } from "@/lib/validations/admin-translation";
import { upsertTranslation } from "@/lib/services/translationService";
import { ENTITY_TABLE_MAP } from "@/types/admin-translations";
import { logger } from "@/lib/logger";

/**
 * PUT /api/admin/translations/save - Save a manually edited translation
 */
export const PUT = defineRoute(
  { auth: "admin", body: saveTranslationBodySchema },
  async ({ body }) => {
    const { entityType, entityId, targetLang, translations } = body;

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

    // Save translation
    await upsertTranslation({
      supabase,
      entityType,
      entityId,
      targetLang,
      fields: translations,
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

    return NextResponse.json({ success: true });
  }
);
