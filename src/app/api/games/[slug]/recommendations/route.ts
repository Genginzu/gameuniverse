import { NextResponse } from "next/server";

import { defineRoute, notFound } from "@/lib/api/route";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { asRecommendationClient } from "@/lib/services/recommendation/client";
import { getRecommendationsForGame } from "@/lib/services/recommendationService";
import { recommendationQuerySchema } from "@/lib/validations/recommendation";

// GET /api/games/[slug]/recommendations?limit=&locale= — games like this one.
// Signed-in callers do not get games from their library or dismissed ones
// (filtered by recommend_similar_games through auth.uid()).
export const GET = defineRoute(
  { auth: "optional", query: recommendationQuerySchema },
  async ({ params, query }) => {
    const supabase = asRecommendationClient(await createRouteHandlerClient());

    const { data: game, error } = await supabase
      .from("games")
      .select("id")
      .eq("slug", params.slug)
      .single();
    if (error || !game) throw notFound("Game not found");

    const gameId = (game as { id: string }).id;
    const recommendations = await getRecommendationsForGame(supabase, gameId, {
      limit: query.limit,
      locale: query.locale,
    });

    return NextResponse.json({
      recommendations,
      sourceGameId: gameId,
      generatedAt: new Date().toISOString(),
    });
  }
);
