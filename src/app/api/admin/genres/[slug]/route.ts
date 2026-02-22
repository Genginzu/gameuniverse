import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { genreTranslationSchema } from "@/lib/validations/admin-genre-form";
import { logger } from "@/lib/logger";

// Validation schema for PUT body (slug is immutable, not in body)
const updateGenreSchema = z.object({
  translations: z.array(genreTranslationSchema).min(1, "Au moins une traduction est requise"),
});

/**
 * GET /api/admin/genres/[slug] - Get a single genre with all translations and game count
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Genre slug is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    const { data: genre, error } = await supabase
      .from("genres")
      .select("id, slug, genre_translations(genre_id, language_code, name, description)")
      .eq("slug", slug)
      .single();

    if (error || !genre) {
      return NextResponse.json({ error: "Genre not found" }, { status: 404 });
    }

    // Get game count
    const { count: gameCount, error: countError } = await supabase
      .from("game_genres")
      .select("game_id", { count: "exact", head: true })
      .eq("genre_id", genre.id);

    if (countError) {
      logger.error("Error counting genre games", { error: countError });
    }

    return NextResponse.json({
      genre: {
        id: genre.id,
        slug: genre.slug,
        gameCount: gameCount || 0,
        translations: (genre.genre_translations || []).map((t) => ({
          language_code: t.language_code,
          name: t.name,
          description: t.description || "",
        })),
      },
    });
  } catch (error) {
    logger.error("Error in admin genre GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/genres/[slug] - Update genre translations (slug is immutable)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Genre slug is required" }, { status: 400 });
    }

    const body = await request.json();

    const validationResult = updateGenreSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { translations } = validationResult.data;

    const supabase = await createRouteHandlerClient();

    // Check if genre exists
    const { data: existing, error: checkError } = await supabase
      .from("genres")
      .select("id")
      .eq("slug", slug)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Genre not found" }, { status: 404 });
    }

    // Upsert translations
    const translationRows = translations.map((t) => ({
      genre_id: existing.id,
      language_code: t.language_code,
      name: t.name,
      description: t.description || null,
    }));

    const { error: upsertError } = await supabase
      .from("genre_translations")
      .upsert(translationRows, { onConflict: "genre_id,language_code" });

    if (upsertError) {
      logger.error("Error upserting genre translations", { error: upsertError });
      return NextResponse.json({ error: "Failed to update genre translations" }, { status: 500 });
    }

    // Fetch updated genre with translations
    const { data: updated, error: fetchError } = await supabase
      .from("genres")
      .select("id, slug, genre_translations(genre_id, language_code, name, description)")
      .eq("slug", slug)
      .single();

    if (fetchError || !updated) {
      return NextResponse.json({ error: "Failed to fetch updated genre" }, { status: 500 });
    }

    // Get game count
    const { count: gameCount } = await supabase
      .from("game_genres")
      .select("game_id", { count: "exact", head: true })
      .eq("genre_id", existing.id);

    return NextResponse.json({
      genre: {
        id: updated.id,
        slug: updated.slug,
        gameCount: gameCount || 0,
        translations: (updated.genre_translations || []).map((t) => ({
          language_code: t.language_code,
          name: t.name,
          description: t.description || "",
        })),
      },
    });
  } catch (error) {
    logger.error("Error in admin genre PUT", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/genres/[slug] - Delete a genre
 * Supports ?force=true to delete even if the genre is used by games
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdmin();

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Genre slug is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const supabase = await createRouteHandlerClient();

    // Check if genre exists
    const { data: existing, error: checkError } = await supabase
      .from("genres")
      .select("id, slug")
      .eq("slug", slug)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Genre not found" }, { status: 404 });
    }

    // Check usage in game_genres
    const { count: usageCount, error: usageError } = await supabase
      .from("game_genres")
      .select("game_id", { count: "exact", head: true })
      .eq("genre_id", existing.id);

    if (usageError) {
      logger.error("Error checking genre usage", { error: usageError });
      return NextResponse.json({ error: "Failed to check genre usage" }, { status: 500 });
    }

    const gameCount = usageCount || 0;

    // If genre is in use and force is not set, return 409
    if (gameCount > 0 && !force) {
      return NextResponse.json(
        {
          error: "Genre is in use",
          type: "IN_USE",
          usageCount: gameCount,
          message: `This genre is used by ${gameCount} game(s). Use ?force=true to delete anyway.`,
        },
        { status: 409 }
      );
    }

    // If force is set and genre is in use, delete game_genres references first
    if (gameCount > 0 && force) {
      const { error: cleanupError } = await supabase
        .from("game_genres")
        .delete()
        .eq("genre_id", existing.id);

      if (cleanupError) {
        logger.error("Error cleaning up game_genres", { error: cleanupError });
        return NextResponse.json(
          { error: "Failed to remove genre references from games" },
          { status: 500 }
        );
      }
    }

    // Delete translations first
    const { error: translationDeleteError } = await supabase
      .from("genre_translations")
      .delete()
      .eq("genre_id", existing.id);

    if (translationDeleteError) {
      logger.error("Error deleting genre translations", { error: translationDeleteError });
      return NextResponse.json({ error: "Failed to delete genre translations" }, { status: 500 });
    }

    // Delete the genre
    const { error: deleteError } = await supabase.from("genres").delete().eq("id", existing.id);

    if (deleteError) {
      logger.error("Error deleting genre", { error: deleteError });
      return NextResponse.json({ error: "Failed to delete genre" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in admin genre DELETE", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
