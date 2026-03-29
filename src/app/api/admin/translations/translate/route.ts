import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { translateBodySchema } from "@/lib/validations/admin-translation";
import { getSourceText, upsertTranslation } from "@/lib/services/translationService";
import { translateFields } from "@/lib/services/aiTranslateService";
import { ENTITY_TABLE_MAP } from "@/types/admin-translations";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/translations/translate - Translate a single entity to a target language
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parseResult = translateBodySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { entityType, entityId, targetLang, saveToDb } = parseResult.data;

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

    // Get source text
    const source = await getSourceText({
      supabase,
      entityType,
      entityId,
      excludeLang: targetLang,
    });

    if (!source) {
      return NextResponse.json({ error: "No source translation available" }, { status: 400 });
    }

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
    }

    return NextResponse.json({
      entityId,
      translatedFields,
      saved: saveToDb,
    });
  } catch (error) {
    logger.error("Error in admin translations translate POST", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes("timed out")) {
      return NextResponse.json({ error: "Translation timed out after 30s" }, { status: 504 });
    }

    if (error instanceof Error && error.message.includes("AI Gateway")) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
