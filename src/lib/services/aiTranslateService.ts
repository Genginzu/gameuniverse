import { generateText, Output } from "ai";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { type EntityType } from "@/types/admin-translations";

/**
 * Builds the output schema from the fields actually sent for translation.
 * A source row often fills only part of EDITABLE_FIELDS (e.g. a platform without
 * abbreviation): requiring the missing ones makes the model fail validation.
 */
function buildTranslationSchema(fieldNames: string[]) {
  const shape: Record<string, z.ZodString> = {};
  for (const field of fieldNames) {
    shape[field] = z.string();
  }
  return z.object(shape);
}

/** Entity-specific translation instructions. */
const ENTITY_INSTRUCTIONS: Partial<Record<EntityType, string>> = {
  games: [
    "CRITICAL for the 'title' field: you MUST use the official localized title of the game as published in the target region.",
    "Do NOT literally translate game titles. Video games have official names in each language.",
    "Examples: 'Ice Age: Dawn of the Dinosaurs' → FR: 'L'Âge de glace 3 : Le Temps des dinosaures' (official title), NOT 'L'Âge de glace : La Dérive des dinosaures'.",
    "'The Legend of Zelda: Breath of the Wild' stays 'The Legend of Zelda: Breath of the Wild' in French (official title kept in English).",
    "If you are unsure of the official localized title, keep the original title unchanged.",
  ].join(" "),
  characters: [
    "For the 'name' field: use the official localized character name as used in the target region.",
    "Many character names stay the same across languages, but some have official localizations.",
    "If unsure, keep the original name.",
  ].join(" "),
};

/** Builds the system prompt with entity-specific instructions. */
function buildSystemPrompt(sourceLang: string, targetLang: string, entityType: EntityType): string {
  const base = [
    "You are a professional translator for a video game website (Gamers Universe).",
    "You are an expert in video game culture, titles, and terminology.",
    `Translate the following fields from ${sourceLang} to ${targetLang}.`,
    "Adapt the tone to be engaging and appropriate for a gaming audience.",
    "Return only the translated fields, nothing else.",
  ];

  const entityInstructions = ENTITY_INSTRUCTIONS[entityType];
  if (entityInstructions) {
    base.push(entityInstructions);
  }

  return base.join(" ");
}

/**
 * Translates text fields from a source language to a target language
 * through the Vercel AI Gateway, with the model chosen in the admin.
 *
 * Requires AI_GATEWAY_API_KEY env var (used automatically by the AI SDK).
 */
export async function translateFields(params: {
  model: string;
  sourceLang: string;
  targetLang: string;
  entityType: EntityType;
  fields: Record<string, string>;
}): Promise<Record<string, string>> {
  const { model, sourceLang, targetLang, entityType, fields } = params;
  const schema = buildTranslationSchema(Object.keys(fields));

  const systemPrompt = buildSystemPrompt(sourceLang, targetLang, entityType);

  const userPrompt = Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema }),
      instructions: systemPrompt,
      prompt: userPrompt,
      abortSignal: controller.signal,
    });

    if (!output) {
      throw new Error("AI returned no structured output");
    }

    return output as Record<string, string>;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.error("AI translation timed out", { model, entityType, sourceLang, targetLang });
      throw new Error("Translation timed out after 30s", { cause: error });
    }
    logger.error("AI translation failed", { model, entityType, sourceLang, targetLang, error });
    throw error instanceof Error
      ? new Error(`AI translation failed: ${error.message}`, { cause: error })
      : new Error("AI translation failed", { cause: error });
  } finally {
    clearTimeout(timeout);
  }
}
