import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email";
import { fetchInvitationByToken } from "@/lib/services/groupInvitationsQueries";
import type {
  CreateGroupInvitationInput,
  GroupInvitation,
  GroupInvitationWithGroup,
} from "@/types/group";

// Table not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

const MAX_GROUP_MEMBERS = 50;

interface GroupInvitationRow {
  id: string;
  group_id: string;
  invited_by: string;
  invited_email: string | null;
  invited_player_id: string | null;
  status: "pending" | "accepted" | "declined";
  token: string;
  created_at: string;
  expires_at: string;
  invited_player: { id: string; username: string | null; avatar_url: string | null } | null;
}

/**
 * Server-side service for group invitations: create (by email or username),
 * list, accept, decline. Groups are invite-only — there is no public "join"
 * flow. Membership is capped at 50 (enforced by a DB trigger at acceptance).
 */
export class GroupInvitationsServerService {
  /**
   * Create an invitation for a group, targeting either an email (unregistered
   * player) or a username (already registered on the platform). Sends a
   * best-effort email via Resend when an address is available.
   */
  static async createInvitation(
    groupId: string,
    groupSlug: string,
    groupName: string,
    invitedBy: string,
    input: CreateGroupInvitationInput
  ): Promise<GroupInvitation> {
    const supabase = await createRouteHandlerClient();

    let invitedPlayerId: string | null = null;
    let invitedEmail: string | null = null;
    let recipientEmail: string | null;

    if (input.username) {
      const { data: profile, error } = await supabase
        .from("profiles" as UntypedFrom)
        .select("id, email")
        .eq("username", input.username)
        .maybeSingle();

      if (error) {
        logger.error("Failed to look up player by username", {
          error: error.message,
          username: input.username,
        });
        throw new Error(error.message ?? "Failed to look up player");
      }
      if (!profile) {
        throw new Error("Player not found");
      }

      invitedPlayerId = (profile as unknown as { id: string }).id;
      recipientEmail = (profile as unknown as { email: string | null }).email ?? null;
    } else if (input.email) {
      invitedEmail = input.email;
      recipientEmail = input.email;
    } else {
      throw new Error("Either email or username is required");
    }

    const { data, error } = await supabase
      .from("group_invitations" as UntypedFrom)
      .insert({
        group_id: groupId,
        invited_by: invitedBy,
        invited_email: invitedEmail,
        invited_player_id: invitedPlayerId,
      })
      .select(
        `id, group_id, invited_by, invited_email, invited_player_id, status, token,
         created_at, expires_at,
         invited_player:profiles!group_invitations_invited_player_id_fkey(id, username, avatar_url)`
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("An invitation is already pending for this player");
      }
      logger.error("Failed to create group invitation", { error: error.message, groupId });
      throw new Error(error.message ?? "Failed to create group invitation");
    }

    const row = data as unknown as GroupInvitationRow;

