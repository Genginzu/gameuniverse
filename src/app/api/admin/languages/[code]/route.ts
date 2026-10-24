import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { conflict, defineRoute, notFound } from "@/lib/api/route";
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
export const GET = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { code } = params;

  const supabase = await createRouteHandlerClient();

  const { data: language, error } = await supabase
    .from("supported_languages")
    .select("code, name, native_name")
    .eq("code", code)
    .single();

  if (error || !language) throw notFound("Language not found");

  return NextResponse.json({ language });
});

/**
 * PUT /api/admin/languages/[code] - Update a language (name and native_name only, code is immutable)
 */
export const PUT = defineRoute(
  { auth: "admin", body: updateLanguageSchema },
  async ({ params, body }) => {
    const { code } = params;
    const { name, native_name } = body;

    const supabase = await createRouteHandlerClient();

    // Check if language exists
    const { data: existing, error: checkError } = await supabase
      .from("supported_languages")
      .select("code")
      .eq("code", code)
      .single();

    if (checkError || !existing) throw notFound("Language not found");

    // Update the language
    const { data: language, error } = await supabase
      .from("supported_languages")
      .update({ name, native_name: native_name ?? "" })
      .eq("code", code)
      .select("code, name, native_name")
      .single();

    if (error) {
      logger.error("Error updating language", { error });
      return NextResponse.json({ error: "Failed to update language" }, { status: 500 });
    }

    return NextResponse.json({ language });
  }
);

/**
 * DELETE /api/admin/languages/[code] - Delete a language
 * Supports ?force=true to delete even if the language is used by games
 */
export const DELETE = defineRoute({ auth: "admin" }, async ({ request, params }) => {
  const { code } = params;

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  const supabase = await createRouteHandlerClient();

  // Check if language exists
  const { data: existing, error: checkError } = await supabase
    .from("supported_languages")
    .select("code, name, native_name")
    .eq("code", code)
    .single();

  if (checkError || !existing) throw notFound("Language not found");

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
    throw conflict("Language is in use", {
      type: "IN_USE",
      usageCount: gameCount,
      message: `This language is used by ${gameCount} game(s). Use ?force=true to delete anyway.`,
    });
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
});
