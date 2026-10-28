import { NextResponse } from "next/server";
import { defineRoute, validationError } from "@/lib/api/route";
import { translationModelBodySchema } from "@/lib/validations/admin-translation";
import {
  getGatewayCredits,
  getTranslationModel,
  listTranslationModels,
  setTranslationModel,
} from "@/lib/services/translationAiSettingsService";
import { logger } from "@/lib/logger";
import type { TranslationAiSettings } from "@/types/admin-translations";

export const dynamic = "force-dynamic";

/** Resolves a gateway call to null on failure: the page still works without it. */
async function orNull<T>(promise: Promise<T>, what: string): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    logger.error(`AI Gateway ${what} unavailable`, { error });
    return null;
  }
}

/**
 * GET /api/admin/translations/ai-settings
 * Current translation model, models available on the Vercel AI Gateway and remaining credits.
 */
export const GET = defineRoute({ auth: "admin" }, async () => {
  const [model, models, credits] = await Promise.all([
    getTranslationModel(),
    orNull(listTranslationModels(), "models"),
    orNull(getGatewayCredits(), "credits"),
  ]);

  const body: TranslationAiSettings = { model, models: models ?? [], credits };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store, max-age=0" } });
});

/**
 * PUT /api/admin/translations/ai-settings
 * Changes the model used by the next translations. Only gateway language models are accepted.
 */
export const PUT = defineRoute(
  { auth: "admin", body: translationModelBodySchema },
  async ({ body, user }) => {
    const models = await orNull(listTranslationModels(), "models");
    if (!models) {
      return NextResponse.json({ error: "AI Gateway unavailable" }, { status: 502 });
    }
    if (!models.some((m) => m.id === body.model)) {
      throw validationError(undefined, "Unknown AI Gateway model");
    }

    await setTranslationModel(body.model, user.id);
    return NextResponse.json({ model: body.model });
  }
);
