import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { roleTranslationSchema } from "@/lib/validations/admin-role-form";
import { logger } from "@/lib/logger";

const updateRoleSchema = z.object({
  translations: z.array(roleTranslationSchema).min(1, "Au moins une traduction est requise"),
});

/**
 * GET /api/admin/roles/[slug]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();
    const { slug } = await params;
    if (!slug) return NextResponse.json({ error: "Role slug is required" }, { status: 400 });

    const supabase = await createRouteHandlerClient();
    // character_roles tables not in generated Supabase types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    type RoleRow = {
      id: string;
      slug: string;
      character_role_translations: {
        role_id: string;
        language_code: string;
        name: string;
        description: string;
      }[];
    };

    const { data: roleData, error } = await db
      .from("character_roles")
      .select("id, slug, character_role_translations(role_id, language_code, name, description)")
      .eq("slug", slug)
      .single();

    const role = roleData as RoleRow | null;
    if (error || !role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

    const { count: characterCount } = await db
      .from("character_character_roles")
      .select("character_id", { count: "exact", head: true })
      .eq("role_id", role.id);

    return NextResponse.json({
      role: {
        id: role.id,
        slug: role.slug,
        characterCount: characterCount || 0,
        translations: (role.character_role_translations || []).map((t) => ({
          language_code: t.language_code,
          name: t.name,
          description: t.description || "",
        })),
      },
    });
  } catch (error) {
    logger.error("Error in admin role GET", { error });
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/roles/[slug] - Update role translations (slug is immutable)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();
    const { slug } = await params;
    if (!slug) return NextResponse.json({ error: "Role slug is required" }, { status: 400 });

    const body = await request.json();
    const validationResult = updateRoleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { translations } = validationResult.data;
    const supabase = await createRouteHandlerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: existingData, error: checkError } = await db
      .from("character_roles")
      .select("id")
      .eq("slug", slug)
      .single();

    const existing = existingData as { id: string } | null;
    if (checkError || !existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const translationRows = translations.map((t) => ({
      role_id: existing.id,
      language_code: t.language_code,
      name: t.name,
      description: t.description || null,
    }));

    const { error: upsertError } = await db
      .from("character_role_translations")
      .upsert(translationRows, { onConflict: "role_id,language_code" });

    if (upsertError) {
      logger.error("Error upserting role translations", { error: upsertError });
      return NextResponse.json({ error: "Failed to update role translations" }, { status: 500 });
    }

    type RoleRow = {
      id: string;
      slug: string;
      character_role_translations: {
        role_id: string;
        language_code: string;
        name: string;
        description: string;
      }[];
    };

    const { data: updatedData, error: fetchError } = await db
      .from("character_roles")
      .select("id, slug, character_role_translations(role_id, language_code, name, description)")
      .eq("slug", slug)
      .single();

    const updated = updatedData as RoleRow | null;
    if (fetchError || !updated) {
      return NextResponse.json({ error: "Failed to fetch updated role" }, { status: 500 });
    }

    const { count: characterCount } = await db
      .from("character_character_roles")
      .select("character_id", { count: "exact", head: true })
      .eq("role_id", existing.id);

    return NextResponse.json({
      role: {
        id: updated.id,
        slug: updated.slug,
        characterCount: characterCount || 0,
        translations: (updated.character_role_translations || []).map((t) => ({
          language_code: t.language_code,
          name: t.name,
          description: t.description || "",
        })),
      },
    });
  } catch (error) {
    logger.error("Error in admin role PUT", { error });
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/roles/[slug] - Delete a role
 * Supports ?force=true to delete even if the role is used by characters
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdmin();
    const { slug } = await params;
    if (!slug) return NextResponse.json({ error: "Role slug is required" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const supabase = await createRouteHandlerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: existingData, error: checkError } = await db
      .from("character_roles")
      .select("id, slug")
      .eq("slug", slug)
      .single();

    const existing = existingData as { id: string; slug: string } | null;
    if (checkError || !existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const { count: usageCount, error: usageError } = await db
      .from("character_character_roles")
      .select("character_id", { count: "exact", head: true })
      .eq("role_id", existing.id);

    if (usageError) {
      logger.error("Error checking role usage", { error: usageError });
      return NextResponse.json({ error: "Failed to check role usage" }, { status: 500 });
    }

    const characterCount = usageCount || 0;

    if (characterCount > 0 && !force) {
      return NextResponse.json(
        {
          error: "Role is in use",
          type: "IN_USE",
          usageCount: characterCount,
          message: `This role is used by ${characterCount} character(s). Use ?force=true to delete anyway.`,
        },
        { status: 409 }
      );
    }

    if (characterCount > 0 && force) {
      const { error: cleanupError } = await db
        .from("character_character_roles")
        .delete()
        .eq("role_id", existing.id);

      if (cleanupError) {
        logger.error("Error cleaning up character_character_roles", { error: cleanupError });
        return NextResponse.json(
          { error: "Failed to remove role references from characters" },
          { status: 500 }
        );
      }
    }

    const { error: translationDeleteError } = await db
      .from("character_role_translations")
      .delete()
      .eq("role_id", existing.id);

    if (translationDeleteError) {
      logger.error("Error deleting role translations", { error: translationDeleteError });
      return NextResponse.json({ error: "Failed to delete role translations" }, { status: 500 });
    }

    const { error: deleteError } = await db.from("character_roles").delete().eq("id", existing.id);

    if (deleteError) {
      logger.error("Error deleting role", { error: deleteError });
      return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in admin role DELETE", { error });
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
