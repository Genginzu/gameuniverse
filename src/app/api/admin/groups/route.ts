import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { fetchUserEmails } from "@/lib/services/userEmailsServerService";
import { logger } from "@/lib/logger";
import type { AdminGroup } from "@/types/admin-groups";

// Table not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

const DEFAULT_LIMIT = 20;

interface AdminGroupRow {
  id: string;
  name: string;
  slug: string;
  visibility: "public" | "private";
  created_at: string;
  owner_id: string;
  group_members: Array<{ id: string }>;
  owner: { username: string | null } | null;
}

/**
 * GET /api/admin/groups — Paginated list of groups for moderation.
 * Supports search by name and sort by created_at/name.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10));
    const search = searchParams.get("search") ?? undefined;
    const sortBy = searchParams.get("sort_by") ?? "created_at";
    const sortOrder = searchParams.get("sort_order") === "asc" ? "asc" : "desc";

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("groups" as UntypedFrom)
      .select(
        `id, name, slug, visibility, created_at, owner_id,
         group_members(id),
         owner:profiles!groups_owner_id_fkey(username)`,
        { count: "exact" }
      );

    if (search?.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const sortColumn = sortBy === "name" ? "name" : "created_at";
    query = query
      .order(sortColumn, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      if (error.code === "PGRST205") {
        return NextResponse.json({
          groups: [],
          pagination: { currentPage: 1, totalPages: 1, totalCount: 0, limit, hasNextPage: false, hasPreviousPage: false },
        });
      }
      logger.error("Error fetching admin groups", { error });
      return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
    }

    const rows = (data ?? []) as unknown as AdminGroupRow[];
    const ownerEmails = await fetchUserEmails(rows.map((row) => row.owner_id));
    const groups: AdminGroup[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      visibility: row.visibility,
      membersCount: row.group_members?.length ?? 0,
      ownerName: row.owner?.username ?? null,
      ownerEmail: ownerEmails.get(row.owner_id) ?? null,
      createdAt: row.created_at,
    }));

    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return NextResponse.json({
      groups,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    logger.error("Error in admin groups GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
