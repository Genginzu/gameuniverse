"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import { usePendingRequestCount } from "@/hooks/usePendingRequestCount";
import { filterFriendsByName } from "@/lib/utils/friendUtils";
import { FriendRequestList } from "@/components/players/FriendRequestList";
import { FriendSearchBar } from "@/components/players/FriendSearchBar";
import { FriendsPageFriendCard } from "@/components/friends/FriendsPageFriendCard";
import { FriendsEmptyState } from "@/components/friends/FriendsEmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export function FriendsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const locale = useLocale();
  const t = useTranslations("friends.page");
  const currentUserId = user?.id ?? "";

  const {
    friends,
    pendingRequests,
    friendCount,
    isLoading,
    isLoadingMore,
    hasNextPage,
    acceptRequest,
    declineRequest,
    removeFriend,
    loadMore,
  } = useFriends(currentUserId, locale);

  const pendingCount = usePendingRequestCount();
  const [searchQuery, setSearchQuery] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Décrémente le badge sidebar en plus de l'action useFriends
  const handleAccept = useCallback(
    async (friendshipId: string) => {
      await acceptRequest(friendshipId);
      pendingCount.decrement();
    },
    [acceptRequest, pendingCount]
  );

  const handleDecline = useCallback(
    async (friendshipId: string) => {
      await declineRequest(friendshipId);
      pendingCount.decrement();
    },
    [declineRequest, pendingCount]
  );

  const filteredFriends = useMemo(
    () => filterFriendsByName(friends, searchQuery),
    [friends, searchQuery]
  );

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isLoadingMore, loadMore]);

  if (authLoading || !currentUserId) return null;

  if (isLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-slate-700/50" />
          <div className="glass-card rounded-2xl p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-20 w-full rounded-xl bg-gray-200 dark:bg-slate-700/50"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6">
      <div className="space-y-6">
        <h1 className="neon-text text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          {t("title")}
        </h1>

        {/* Demandes en attente — masquées si aucune */}
        {pendingRequests.length > 0 && (
          <section aria-label={t("title")} className="glass-card rounded-2xl p-6">
            <FriendRequestList
              requests={pendingRequests}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          </section>
        )}

        {/* En-tête liste d'amis + recherche */}
        <section aria-label={t("friendsCount", { count: friendCount })}>
          <div className="glass-card rounded-2xl p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                {t("friendsCount", { count: friendCount })}
              </h2>
              <div className="w-full sm:w-64">
                <FriendSearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
            </div>

            {filteredFriends.length === 0 && friends.length === 0 ? (
              <FriendsEmptyState locale={locale} />
            ) : (
              <>
                <div
                  role="list"
                  aria-label={t("friendsCount", { count: friendCount })}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {filteredFriends.map((friend) => (
                    <div key={friend.friendshipId} role="listitem">
                      <FriendsPageFriendCard
                        friend={friend}
                        locale={locale}
                        onRemove={removeFriend}
                      />
                    </div>
                  ))}
                </div>

                {isLoadingMore && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className="h-20 w-full rounded-xl bg-gray-200 dark:bg-slate-700/50"
                      />
                    ))}
                  </div>
                )}

                <div ref={sentinelRef} className="h-1" aria-hidden="true" />
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
