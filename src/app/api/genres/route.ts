import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();

    // First, get all genres with their translations
    const { data: genres, error: genresError } = await supabase
      .from("genres")
      .select(
        `
        id,
        slug,
        created_at,
        genre_translations!inner(
          name,
          description
        )
      `
      )
      .eq("genre_translations.language_code", locale);

    if (genresError) {
      logger.error("Error fetching genres", { error: genresError });
      return NextResponse.json(
        { error: "Failed to fetch genres", details: genresError },
        { status: 500 }
      );
    }

    if (!genres || genres.length === 0) {
      return NextResponse.json({
        genres: [],
        locale,
        message: "No genres found",
      });
    }

    // Then get game counts for all genres in one query
    const { data: gameCounts, error: countsError } = await supabase
      .from("game_genres")
      .select("genre_id");

    if (countsError) {
      logger.error("Error fetching game counts", { error: countsError });
    }

    // Count games per genre
    const countsByGenre: Record<string, number> = {};
    if (gameCounts) {
      gameCounts.forEach((item: { genre_id: string }) => {
        countsByGenre[item.genre_id] = (countsByGenre[item.genre_id] || 0) + 1;
      });
    }

    // Transform the data
    interface GenreRow {
      id: string;
      slug: string;
      created_at: string | null;
      genre_translations?: Array<{ name: string; description?: string | null }>;
    }

    const transformedGenres = (genres as GenreRow[]).map((genre) => {
      const translation = genre.genre_translations?.[0];
      return {
        id: genre.id,
        slug: genre.slug,
        name: translation?.name || "Unknown",
        description: translation?.description,
        gameCount: countsByGenre[genre.id] || 0,
        createdAt: genre.created_at,
      };
    });

    // Sort by name
    transformedGenres.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      genres: transformedGenres,
      locale,
    });
  } catch (error) {
    logger.error("Error in genres API", { error });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
