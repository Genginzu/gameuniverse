import { gateway } from "ai";

import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { untypedTable } from "@/lib/utils/untypedTable";
import type { GatewayCredits, TranslationModelOption } from "@/types/admin-translations";

/** Model used until an admin picks another one (best value in the model benchmark). */
export const DEFAULT_TRANSLATION_MODEL = "deepseek/deepseek-v3.1";

const SETTING_KEY = "translation_model";

/** Converts a per-token USD price string to a per-million-tokens number. */
function perMillion(price: string | undefined): number | null {
  const value = Number(price);
  return price !== undefined && Number.isFinite(value) ? value * 1_000_000 : null;
}

/** Reads the translation model chosen in the admin, or the default one. */
export async function getTranslationModel(): Promise<string> {
  const { data, error } = await untypedTable(getSupabaseAdmin(), "admin_settings")
    .select("value")
    .eq("key", SETTING_KEY)
    .maybeSingle();

  if (error) {
    logger.error("Failed to read translation model setting", { error });
    return DEFAULT_TRANSLATION_MODEL;
  }

  const value = (data as { value: unknown } | null)?.value;
  return typeof value === "string" && value ? value : DEFAULT_TRANSLATION_MODEL;
}

/** Stores the translation model used by the next translations. */
export async function setTranslationModel(modelId: string, userId: string): Promise<void> {
  const { error } = await untypedTable(getSupabaseAdmin(), "admin_settings").upsert(
    { key: SETTING_KEY, value: modelId, updated_at: new Date().toISOString(), updated_by: userId },
    { onConflict: "key" }
  );

  if (error) {
    logger.error("Failed to save translation model setting", { error, modelId });
    throw new Error("Failed to save translation model");
  }
}

/** Lists the language models available on the Vercel AI Gateway, sorted by name. */
export async function listTranslationModels(): Promise<TranslationModelOption[]> {
  const { models } = await gateway.getAvailableModels();

  return models
    .filter((model) => !model.modelType || model.modelType === "language")
    .map((model) => ({
      id: model.id,
      name: model.name,
      inputPricePerMillion: perMillion(model.pricing?.input),
      outputPricePerMillion: perMillion(model.pricing?.output),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Remaining and used Vercel AI Gateway credits, in USD. */
export async function getGatewayCredits(): Promise<GatewayCredits> {
  const { balance, totalUsed } = await gateway.getCredits();
  return { balance: Number(balance) || 0, totalUsed: Number(totalUsed) || 0 };
}
