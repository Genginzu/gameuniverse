import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { adminCommentQuerySchema } from "@/lib/validations/admin-comment-query";
import type { AdminComment } from "@/types/admin-comments";

/** Row shape returned by the Supabase query */
interface CommentListRow {
  id: string;
  user_id: string;
  character_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  characters: {
    id: string;
    character_translations: Array<{ name: string }>;
  } | null;
}

interface ProfileInfo {
  username: string | null;
  email: string | null;
}

/** Truncate plain-text content to an excerpt */
function toExcerpt(text: string, maxLength = 100): string {
  const plain = text.trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength) + "…";
}

function toAdminComment(row: CommentListRow, profilesMap: Map<string, ProfileInfo>): AdminComment {
  const profile = profilesMap.get(row.user_id);
  return {
    id: row.id,
    contentExcerpt: toExcerpt(row.content),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    playerName: profile?.username ?? null,
    playerEmail: profile?.email ?? null,
    characterName: row.characters?.character_translations?.[0]?.name ?? "",
    characterId: row.character_id,
  };
}

/**
 * Fetch profiles for a set of user IDs.
 */
async function fetchProfilesMap(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, ProfileInfo>> {
  const map = new Map<string, ProfileInfo>();
  if (userIds.length === 0) return map;

  const { data } = await supabase.from("profiles").select("id, username, email").in("id", userIds);

  for (const p of data ?? []) {
    map.set(p.id, { username: p.username, email: p.email });
  }

  return map;
}

/**
 * GET /api/admin/comments — Paginated list with search and sort
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const rawParams: Record<string, string | undefined> = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort_by: searchParams.get("sort_by") ?? undefined,
      sort_order: searchParams.get("sort_order") ?? undefined,
    };

    const queryResult = adminCommentQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search, sort_by, sort_order } = queryResult.data;

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    // --- Count query ---
    const totalCount = await countComments(supabase, search);

    if (totalCount === null) {
      return NextResponse.json({ error: "Failed to count comments" }, { status: 500 });
    }

    // --- Data query ---
    const comments = await fetchComments(supabase, {
      search,
      sort_by,
      sort_order,
      offset,
      limit,
    });

    if (comments === null) {
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    // Fetch profiles separately
    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const profilesMap = await fetchProfilesMap(supabase, userIds);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      comments: comments.map((c) => toAdminComment(c, profilesMap)),
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
    console.error("Error in admin comments GET:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Helper: count comments (with optional search) ──

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

async function countComments(
  supabase: SupabaseClient,
  search: string | undefined
): Promise<number | null> {
  if (search?.trim()) {
    const ids = await findMatchingCommentIds(supabase, search.trim());
    return ids === null ? null : ids.length;
  }

  const { count, error } = await supabase
    .from("character_comments")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("Error counting comments:", error);
    return null;
  }

  return count ?? 0;
}

// ── Helper: fetch comments page ──

interface FetchParams {
  search: string | undefined;
  sort_by: string;
  sort_order: string;
  offset: number;
  limit: number;
}

async function fetchComments(
  supabase: SupabaseClient,
  params: FetchParams
): Promise<CommentListRow[] | null> {
  const { search, sort_by, sort_order, offset, limit } = params;

  // When searching, find matching IDs first
  let matchingIds: string[] | undefined;

  if (search?.trim()) {
    const ids = await findMatchingCommentIds(supabase, search.trim());
    if (ids === null) return null;
    if (ids.length === 0) return [];
    matchingIds = ids;
  }

  let query = supabase.from("character_comments").select(
    `id, user_id, character_id, content, created_at, updated_at,
     characters(id, character_translations(name))`
  );

  if (matchingIds) {
    query = query.in("id", matchingIds);
  }

  // Sorting — player_name and character_name require post-sort
  const needsClientSort = sort_by === "player_name" || sort_by === "character_name";
  const dbSortColumn = needsClientSort ? "created_at" : sort_by;

  const { data, error } = await query
    .order(dbSortColumn, { ascending: sort_order === "asc" })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching comments:", error);
    return null;
  }

  const rows = (data ?? []) as unknown as CommentListRow[];

  if (needsClientSort && sort_by === "character_name") {
    return sortRowsByCharacterName(rows, sort_order);
  }

  return rows;
}

/** Find comment IDs matching a search term (player name OR character name) */
async function findMatchingCommentIds(
  supabase: SupabaseClient,
  term: string
): Promise<string[] | null> {
  const pattern = `%${term}%`;

  // Find user IDs matching by username
  const { data: matchingProfiles, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", pattern);

  if (profileError) {
    console.error("Error searching profiles:", profileError);
    return null;
  }

  const matchingUserIds = (matchingProfiles ?? []).map((p) => p.id);

  const ids = new Set<string>();

  // Comments by matching player
  if (matchingUserIds.length > 0) {
    const { data: byPlayer, error: e1 } = await supabase
      .from("character_comments")
      .select("id")
      .in("user_id", matchingUserIds);

    if (e1) {
      console.error("Error searching comments by player:", e1);
      return null;
    }
    for (const c of byPlayer ?? []) ids.add(c.id);
  }

  // Comments by matching character name
  const { data: byCharacter, error: e2 } = await supabase
    .from("character_comments")
    .select("id, characters!inner(character_translations!inner(name))")
    .ilike("characters.character_translations.name", pattern);

  if (e2) {
    console.error("Error searching comments by character:", e2);
    return null;
  }
  for (const c of byCharacter ?? []) ids.add(c.id);

  return [...ids];
}

/** Sort rows by character name (joined field that can't be sorted in Supabase) */
function sortRowsByCharacterName(rows: CommentListRow[], sortOrder: string): CommentListRow[] {
  const ascending = sortOrder === "asc";
  return [...rows].sort((a, b) => {
    const valA = (a.characters?.character_translations?.[0]?.name ?? "").toLowerCase();
    const valB = (b.characters?.character_translations?.[0]?.name ?? "").toLowerCase();
    const cmp = valA.localeCompare(valB);
    return ascending ? cmp : -cmp;
  });
}
