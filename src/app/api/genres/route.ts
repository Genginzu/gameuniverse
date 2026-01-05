import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();

    // Fetch genres with translations and game counts
    const { data: genres, error } = await supabase
      .from("genres")
      .select(
        `
        id,
        slug,
        created_at,
        genre_translations!inner(
          name,
          description
        ),
        game_genres(count)
      `
      )
      .eq("genre_translations.language_code", locale)
      .order("genre_translations(name)", { ascending: true });

    if (error) {
      console.error("Error fetching genres:", error);
      return NextResponse.json({ error: "Failed to fetch genres" }, { status: 500 });
    }

    // Transform the data to include game counts
    const transformedGenres =
      genres?.map((genre: any) => {
        const translation = genre.genre_translations?.[0];
        return {
          id: genre.id,
          slug: genre.slug,
          name: translation?.name || "Unknown",
          description: translation?.description,
          gameCount: genre.game_genres?.length || 0,
          createdAt: genre.created_at,
        };
      }) || [];

    return NextResponse.json({
      genres: transformedGenres,
      locale,
    });
  } catch (error) {
    console.error("Unexpected error in genres API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
