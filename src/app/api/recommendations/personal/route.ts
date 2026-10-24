import { NextResponse } from "next/server";

import { defineRoute } from "@/lib/api/route";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { asRecommendationClient } from "@/lib/services/recommendation/client";
import {
  countLibraryGames,
  getPersonalRecommendations,
} from "@/lib/services/recommendationService";
import { recommendationQuerySchema } from "@/lib/validations/recommendation";
import type { PersonalRecommendationsResponse } from "@/types/recommendation";

// GET /api/recommendations/personal?limit=&locale= — scored by recommend_games_for_me
// in one database pass, rate limited because each call scores the catalogue.
export const GET = defineRoute(
  { auth: "required", rateLimit: "recommendation", query: recommendationQuerySchema },
  async ({ user, query }) => {
    const supabase = asRecommendationClient(await createRouteHandlerClient());

    const [recommendations, basedOnGameCount] = await Promise.all([
      getPersonalRecommendations(supabase, { limit: query.limit, locale: query.locale }),
      countLibraryGames(supabase, user.id),
    ]);

    const response: PersonalRecommendationsResponse = {
      recommendations,
      basedOnGameCount,
      generatedAt: new Date().toISOString(),
    };
    return NextResponse.json(response);
  }
);
