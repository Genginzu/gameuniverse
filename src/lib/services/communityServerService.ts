import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type {
  CreateCommunityInput,
  CommunityDetail,
  CommunityMemberRole,
  CommunitySearchParams,
  CommunitySummary,
  UpdateCommunityInput,
} from "@/types/community";

const PAGE_SIZE = 20;

// Table not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

interface CommunityRow {
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
  community_members: Array<{ id: string }>;
}

/**
 * Server-side service for communities: search/listing, detail, and CRUD.
 * Used by API routes under /api/communities.
 */
export class CommunityServerService {
  /** Generate a URL-safe, globally unique slug from a community name. */
  static async generateUniqueSlug(name: string): Promise<string> {
    const base = generateSlug(name);
    const supabase = await createRouteHandlerClient();

    let candidate = base;
    let suffix = 1;
    while (true) {
      const { data, error } = await supabase
        .from("communities" as UntypedFrom)
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();

      if (error && error.code !== "PGRST205") {
        logger.error("Failed to check community slug uniqueness", { error: error.message });
        break;
      }
      if (!data) break;

      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    return candidate;
  }

  /** List communities the given player is a member of, sorted alphabetically by name. */
  static async fetchMyCommunities(playerId: string): Promise<CommunitySummary[]> {
    const supabase = await createRouteHandlerClient();

    const { data: memberships, error: membershipsError } = await supabase
      .from("community_members" as UntypedFrom)
      .select("community_id")
      .eq("player_id", playerId);

    if (membershipsError) {
      if (membershipsError.code === "PGRST205") return [];
      logger.error("Failed to fetch community memberships", {
        error: membershipsError.message,
        playerId,
      });
      throw new Error(membershipsError.message ?? "Failed to fetch my communities");
    }

    const communityIds = ((memberships ?? []) as unknown as Array<{ community_id: string }>).map(
      (row) => row.community_id
    );
    if (communityIds.length === 0) return [];

    const { data, error } = await supabase
      .from("communities" as UntypedFrom)
      .select(
        `id, name, slug, description, image_url, visibility, game_id, genre_id, owner_id,
         created_at, updated_at,
         games(game_translations(title)), genres(genre_translations(name)), community_members(id)`
      )
      .in("id", communityIds)
      .order("name", { ascending: true });

    if (error) {
      if (error.code === "PGRST205") return [];
      logger.error("Failed to fetch my communities", { error: error.message, playerId });
      throw new Error(error.message ?? "Failed to fetch my communities");
    }

    const rows = (data ?? []) as unknown as CommunityRow[];
    return rows.map(transformCommunityRow);
  }

  /** Search/list communities with optional filters, paginated. Public communities only. */
  static async searchCommunities(
    params: CommunitySearchParams
  ): Promise<{ communities: CommunitySummary[]; totalCount: number }> {
    const supabase = await createRouteHandlerClient();
    const page = params.page && params.page >= 1 ? params.page : 1;
    const offset = (page - 1) * PAGE_SIZE;

    let query = supabase
      .from("communities" as UntypedFrom)
      .select(
        `id, name, slug, description, image_url, visibility, game_id, genre_id, owner_id,
         created_at, updated_at,
         games(game_translations(title)), genres(genre_translations(name)), community_members(id)`,
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
      if (error.code === "PGRST205") return { communities: [], totalCount: 0 };
      logger.error("Failed to search communities", { error: error.message });
      throw new Error(error.message ?? "Failed to search communities");
    }

    const rows = (data ?? []) as unknown as CommunityRow[];
    return { communities: rows.map(transformCommunityRow), totalCount: count ?? 0 };
  }

  /** Fetch a single community by slug, including the viewer's role if any. */
  static async fetchCommunityBySlug(
    slug: string,
    viewerId?: string
  ): Promise<CommunityDetail | null> {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("communities" as UntypedFrom)
      .select(
        `id, name, slug, description, image_url, visibility, game_id, genre_id, owner_id,
         created_at, updated_at,
         games(game_translations(title)), genres(genre_translations(name)), community_members(id),
         owner:profiles!communities_owner_id_fkey(id, username, avatar_url)`
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST205") return null;
      logger.error("Failed to fetch community by slug", { error: error.message, slug });
      throw new Error(error.message ?? "Failed to fetch community");
    }
    if (!data) return null;

    const row = data as unknown as CommunityRow & {
      owner: { id: string; username: string | null; avatar_url: string | null } | null;
    };

    let viewerRole: CommunityMemberRole | null = null;
    if (viewerId) {
      const { data: memberRow } = await supabase
        .from("community_members" as UntypedFrom)
        .select("role")
        .eq("community_id", row.id)
        .eq("player_id", viewerId)
        .maybeSingle();
      viewerRole = (memberRow as unknown as { role: CommunityMemberRole } | null)?.role ?? null;
    }

    return {
      ...transformCommunityRow(row),
      owner: {
        id: row.owner?.id ?? row.owner_id,
        username: row.owner?.username ?? null,
        avatarUrl: row.owner?.avatar_url ?? null,
      },
      viewerRole,
    };
  }

  /** Return { id, visibility, ownerId } for a community by slug, or null if not found. */
  static async getCommunityAccess(
    slug: string
  ): Promise<{ id: string; visibility: "public" | "private"; ownerId: string } | null> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("communities" as UntypedFrom)
      .select("id, visibility, owner_id")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    const row = data as unknown as { id: string; visibility: "public" | "private"; owner_id: string };
    return { id: row.id, visibility: row.visibility, ownerId: row.owner_id };
  }

