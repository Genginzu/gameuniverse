import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";

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
      console.error("Error fetching genres:", genresError);
      return NextResponse.json(
        { error: "Failed to fetch genres", details: genresError },
        { status: 500 }
      );
    }

    console.log("Fetched genres:", genres?.length || 0);

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
      console.error("Error fetching game counts:", countsError);
    }

    // Count games per genre
    const countsByGenre = {};
    if (gameCounts) {
      gameCounts.forEach((item) => {
        countsByGenre[item.genre_id] = (countsByGenre[item.genre_id] || 0) + 1;
      });
    }

    // Transform the data
    const transformedGenres = genres.map((genre: any) => {
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

    console.log("Transformed genres:", transformedGenres.length);

    return NextResponse.json({
      genres: transformedGenres,
      locale,
    });
  } catch (error) {
    console.error("Unexpected error in genres API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
