import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { platformTranslationSchema } from "@/lib/validations/admin-platform-form";
import { logger } from "@/lib/logger";

// Validation schema for PUT body
const updatePlatformSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z]([a-z0-9-]*[a-z0-9])?$/)
    .optional(),
  iconUrl: z.string().url().optional().or(z.literal("")),
  translations: z.array(platformTranslationSchema).min(1, "Au moins une traduction est requise"),
});

/**
 * GET /api/admin/platforms/[slug] - Get a single platform with translations and game count
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Platform slug is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    const { data: platform, error } = await supabase
      .from("platforms")
      .select(
        "id, slug, icon_url, platform_translations(platform_id, language_code, name, abbreviation)"
      )
      .eq("slug", slug)
      .single();

    if (error || !platform) {
      return NextResponse.json({ error: "Platform not found" }, { status: 404 });
    }

    // Get game count
    const { count: gameCount, error: countError } = await supabase
      .from("game_platforms")
      .select("game_id", { count: "exact", head: true })
      .eq("platform_id", platform.id);

    if (countError) {
      logger.error("Error counting platform games", { error: countError });
    }

    return NextResponse.json({
      platform: {
        id: platform.id,
        slug: platform.slug,
        iconUrl: platform.icon_url || undefined,
        gameCount: gameCount || 0,
        translations: (platform.platform_translations || []).map((t) => ({
          language_code: t.language_code,
          name: t.name,
          abbreviation: t.abbreviation || undefined,
        })),
      },
    });
  } catch (error) {
    logger.error("Error in admin platform GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/platforms/[slug] - Update platform slug, icon, and translations
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Platform slug is required" }, { status: 400 });
    }

    const body = await request.json();

    const validationResult = updatePlatformSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { slug: newSlug, iconUrl, translations } = validationResult.data;

    const supabase = await createRouteHandlerClient();

    // Check if platform exists
    const { data: existing, error: checkError } = await supabase
      .from("platforms")
      .select("id")
      .eq("slug", slug)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Platform not found" }, { status: 404 });
    }

    // Update platform fields if slug or icon changed
    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (newSlug && newSlug !== slug) updateFields.slug = newSlug;
    if (iconUrl !== undefined) updateFields.icon_url = iconUrl || null;

    const { error: updateError } = await supabase
      .from("platforms")
      .update(updateFields)
      .eq("id", existing.id);

    if (updateError) {
      logger.error("Error updating platform", { error: updateError });

      if (updateError.code === "23505") {
        return NextResponse.json(
          { error: "A platform with this slug already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: "Failed to update platform" }, { status: 500 });
    }

    // Upsert translations
    const translationRows = translations.map((t) => ({
      platform_id: existing.id,
      language_code: t.language_code,
      name: t.name,
      abbreviation: t.abbreviation || null,
    }));

    const { error: upsertError } = await supabase
      .from("platform_translations")
      .upsert(translationRows, { onConflict: "platform_id,language_code" });

    if (upsertError) {
      logger.error("Error upserting platform translations", { error: upsertError });
      return NextResponse.json(
        { error: "Failed to update platform translations" },
        { status: 500 }
      );
    }

    // Fetch updated platform
    const finalSlug = newSlug || slug;
    const { data: updated, error: fetchError } = await supabase
      .from("platforms")
      .select(
        "id, slug, icon_url, platform_translations(platform_id, language_code, name, abbreviation)"
      )
      .eq("slug", finalSlug)
      .single();

    if (fetchError || !updated) {
      return NextResponse.json({ error: "Failed to fetch updated platform" }, { status: 500 });
    }

    // Get game count
    const { count: gameCount } = await supabase
      .from("game_platforms")
      .select("game_id", { count: "exact", head: true })
      .eq("platform_id", existing.id);

    return NextResponse.json({
      platform: {
        id: updated.id,
        slug: updated.slug,
        iconUrl: updated.icon_url || undefined,
        gameCount: gameCount || 0,
        translations: (updated.platform_translations || []).map((t) => ({
          language_code: t.language_code,
          name: t.name,
          abbreviation: t.abbreviation || undefined,
        })),
      },
    });
  } catch (error) {
    logger.error("Error in admin platform PUT", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/platforms/[slug] - Delete a platform with cascade
 * Supports ?force=true to delete even if the platform is used by games
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdmin();

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Platform slug is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const supabase = await createRouteHandlerClient();

    // Check if platform exists
    const { data: existing, error: checkError } = await supabase
      .from("platforms")
      .select("id, slug")
      .eq("slug", slug)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Platform not found" }, { status: 404 });
    }

    // Check usage in game_platforms
    const { count: usageCount, error: usageError } = await supabase
      .from("game_platforms")
      .select("game_id", { count: "exact", head: true })
      .eq("platform_id", existing.id);

    if (usageError) {
      logger.error("Error checking platform usage", { error: usageError });
      return NextResponse.json({ error: "Failed to check platform usage" }, { status: 500 });
    }

    const gameCount = usageCount || 0;

    // If platform is in use and force is not set, return 409
    if (gameCount > 0 && !force) {
      return NextResponse.json(
        {
          error: "Platform is in use",
          type: "IN_USE",
          usageCount: gameCount,
          message: `This platform is used by ${gameCount} game(s). Use ?force=true to delete anyway.`,
        },
        { status: 409 }
      );
    }

    // If force is set and platform is in use, delete game_platforms references first
    if (gameCount > 0 && force) {
      const { error: cleanupError } = await supabase
        .from("game_platforms")
        .delete()
        .eq("platform_id", existing.id);

      if (cleanupError) {
        logger.error("Error cleaning up game_platforms", { error: cleanupError });
        return NextResponse.json(
          { error: "Failed to remove platform references from games" },
          { status: 500 }
        );
      }
    }

    // Delete translations first
    const { error: translationDeleteError } = await supabase
      .from("platform_translations")
      .delete()
      .eq("platform_id", existing.id);

    if (translationDeleteError) {
      logger.error("Error deleting platform translations", { error: translationDeleteError });
      return NextResponse.json(
        { error: "Failed to delete platform translations" },
        { status: 500 }
      );
    }

    // Delete the platform
    const { error: deleteError } = await supabase.from("platforms").delete().eq("id", existing.id);

    if (deleteError) {
      logger.error("Error deleting platform", { error: deleteError });
      return NextResponse.json({ error: "Failed to delete platform" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in admin platform DELETE", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