  /** Create a new community. The creator is auto-added as owner via DB trigger. */
  static async createCommunity(
    ownerId: string,
    input: CreateCommunityInput
  ): Promise<CommunityDetail> {
    const supabase = await createRouteHandlerClient();
    const slug = await this.generateUniqueSlug(input.name);

    const { data, error } = await supabase
      .from("communities" as UntypedFrom)
      .insert({
        name: input.name,
        slug,
        description: input.description ?? null,
        image_url: input.imageUrl ?? null,
        visibility: "public",
        game_id: input.gameId ?? null,
        genre_id: input.genreId ?? null,
        owner_id: ownerId,
      })
      .select("slug")
      .single();

    if (error) {
      logger.error("Failed to create community", { error: error.message });
      throw new Error(error.message ?? "Failed to create community");
    }

    const created = await this.fetchCommunityBySlug(
      (data as unknown as { slug: string }).slug,
      ownerId
    );
    if (!created) throw new Error("Community created but could not be fetched");
    return created;
  }

  /** Update a community. Caller must have verified owner/moderator role beforehand. */
  static async updateCommunity(slug: string, input: UpdateCommunityInput): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const payload: Record<string, unknown> = {};

    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description;
    if (input.imageUrl !== undefined) payload.image_url = input.imageUrl;
    if (input.gameId !== undefined) payload.game_id = input.gameId;
    if (input.genreId !== undefined) payload.genre_id = input.genreId;

    const { error } = await supabase
      .from("communities" as UntypedFrom)
      .update(payload)
      .eq("slug", slug);

    if (error) {
      logger.error("Failed to update community", { error: error.message, slug });
      throw new Error(error.message ?? "Failed to update community");
    }
  }

  /** Delete a community. Caller must have verified owner role beforehand. */
  static async deleteCommunity(slug: string): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase.from("communities" as UntypedFrom).delete().eq("slug", slug);

    if (error) {
      logger.error("Failed to delete community", { error: error.message, slug });
      throw new Error(error.message ?? "Failed to delete community");
    }
  }
}

/** Generate a URL-safe slug from a community name (same algorithm as groups/collections). */
export function generateSlug(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "community";
}

/** Transform a raw Supabase community row into a CommunitySummary. */
function transformCommunityRow(row: CommunityRow): CommunitySummary {
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
    membersCount: row.community_members?.length ?? 0,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
