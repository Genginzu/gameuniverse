import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";

// Validation schema for PUT body (code is not modifiable)
const updateLanguageSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  native_name: z
    .string()
    .max(100, "Le nom natif ne peut pas dépasser 100 caractères")
    .optional()
    .or(z.literal("")),
});

/**
 * GET /api/admin/languages/[code] - Get a single language by code
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    await requireAdmin();

    const { code } = await params;

    if (!code) {
      return NextResponse.json({ error: "Language code is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    const { data: language, error } = await supabase
      .from("supported_languages")
      .select("code, name, native_name")
      .eq("code", code)
      .single();

    if (error || !language) {
      return NextResponse.json({ error: "Language not found" }, { status: 404 });
    }

    return NextResponse.json({ language });
  } catch (error) {
    logger.error("Error in admin language GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/languages/[code] - Update a language (name and native_name only, code is immutable)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    await requireAdmin();

    const { code } = await params;

    if (!code) {
      return NextResponse.json({ error: "Language code is required" }, { status: 400 });
    }

    const body = await request.json();

    // Server-side validation
    const validationResult = updateLanguageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, native_name } = validationResult.data;

    const supabase = await createRouteHandlerClient();

    // Check if language exists
    const { data: existing, error: checkError } = await supabase
      .from("supported_languages")
      .select("code")
      .eq("code", code)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Language not found" }, { status: 404 });
    }

    // Update the language
    const { data: language, error } = await supabase
      .from("supported_languages")
      .update({ name, native_name: native_name || null })
      .eq("code", code)
      .select("code, name, native_name")
      .single();

    if (error) {
      logger.error("Error updating language", { error });
      return NextResponse.json({ error: "Failed to update language" }, { status: 500 });
    }

    return NextResponse.json({ language });
  } catch (error) {
    logger.error("Error in admin language PUT", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/languages/[code] - Delete a language
 * Supports ?force=true to delete even if the language is used by games
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await requireAdmin();

    const { code } = await params;

    if (!code) {
      return NextResponse.json({ error: "Language code is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const supabase = await createRouteHandlerClient();

    // Check if language exists
    const { data: existing, error: checkError } = await supabase
      .from("supported_languages")
      .select("code, name, native_name")
      .eq("code", code)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Language not found" }, { status: 404 });
    }

    // Check usage in game_languages
    const { count: usageCount, error: usageError } = await supabase
      .from("game_languages")
      .select("game_id", { count: "exact", head: true })
      .eq("language_code", code);

    if (usageError) {
      logger.error("Error checking language usage", { error: usageError });
      return NextResponse.json({ error: "Failed to check language usage" }, { status: 500 });
    }

    const gameCount = usageCount || 0;

    // If language is in use and force is not set, return 409
    if (gameCount > 0 && !force) {
      return NextResponse.json(
        {
          error: "Language is in use",
          type: "IN_USE",
          usageCount: gameCount,
          message: `This language is used by ${gameCount} game(s). Use ?force=true to delete anyway.`,
        },
        { status: 409 }
      );
    }

    // If force is set and language is in use, delete game_languages references first
    if (gameCount > 0 && force) {
      const { error: cleanupError } = await supabase
        .from("game_languages")
        .delete()
        .eq("language_code", code);

      if (cleanupError) {
        logger.error("Error cleaning up game_languages", { error: cleanupError });
        return NextResponse.json(
          { error: "Failed to remove language references from games" },
          { status: 500 }
        );
      }
    }

    // Delete the language
    const { error: deleteError } = await supabase
      .from("supported_languages")
      .delete()
      .eq("code", code);

    if (deleteError) {
      logger.error("Error deleting language", { error: deleteError });
      return NextResponse.json({ error: "Failed to delete language" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in admin language DELETE", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
