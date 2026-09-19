import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";
import type { AdminCommunity } from "@/types/admin-communities";

// Table not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

const DEFAULT_LIMIT = 20;

interface AdminCommunityRow {
  id: string;
  name: string;
  slug: string;
  visibility: "public" | "private";
  created_at: string;
  owner_id: string;
  community_members: Array<{ id: string }>;
  owner: { username: string | null; email: string | null } | null;
}

/**
 * GET /api/admin/communities — Paginated list of communities for moderation.
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
      .from("communities" as UntypedFrom)
      .select(
        `id, name, slug, visibility, created_at, owner_id,
         community_members(id),
         owner:profiles!communities_owner_id_fkey(username, email)`,
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
          communities: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalCount: 0,
            limit,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }
      logger.error("Error fetching admin communities", { error });
      return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
    }

    const rows = (data ?? []) as unknown as AdminCommunityRow[];
    const communities: AdminCommunity[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      visibility: row.visibility,
      membersCount: row.community_members?.length ?? 0,
      ownerName: row.owner?.username ?? null,
      ownerEmail: row.owner?.email ?? null,
      createdAt: row.created_at,
    }));

    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return NextResponse.json({
      communities,
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
    logger.error("Error in admin communities GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
