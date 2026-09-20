import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { GroupInvitationWithGroup } from "@/types/group";

// Table not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

/** List pending invitations addressed to the given player, newest first. */
export async function fetchMyInvitations(playerId: string): Promise<GroupInvitationWithGroup[]> {
  const supabase = await createRouteHandlerClient();

  const { data, error } = await supabase
    .from("group_invitations" as UntypedFrom)
    .select(
      `id, status, token, created_at, expires_at,
       group:groups!group_invitations_group_id_fkey(id, name, slug, image_url, group_members(id)),
       inviter:profiles!group_invitations_invited_by_fkey(id, username, avatar_url)`
    )
    .eq("invited_player_id", playerId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205") return [];
    logger.error("Failed to fetch my invitations", { error: error.message, playerId });
    throw new Error(error.message ?? "Failed to fetch my invitations");
  }

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    status: "pending" | "accepted" | "declined";
    token: string;
    created_at: string;
    expires_at: string;
    group: {
      id: string;
      name: string;
      slug: string;
      image_url: string | null;
      group_members: Array<{ id: string }>;
    } | null;
    inviter: { id: string; username: string | null; avatar_url: string | null } | null;
  }>;

  return rows
    .filter((row) => row.group !== null)
    .map((row) => ({
      id: row.id,
      status: row.status,
      token: row.token,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      group: {
        id: row.group!.id,
        name: row.group!.name,
        slug: row.group!.slug,
        imageUrl: row.group!.image_url,
        membersCount: row.group!.group_members?.length ?? 0,
      },
      invitedBy: {
        id: row.inviter?.id ?? "",
        username: row.inviter?.username ?? null,
        avatarUrl: row.inviter?.avatar_url ?? null,
      },
    }));
}
