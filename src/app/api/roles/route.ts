import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

/**
 * GET /api/roles - Public endpoint returning roles with character counts
 * Used by the character listing filter panel.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();

    const { data: roles, error } = await supabase
      .from("character_roles")
      .select("id, slug, character_role_translations(language_code, name)")
      .order("slug", { ascending: true });

    if (error) {
      logger.error("Error fetching roles", { error });
      return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
    }

    type RoleRow = {
      id: string;
      slug: string;
      character_role_translations: { language_code: string; name: string }[];
    };

    // Get character counts per role
    const typedRoles = (roles || []) as RoleRow[];
    const roleIds = typedRoles.map((r) => r.id);
    let charCounts: Record<string, number> = {};

    if (roleIds.length > 0) {
      const { data: ccRows } = await supabase
        .from("character_character_roles")
        .select("role_id")
        .in("role_id", roleIds);

      charCounts = ((ccRows || []) as { role_id: string }[]).reduce(
        (acc, row) => {
          acc[row.role_id] = (acc[row.role_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }

    const transformedRoles = typedRoles.map((role) => {
      const tr =
        role.character_role_translations.find((t) => t.language_code === locale) ??
        role.character_role_translations[0];
      return {
        id: role.id,
        slug: role.slug,
        name: tr?.name ?? role.slug,
        characterCount: charCounts[role.id] || 0,
      };
    });

    return NextResponse.json({ roles: transformedRoles });
  } catch (error) {
    logger.error("Error in roles GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