    if (recipientEmail) {
      const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/invitations/${row.token}`;
      await sendEmail({
        to: recipientEmail,
        subject: `Invitation à rejoindre le groupe ${groupName}`,
        html: `
          <p>Vous avez été invité(e) à rejoindre le groupe <strong>${groupName}</strong> sur Game Universe.</p>
          <p><a href="${acceptUrl}">Cliquez ici pour répondre à l'invitation</a></p>
          <p>Ce lien expire dans 14 jours.</p>
        `,
      });
    }

    return transformInvitationRow(row);
  }

  /** List all invitations for a group (owner/admin view). */
  static async fetchGroupInvitations(groupId: string): Promise<GroupInvitation[]> {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("group_invitations" as UntypedFrom)
      .select(
        `id, group_id, invited_by, invited_email, invited_player_id, status, token,
         created_at, expires_at,
         invited_player:profiles!group_invitations_invited_player_id_fkey(id, username, avatar_url)`
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205") return [];
      logger.error("Failed to fetch group invitations", { error: error.message, groupId });
      throw new Error(error.message ?? "Failed to fetch group invitations");
    }

    return ((data ?? []) as unknown as GroupInvitationRow[]).map(transformInvitationRow);
  }

  /** Fetch a pending invitation by token, with group context, for the acceptance page. */
  static async fetchInvitationByToken(token: string): Promise<GroupInvitationWithGroup | null> {
    return fetchInvitationByToken(token);
  }

  /**
   * Accept an invitation: verifies it belongs to the caller, is still
   * pending and not expired, enforces the 50-member cap, then marks the
   * invitation accepted and inserts the membership row.
   */
  static async acceptInvitation(token: string, playerId: string): Promise<void> {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("group_invitations" as UntypedFrom)
      .select("id, group_id, invited_player_id, status, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (error || !data) {
      throw new Error("Invitation not found");
    }

    const invitation = data as unknown as {
      id: string;
      group_id: string;
      invited_player_id: string | null;
      status: "pending" | "accepted" | "declined";
      expires_at: string;
    };

    if (invitation.invited_player_id !== playerId) {
      throw new Error("This invitation is not addressed to you");
    }
    if (invitation.status !== "pending") {
      throw new Error("This invitation has already been answered");
    }
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error("This invitation has expired");
    }

    const { count, error: countError } = await supabase
      .from("group_members" as UntypedFrom)
      .select("id", { count: "exact", head: true })
      .eq("group_id", invitation.group_id);

    if (countError) {
      logger.error("Failed to count group members before accepting invitation", {
        error: countError.message,
      });
      throw new Error(countError.message ?? "Failed to accept invitation");
    }
    if ((count ?? 0) >= MAX_GROUP_MEMBERS) {
      throw new Error("This group has reached the maximum of 50 members");
    }

    const { error: memberError } = await supabase
      .from("group_members" as UntypedFrom)
      .insert({ group_id: invitation.group_id, player_id: playerId, role: "member" });

    if (memberError) {
      logger.error("Failed to add member after accepting invitation", {
        error: memberError.message,
      });
      throw new Error(memberError.message ?? "Failed to accept invitation");
    }

    const { error: updateError } = await supabase
      .from("group_invitations" as UntypedFrom)
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    if (updateError) {
      logger.error("Failed to mark invitation as accepted", { error: updateError.message });
      throw new Error(updateError.message ?? "Failed to accept invitation");
    }
  }

  /** Decline an invitation: verifies ownership and pending status, then marks it declined. */
  static async declineInvitation(token: string, playerId: string): Promise<void> {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("group_invitations" as UntypedFrom)
      .select("id, invited_player_id, status")
      .eq("token", token)
      .maybeSingle();

    if (error || !data) {
      throw new Error("Invitation not found");
    }

    const invitation = data as unknown as {
      id: string;
      invited_player_id: string | null;
      status: "pending" | "accepted" | "declined";
    };

    if (invitation.invited_player_id !== playerId) {
      throw new Error("This invitation is not addressed to you");
    }
    if (invitation.status !== "pending") {
      throw new Error("This invitation has already been answered");
    }

    const { error: updateError } = await supabase
      .from("group_invitations" as UntypedFrom)
      .update({ status: "declined" })
      .eq("id", invitation.id);

    if (updateError) {
      logger.error("Failed to decline invitation", { error: updateError.message });
      throw new Error(updateError.message ?? "Failed to decline invitation");
    }
  }
}

function transformInvitationRow(row: GroupInvitationRow): GroupInvitation {
  return {
    id: row.id,
    groupId: row.group_id,
    invitedBy: row.invited_by,
    invitedEmail: row.invited_email,
    invitedPlayerId: row.invited_player_id,
    invitedPlayer: row.invited_player
      ? {
          id: row.invited_player.id,
          username: row.invited_player.username,
          avatarUrl: row.invited_player.avatar_url,
        }
      : null,
    status: row.status,
    token: row.token,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}
