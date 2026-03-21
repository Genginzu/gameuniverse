"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { FriendService } from "@/lib/services/friendService";
import { useAuth } from "@/hooks/useAuth";
import type { RelationshipStatus, FriendsListResponse } from "@/types/friendship";

export interface UseFriendRelationshipReturn {
  friendCount: number;
  relationshipStatus: RelationshipStatus;
  relationshipFriendshipId: string | null;
  sendRequest: () => Promise<void>;
  acceptRequest: (friendshipId: string) => Promise<void>;
  declineRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
}

/**
 * Hook léger pour la bannière du profil joueur.
 * Fetch uniquement le friendCount (via limit=1) et le statut de relation,
 * sans charger la liste complète d'amis.
 */
export function useFriendRelationship(playerId: string): UseFriendRelationshipReturn {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const isOwner = currentUserId === playerId;

  // Fetch friend count via a minimal request (limit=1 → only totalCount matters)
  const { data: friendsData, mutate: mutateFriends } = useSWR<FriendsListResponse>(
    playerId ? `/api/players/${playerId}/friends?page=1&limit=1` : null,
    { revalidateOnFocus: false }
  );

  // Fetch relationship status only for visitors (not owner)
  const { data: statusData, mutate: mutateStatus } = useSWR(
    !isOwner && currentUserId && playerId ? `/api/players/${playerId}/friends/status` : null,
    { revalidateOnFocus: false }
  );

  const friendCount = friendsData?.totalCount ?? 0;
  const relationshipStatus: RelationshipStatus = statusData?.status ?? "none";
  const relationshipFriendshipId: string | null = statusData?.friendshipId ?? null;

  const [error, setError] = useState<string | null>(null);

  const sendRequest = useCallback(async () => {
    if (!playerId) return;
    // Optimistic update
    await mutateStatus({ status: "pending_sent" }, false);
    setError(null);
    try {
      await FriendService.sendFriendRequest(playerId);
    } catch (err) {
      // Rollback
      await mutateStatus();
      const message = err instanceof Error ? err.message : "Failed to send friend request";
      setError(message);
    }
  }, [playerId, mutateStatus]);

  const acceptRequest = useCallback(
    async (friendshipId: string) => {
      // Optimistic: count +1, status → accepted
      await mutateStatus({ status: "accepted", friendshipId }, false);
      await mutateFriends(
        (prev) => (prev ? { ...prev, totalCount: prev.totalCount + 1 } : prev),
        false
      );
      setError(null);
      try {
        await FriendService.acceptFriendRequest(playerId, friendshipId);
      } catch (err) {
        await mutateStatus();
        await mutateFriends();
        const message = err instanceof Error ? err.message : "Failed to accept friend request";
        setError(message);
      }
    },
    [playerId, mutateStatus, mutateFriends]
  );

  const declineRequest = useCallback(
    async (friendshipId: string) => {
      await mutateStatus({ status: "none" }, false);
      setError(null);
      try {
        await FriendService.declineFriendRequest(playerId, friendshipId);
      } catch (err) {
        await mutateStatus();
        const message = err instanceof Error ? err.message : "Failed to decline friend request";
        setError(message);
      }
    },
    [playerId, mutateStatus]
  );

  const removeFriend = useCallback(
    async (friendshipId: string) => {
      // Optimistic: count -1, status → none
      await mutateStatus({ status: "none" }, false);
      await mutateFriends(
        (prev) => (prev ? { ...prev, totalCount: Math.max(0, prev.totalCount - 1) } : prev),
        false
      );
      setError(null);
      try {
        await FriendService.removeFriend(playerId, friendshipId);
      } catch (err) {
        await mutateStatus();
        await mutateFriends();
        const message = err instanceof Error ? err.message : "Failed to remove friend";
        setError(message);
      }
    },
    [playerId, mutateStatus, mutateFriends]
  );

  // Expose error for consumers that need it (currently unused in banner)
  void error;

  return {
    friendCount,
    relationshipStatus,
    relationshipFriendshipId,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  };
}
