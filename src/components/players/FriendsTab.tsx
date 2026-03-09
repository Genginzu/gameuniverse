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

  const {
    friends,
    pendingRequests,
    isLoading,
    isLoadingMore,
    hasNextPage,
    acceptRequest,
    declineRequest,
    loadMore,
  } = useFriends(playerId, locale);

  const filteredFriends = useMemo(
    () => filterFriendsByName(friends, searchQuery),
    [friends, searchQuery]
  );

  return (
    <section className="mb-8">
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
        locale={locale}
      />
    </section>
  );
}
