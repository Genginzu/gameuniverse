import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { SmartCollectionServerService } from "@/lib/services/smartCollectionServerService";
import { generateSuggestions } from "@/lib/services/smartCollectionService";
import { acceptSuggestionSchema } from "@/lib/validations/collection";
import { AchievementEngine } from "@/lib/services/achievementEngine";
import { logger } from "@/lib/logger";
import type { CollectionSuggestionsResponse } from "@/types/smartCollection";
import { defineRoute } from "@/lib/api/route";

/**
 * GET /api/collections/suggestions
 * Returns auto-generated collection suggestions based on the authenticated
 * user's library. Requires authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const locale = new URL(request.url).searchParams.get("locale") || "fr";

    const [library, collectedGameIds] = await Promise.all([
      SmartCollectionServerService.fetchLibraryForSuggestions(user.id, locale),
      SmartCollectionServerService.fetchCollectedGameIds(user.id),
    ]);
    const suggestions = generateSuggestions(library, {
      excludeGameIds: [...collectedGameIds],
    });

    const response: CollectionSuggestionsResponse = { suggestions };
    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error in collection suggestions GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/collections/suggestions
 * Accept a suggestion: create a collection pre-filled with the given games.
 * Body: { name, gameIds, isPublic? }. Requires authentication.
 */
export const POST = defineRoute(
  {
    auth: "required",
    rateLimit: "collection",
    writesContent: true,
    body: acceptSuggestionSchema,
  },
  async ({ user, body }) => {
    const { name, gameIds, isPublic } = body;
    const collection = await SmartCollectionServerService.createCollectionFromSuggestion(
      user.id,
      name,
      gameIds,
      isPublic
    );

    // Evaluate achievements (non-blocking).
    try {
      await AchievementEngine.evaluate(user.id, "collections");
    } catch (error) {
      logger.error("Achievement evaluation failed", { error });
    }

    return NextResponse.json({ collection }, { status: 201 });
  }
);
