import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getPersonalRecommendations } from "@/lib/services/recommendationService";
import { fetchUserLibraryGameIds } from "@/lib/services/recommendation/dataFetchers";
import type { PersonalRecommendationsResponse } from "@/types/recommendation";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse optional limit query param (default 10, fallback to 10 if invalid)
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    let limit = 10;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = parsed;
      }
    }

    const [recommendations, libraryGameIds] = await Promise.all([
      getPersonalRecommendations(user.id, { limit }),
      fetchUserLibraryGameIds(user.id),
    ]);

    const response: PersonalRecommendationsResponse = {
      recommendations,
      basedOnGameCount: libraryGameIds.length,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error computing personal recommendations:", error);
    return NextResponse.json({ error: "Failed to compute recommendations" }, { status: 500 });
  }
}
