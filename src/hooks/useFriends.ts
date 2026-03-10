"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FriendService } from "@/lib/services/friendService";
import { useAuth } from "@/hooks/useAuth";
import type { FriendSummary, FriendRequest, RelationshipStatus } from "@/types/friendship";

export interface UseFriendsReturn {
  friends: FriendSummary[];
  pendingRequests: FriendRequest[];
  friendCount: number;
  relationshipStatus: RelationshipStatus;
  relationshipFriendshipId: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  error: string | null;
  sendRequest: () => Promise<void>;
  acceptRequest: (friendshipId: string) => Promise<void>;
  declineRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  loadMore: () => void;
}

/**
 * Hook pour gérer le système d'amis d'un joueur.
 * Gère la liste d'amis (scroll infini), les demandes en attente,
 * le statut de relation et les mutations avec mises à jour optimistes.
 */
export function useFriends(playerId: string, _locale: string): UseFriendsReturn {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const isOwner = currentUserId === playerId;

  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>("none");
  const [relationshipFriendshipId, setRelationshipFriendshipId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  // --- Fetch friends list ---
  const fetchFriends = useCallback(
    async (page: number, append: boolean) => {
      if (!playerId || isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const response = await FriendService.getFriends(playerId, { page });

        setFriends((prev) => (append ? [...prev, ...response.friends] : response.friends));
        setFriendCount(response.totalCount);
        setHasNextPage(response.pagination.hasNextPage);
        pageRef.current = page;

        // L'API ne retourne pendingRequests que si le requêteur est le owner
        // (vérifié côté serveur), donc on stocke directement sans re-vérifier
        if (response.pendingRequests) {
          setPendingRequests(response.pendingRequests);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch friends";
        setError(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [playerId]
  );

  // --- Fetch relationship status (visitor only) ---
  const fetchRelationshipStatus = useCallback(async () => {
    if (!currentUserId || isOwner || !playerId) return;
    try {
      const response = await FriendService.getRelationshipStatus(playerId);
      setRelationshipStatus(response.status);
      setRelationshipFriendshipId(response.friendshipId ?? null);
    } catch {
      // Non-blocking: default to "none" on error
    }
  }, [currentUserId, isOwner, playerId]);

  // --- Initial load ---
  useEffect(() => {
    fetchFriends(1, false);
    fetchRelationshipStatus();
  }, [fetchFriends, fetchRelationshipStatus]);

  // --- Load more (infinite scroll) ---
  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingRef.current) return;
    fetchFriends(pageRef.current + 1, true);
  }, [hasNextPage, fetchFriends]);

  // --- Send friend request (optimistic: status → pending_sent) ---
  const sendRequest = useCallback(async () => {
    if (!playerId) return;

    const prevStatus = relationshipStatus;
    setRelationshipStatus("pending_sent");
    setError(null);

    try {
      await FriendService.sendFriendRequest(playerId);
    } catch (err) {
      setRelationshipStatus(prevStatus);
      const message = err instanceof Error ? err.message : "Failed to send friend request";
      setError(message);
    }
  }, [playerId, relationshipStatus]);

  // --- Accept request (optimistic: count +1, remove from pending, status → accepted) ---
  const acceptRequest = useCallback(
    async (friendshipId: string) => {
      const prevRequests = pendingRequests;
      const prevCount = friendCount;
      const prevStatus = relationshipStatus;

      const accepted = pendingRequests.find((r) => r.friendshipId === friendshipId);

      setPendingRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
      setFriendCount((prev) => prev + 1);
      setRelationshipStatus("accepted");
      setError(null);

      try {
        await FriendService.acceptFriendRequest(playerId, friendshipId);

        // Add the accepted friend to the list if we have sender info
        if (accepted) {
          const newFriend: FriendSummary = {
            id: accepted.sender.id,
            friendshipId,
            displayName: accepted.sender.displayName,
            avatarUrl: accepted.sender.avatarUrl,
            level: 0,
            acceptedAt: new Date().toISOString(),
          };
          setFriends((prev) => [newFriend, ...prev]);
        }
      } catch (err) {
        setPendingRequests(prevRequests);
        setFriendCount(prevCount);
        setRelationshipStatus(prevStatus);
        const message = err instanceof Error ? err.message : "Failed to accept friend request";
        setError(message);
      }
    },
    [playerId, pendingRequests, friendCount, relationshipStatus]
  );

  // --- Decline request (optimistic: remove from pending) ---
  const declineRequest = useCallback(
    async (friendshipId: string) => {
      const prevRequests = pendingRequests;
      const prevStatus = relationshipStatus;

      setPendingRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
      setRelationshipStatus("none");
      setError(null);

      try {
        await FriendService.declineFriendRequest(playerId, friendshipId);
      } catch (err) {
        setPendingRequests(prevRequests);
        setRelationshipStatus(prevStatus);
        const message = err instanceof Error ? err.message : "Failed to decline friend request";
        setError(message);
      }
    },
    [playerId, pendingRequests, relationshipStatus]
  );

  // --- Remove friend (optimistic: count -1, remove from list, status → none) ---
  const removeFriend = useCallback(
    async (friendshipId: string) => {
      const prevFriends = friends;
      const prevCount = friendCount;
      const prevStatus = relationshipStatus;

      setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
      setFriendCount((prev) => Math.max(0, prev - 1));
      setRelationshipStatus("none");
      setError(null);

      try {
        await FriendService.removeFriend(playerId, friendshipId);
      } catch (err) {
        setFriends(prevFriends);
        setFriendCount(prevCount);
        setRelationshipStatus(prevStatus);
        const message = err instanceof Error ? err.message : "Failed to remove friend";
        setError(message);
      }
    },
    [playerId, friends, friendCount, relationshipStatus]
  );

  return {
    friends,
    pendingRequests,
    friendCount,
    relationshipStatus,
    relationshipFriendshipId,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    loadMore,
  };
}
