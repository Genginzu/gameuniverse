import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { translateBatchBodySchema } from "@/lib/validations/admin-translation";
import { getSourceText, upsertTranslation } from "@/lib/services/translationService";
import { translateFields } from "@/lib/services/aiTranslateService";
import { ENTITY_TABLE_MAP } from "@/types/admin-translations";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/translations/translate-batch
 * Translates multiple entities sequentially, streaming progress as NDJSON.
 * Each line is a JSON object with { entityId, status, translatedFields? | error? }.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parseResult = translateBatchBodySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { entityType, entityIds, targetLang } = parseResult.data;
    const supabase = await createRouteHandlerClient();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (const entityId of entityIds) {
          // Check for client disconnection
          if (request.signal.aborted) {
            break;
          }

          try {
            // Verify entity exists
            const entityTable = ENTITY_TABLE_MAP[entityType];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: entity, error: entityError } = await (supabase as any)
              .from(entityTable)
              .select("id")
              .eq("id", entityId)
              .single();

            if (entityError || !entity) {
              const line = JSON.stringify({
                entityId,
                status: "error",
                error: "Entity not found",
              });
              controller.enqueue(encoder.encode(line + "\n"));
              continue;
            }

            // Get source text
            const source = await getSourceText({
              supabase,
              entityType,
              entityId,
              excludeLang: targetLang,
            });

            if (!source) {
              const line = JSON.stringify({
                entityId,
                status: "error",
                error: "No source translation available",
              });
              controller.enqueue(encoder.encode(line + "\n"));
              continue;
            }

            // Translate via AI
            const translatedFields = await translateFields({
              sourceLang: source.sourceLang,
              targetLang,
              entityType,
              fields: source.fields,
            });

            // Save to DB before moving to next entity
            await upsertTranslation({
              supabase,
              entityType,
              entityId,
              targetLang,
              fields: translatedFields,
            });

            const line = JSON.stringify({
              entityId,
              status: "success",
              translatedFields,
            });
            controller.enqueue(encoder.encode(line + "\n"));
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            logger.error("Batch translation error for entity", {
              entityId,
              entityType,
              error,
            });
            const line = JSON.stringify({
              entityId,
              status: "error",
              error: message,
            });
            controller.enqueue(encoder.encode(line + "\n"));
          }
        }

        // Refresh stats cache after all entities are processed
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).rpc("refresh_translation_stats");
        } catch (e) {
          logger.error("Stats refresh failed after batch", { error: e });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    logger.error("Error in admin translations translate-batch POST", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
