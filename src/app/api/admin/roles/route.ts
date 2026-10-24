import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { conflict, defineRoute } from "@/lib/api/route";
import { roleQuerySchema, adminRoleFormSchema } from "@/lib/validations/admin-role-form";
import { logger } from "@/lib/logger";
import { ilikeAnyFilter } from "@/lib/utils/postgrestFilter";

/**
 * GET /api/admin/roles - List roles with pagination, search, sort, and character count
 */
export const GET = defineRoute({ auth: "admin", query: roleQuerySchema }, async ({ query }) => {
  const { page, limit, search, sort_by, sort_order, locale } = query;
  const supabase = await createRouteHandlerClient();
  const offset = (page - 1) * limit;

  // character_roles / character_role_translations / character_character_roles
  // not in generated Supabase types — use untyped client for these tables
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untypedSupabase = supabase as any;

  // Search by translated name
  let searchRoleIds: string[] | null = null;
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    const { data: matchingTranslations } = await untypedSupabase
      .from("character_role_translations")
      .select("role_id")
      .eq("language_code", locale)
      .ilike("name", term);
    searchRoleIds = ((matchingTranslations || []) as { role_id: string }[])
      .map((t) => t.role_id)
      .filter(Boolean);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applySearchFilter = (dbQuery: any) => {
    if (!search?.trim()) return dbQuery;
    const term = `%${search.trim()}%`;
    if (searchRoleIds && searchRoleIds.length > 0) {
      return dbQuery.or(`${ilikeAnyFilter(["slug"], search)},id.in.(${searchRoleIds.join(",")})`);
    }
    return dbQuery.ilike("slug", term);
  };

  // Count
  const { count: totalCount, error: countError } = await applySearchFilter(
    untypedSupabase.from("character_roles").select("id", { count: "exact", head: true })
  );
  if (countError) {
    logger.error("Error counting roles", { error: countError });
    return NextResponse.json({ error: "Failed to count roles" }, { status: 500 });
  }

  // Data query
  let dataQuery = applySearchFilter(
    untypedSupabase
      .from("character_roles")
      .select("id, slug, character_role_translations(role_id, language_code, name, description)")
  );

  if (sort_by === "slug") {
    dataQuery = dataQuery
      .order("slug", { ascending: sort_order === "asc" })
      .range(offset, offset + limit - 1);
  }

  const { data: rolesRaw, error: dataError } = await dataQuery;
  if (dataError) {
    logger.error("Error fetching roles", { error: dataError });
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
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
  const typedRoles = (rolesRaw || []) as RoleRow[];

  // Character counts
  const roleIds = typedRoles.map((r) => r.id);
  let charCounts: Record<string, number> = {};
  if (roleIds.length > 0) {
    const { data: ccRows } = await untypedSupabase
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

  let roles = typedRoles.map((r) => ({
    id: r.id,
    slug: r.slug,
    characterCount: charCounts[r.id] || 0,
    translations: (r.character_role_translations || []).map((t) => ({
      language_code: t.language_code,
      name: t.name,
      description: t.description || "",
    })),
  }));

  if (sort_by === "name") {
    roles.sort((a, b) => {
      const nameA = a.translations.find((t) => t.language_code === locale)?.name || a.slug;
      const nameB = b.translations.find((t) => t.language_code === locale)?.name || b.slug;
      return sort_order === "asc" ? nameA.localeCompare(nameB) : -nameA.localeCompare(nameB);
    });
    roles = roles.slice(offset, offset + limit);
  }

  const totalPages = Math.ceil((totalCount || 0) / limit);
  return NextResponse.json({
    roles,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount: totalCount || 0,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
});

/**
 * POST /api/admin/roles - Create a new role with translations
 */
export const POST = defineRoute({ auth: "admin", body: adminRoleFormSchema }, async ({ body }) => {
  const { slug, translations } = body;
  const supabase = await createRouteHandlerClient();

  // character_roles / character_role_translations not in generated Supabase types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untypedSupabase = supabase as any;

  const { data: roleData, error: roleError } = await untypedSupabase
    .from("character_roles")
    .insert({ slug })
    .select("id, slug")
    .single();

  const role = roleData as { id: string; slug: string } | null;

  if (roleError || !role) {
    if (roleError?.code === "23505") throw conflict("A role with this slug already exists");
    if (roleError) logger.error("Error creating role", { error: roleError });
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }

  const translationRows = translations.map((t) => ({
    role_id: role.id,
    language_code: t.language_code,
    name: t.name,
    description: t.description || null,
  }));

  const { error: translationError } = await untypedSupabase
    .from("character_role_translations")
    .insert(translationRows);

  if (translationError) {
    logger.error("Error creating role translations", { error: translationError });
    await untypedSupabase.from("character_roles").delete().eq("id", role.id);
    return NextResponse.json({ error: "Failed to create role translations" }, { status: 500 });
  }

  return NextResponse.json(
    {
      role: {
        id: role.id,
        slug: role.slug,
        characterCount: 0,
        translations: translations.map((t) => ({
          language_code: t.language_code,
          name: t.name,
          description: t.description || "",
        })),
      },
    },
    { status: 201 }
  );
});
