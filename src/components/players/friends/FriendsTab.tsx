"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import { filterFriendsByName } from "@/lib/utils/friendUtils";
import { FriendRequestList } from "./FriendRequestList";
import { FriendSearchBar } from "./FriendSearchBar";
import { FriendList } from "./FriendList";

interface FriendsTabProps {
  playerId: string;
  locale: string;
}

export function FriendsTab({ playerId, locale }: FriendsTabProps) {
  const { user } = useAuth();
  const isOwner = user?.id === playerId;
  const [searchQuery, setSearchQuery] = useState("");

  // Friends list is fetched only when this tab is mounted (lazy via dynamic import)
  const friendsHook = useFriends(playerId, locale);

  const {
    friends,
    pendingRequests,
    isLoading,
    isLoadingMore,
    hasNextPage,
    acceptRequest,
    declineRequest,
    removeFriend,
    loadMore,
  } = friendsHook;

  const filteredFriends = useMemo(
    () => filterFriendsByName(friends, searchQuery),
    [friends, searchQuery]
  );

  return (
    <section className="mb-8 flex flex-col gap-4">
      {/* Pending requests — owner only */}
      {isOwner && pendingRequests.length > 0 && (
        <FriendRequestList
          requests={pendingRequests}
          onAccept={acceptRequest}
          onDecline={declineRequest}
        />
      )}

      {/* Search bar */}
      <div className="mb-4">
        <FriendSearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Friend list with infinite scroll */}
      <FriendList
        friends={filteredFriends}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasNextPage={hasNextPage}
        onLoadMore={loadMore}
        onRemove={isOwner ? removeFriend : undefined}
        locale={locale}
      />
    </section>
  );
}
