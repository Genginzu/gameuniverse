import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type {
  CreateGroupInput,
  GroupDetail,
  GroupMemberRole,
  GroupSearchParams,
  GroupSummary,
  UpdateGroupInput,
} from "@/types/group";

const PAGE_SIZE = 20;

// Tables not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

interface GroupRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  visibility: "public" | "private";
  game_id: string | null;
  genre_id: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  games: { game_translations: Array<{ title: string }> } | null;
  genres: { genre_translations: Array<{ name: string }> } | null;
  group_members: Array<{ id: string }>;
}

/**
 * Server-side service for groups: search/listing, detail, and CRUD.
 * Used by API routes under /api/groups.
 */
export class GroupServerService {
  /** Generate a URL-safe, globally unique slug from a group name. */
  static async generateUniqueSlug(name: string): Promise<string> {
    const base = generateSlug(name);
    const supabase = await createRouteHandlerClient();

    let candidate = base;
    let suffix = 1;
    while (true) {
      const { data, error } = await supabase
        .from("groups" as UntypedFrom)
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();

      if (error && error.code !== "PGRST205") {
        logger.error("Failed to check group slug uniqueness", { error: error.message });
        break;
      }
      if (!data) break;

      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    return candidate;
  }

  /** List groups the given player is a member of, sorted alphabetically by name. */
  static async fetchMyGroups(playerId: string): Promise<GroupSummary[]> {
    const supabase = await createRouteHandlerClient();

    const { data: memberships, error: membershipsError } = await supabase
      .from("group_members" as UntypedFrom)
      .select("group_id")
      .eq("player_id", playerId);

    if (membershipsError) {
      if (membershipsError.code === "PGRST205") return [];
      logger.error("Failed to fetch group memberships", {
        error: membershipsError.message,
        playerId,
      });
      throw new Error(membershipsError.message ?? "Failed to fetch my groups");
    }

    const groupIds = ((memberships ?? []) as unknown as Array<{ group_id: string }>).map(
      (row) => row.group_id
    );
    if (groupIds.length === 0) return [];

    const { data, error } = await supabase
      .from("groups" as UntypedFrom)
      .select(
        `id, name, slug, description, image_url, visibility, game_id, genre_id, owner_id,
         created_at, updated_at,
         games(game_translations(title)), genres(genre_translations(name)), group_members(id)`
      )
      .in("id", groupIds)
      .order("name", { ascending: true });

    if (error) {
      if (error.code === "PGRST205") return [];
      logger.error("Failed to fetch my groups", { error: error.message, playerId });
      throw new Error(error.message ?? "Failed to fetch my groups");
    }

    const rows = (data ?? []) as unknown as GroupRow[];
    return rows.map(transformGroupRow);
  }

  /** Search/list groups with optional filters, paginated. Public groups only. */
  static async searchGroups(
    params: GroupSearchParams
  ): Promise<{ groups: GroupSummary[]; totalCount: number }> {
    const supabase = await createRouteHandlerClient();
    const page = params.page && params.page >= 1 ? params.page : 1;
    const offset = (page - 1) * PAGE_SIZE;

    let query = supabase
      .from("groups" as UntypedFrom)
      .select(
        `id, name, slug, description, image_url, visibility, game_id, genre_id, owner_id,
         created_at, updated_at,
         games(game_translations(title)), genres(genre_translations(name)), group_members(id)`,
        { count: "exact" }
      )
      .eq("visibility", "public");

    if (params.search?.trim()) {
      query = query.ilike("name", `%${params.search.trim()}%`);
    }
    if (params.gameId) {
      query = query.eq("game_id", params.gameId);
    }
    if (params.genreId) {
      query = query.eq("genre_id", params.genreId);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

    const { data, error, count } = await query;

    if (error) {
      if (error.code === "PGRST205") return { groups: [], totalCount: 0 };
      logger.error("Failed to search groups", { error: error.message });
      throw new Error(error.message ?? "Failed to search groups");
    }

    const rows = (data ?? []) as unknown as GroupRow[];
    return { groups: rows.map(transformGroupRow), totalCount: count ?? 0 };
  }

  /** Fetch a single group by slug, including the viewer's role if any. */
  static async fetchGroupBySlug(slug: string, viewerId?: string): Promise<GroupDetail | null> {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("groups" as UntypedFrom)
      .select(
        `id, name, slug, description, image_url, visibility, game_id, genre_id, owner_id,
         created_at, updated_at,
         games(game_translations(title)), genres(genre_translations(name)), group_members(id),
         owner:profiles!groups_owner_id_fkey(id, username, avatar_url)`
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST205") return null;
      logger.error("Failed to fetch group by slug", { error: error.message, slug });
      throw new Error(error.message ?? "Failed to fetch group");
    }
    if (!data) return null;

    const row = data as unknown as GroupRow & {
      owner: { id: string; username: string | null; avatar_url: string | null } | null;
    };

    let viewerRole: GroupMemberRole | null = null;
    if (viewerId) {
      const { data: memberRow } = await supabase
        .from("group_members" as UntypedFrom)
        .select("role")
        .eq("group_id", row.id)
        .eq("player_id", viewerId)
        .maybeSingle();
      viewerRole = (memberRow as { role: GroupMemberRole } | null)?.role ?? null;
    }

    return {
      ...transformGroupRow(row),
      owner: {
        id: row.owner?.id ?? row.owner_id,
        username: row.owner?.username ?? null,
        avatarUrl: row.owner?.avatar_url ?? null,
      },
      viewerRole,
    };
  }

  /** Return { id, visibility, ownerId } for a group by slug, or null if not found. */
  static async getGroupAccess(
    slug: string
  ): Promise<{ id: string; visibility: "public" | "private"; ownerId: string } | null> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("groups" as UntypedFrom)
      .select("id, visibility, owner_id")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    const row = data as unknown as { id: string; visibility: "public" | "private"; owner_id: string };
    return { id: row.id, visibility: row.visibility, ownerId: row.owner_id };
  }

  /** Create a new group. The creator is auto-added as owner via DB trigger. */
  static async createGroup(ownerId: string, input: CreateGroupInput): Promise<GroupDetail> {
    const supabase = await createRouteHandlerClient();
    const slug = await this.generateUniqueSlug(input.name);

    const { data, error } = await supabase
      .from("groups" as UntypedFrom)
      .insert({
        name: input.name,
        slug,
        description: input.description ?? null,
        image_url: input.imageUrl ?? null,
        visibility: "private",
        game_id: input.gameId ?? null,
        genre_id: input.genreId ?? null,
        owner_id: ownerId,
      })
      .select("slug")
      .single();

    if (error) {
      logger.error("Failed to create group", { error: error.message });
      throw new Error(error.message ?? "Failed to create group");
    }

    const created = await this.fetchGroupBySlug((data as unknown as { slug: string }).slug, ownerId);
    if (!created) throw new Error("Group created but could not be fetched");
    return created;
  }

  /** Update a group. Caller must have verified owner/admin role beforehand. */
  static async updateGroup(slug: string, input: UpdateGroupInput): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const payload: Record<string, unknown> = {};

    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description;
    if (input.imageUrl !== undefined) payload.image_url = input.imageUrl;
    if (input.gameId !== undefined) payload.game_id = input.gameId;
    if (input.genreId !== undefined) payload.genre_id = input.genreId;

    const { error } = await supabase.from("groups" as UntypedFrom).update(payload).eq("slug", slug);

    if (error) {
      logger.error("Failed to update group", { error: error.message, slug });
      throw new Error(error.message ?? "Failed to update group");
    }
  }

  /** Delete a group. Caller must have verified owner role beforehand. */
  static async deleteGroup(slug: string): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase.from("groups" as UntypedFrom).delete().eq("slug", slug);

    if (error) {
      logger.error("Failed to delete group", { error: error.message, slug });
      throw new Error(error.message ?? "Failed to delete group");
    }
  }
}

/** Generate a URL-safe slug from a group name (same algorithm as collections). */
export function generateSlug(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "group";
}

/** Transform a raw Supabase group row into a GroupSummary. */
function transformGroupRow(row: GroupRow): GroupSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    visibility: row.visibility,
    gameId: row.game_id,
    genreId: row.genre_id,
    gameName: row.games?.game_translations?.[0]?.title ?? null,
    genreName: row.genres?.genre_translations?.[0]?.name ?? null,
    membersCount: row.group_members?.length ?? 0,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
