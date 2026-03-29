import { generateObject } from "ai";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { EDITABLE_FIELDS, type EntityType } from "@/types/admin-translations";

/** Builds a dynamic Zod schema from EDITABLE_FIELDS for the given entity type. */
function buildTranslationSchema(entityType: EntityType) {
  const fields = EDITABLE_FIELDS[entityType];
  const shape: Record<string, z.ZodString> = {};
  for (const field of fields) {
    shape[field] = z.string();
  }
  return z.object(shape);
}

/**
 * Translates text fields from a source language to a target language
 * using Vercel AI SDK with openai/gpt-5.4-nano model.
 *
 * Requires OPENAI_API_KEY env var (used automatically by Vercel AI SDK).
 */
export async function translateFields(params: {
  sourceLang: string;
  targetLang: string;
  entityType: EntityType;
  fields: Record<string, string>;
}): Promise<Record<string, string>> {
  const { sourceLang, targetLang, entityType, fields } = params;
  const schema = buildTranslationSchema(entityType);

  const systemPrompt = [
    "You are a professional translator for a video game website (Game Universe).",
    "You specialize in gaming terminology, game titles, character names, and gaming culture.",
    `Translate the following fields from ${sourceLang} to ${targetLang}.`,
    "Preserve proper nouns, game titles that are commonly kept in their original language, and technical gaming terms.",
    "Adapt the tone to be engaging and appropriate for a gaming audience.",
    "Return only the translated fields, nothing else.",
  ].join(" ");

  const userPrompt = Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const { object } = await generateObject({
      model: "openai/gpt-5.4-nano" as Parameters<typeof generateObject>[0]["model"],
      schema,
      system: systemPrompt,
      prompt: userPrompt,
      abortSignal: controller.signal,
    });

    return object as Record<string, string>;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.error("AI translation timed out", { entityType, sourceLang, targetLang });
      throw new Error("Translation timed out after 30s", { cause: error });
    }
    logger.error("AI translation failed", { entityType, sourceLang, targetLang, error });
    throw error instanceof Error
      ? new Error(`AI translation failed: ${error.message}`, { cause: error })
      : new Error("AI translation failed", { cause: error });
  } finally {
    clearTimeout(timeout);
  }
}
