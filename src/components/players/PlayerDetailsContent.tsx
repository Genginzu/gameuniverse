"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import { PlayerProfileBanner } from "./PlayerProfileBanner";
import type { PlayerXpStats } from "@/types/achievement";
import { PlayerProfileTabs, type ProfileTab } from "./PlayerProfileTabs";
import { PlayerTabContent } from "./PlayerTabContent";
import { FriendActionButton } from "./FriendActionButton";
import type { PlayerDetails } from "@/types/player";

/**
 * Pure helper — determines whether the library comparison section should be shown.
 * Exported for property-based testing (Property 3: Visibility of the indicator).
 */
export function shouldShowComparison(
  isAuthenticated: boolean,
  currentUserId: string | null,
  targetPlayerId: string
): boolean {
  return isAuthenticated && currentUserId !== null && currentUserId !== targetPlayerId;
}

interface PlayerDetailsContentProps {
  player: PlayerDetails;
  locale: string;
}

export function PlayerDetailsContent({ player, locale }: PlayerDetailsContentProps) {
  const t = useTranslations("players");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const isOwner = user?.id === player.id;

  const friendsHook = useFriends(player.id, locale);

  const [activeTab, setActiveTab] = useState<ProfileTab>("activity");

  // Fetch XP stats for the ProgressRing (Req 5.4, 5.5)
  const [xpStats, setXpStats] = useState<PlayerXpStats | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/players/${player.id}/xp`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: PlayerXpStats | null) => {
        if (json) setXpStats(json);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [player.id]);

  const displayName = player.fullName || t("card.anonymousPlayer");

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Back navigation */}
      <div className="absolute top-4 left-4 z-20">
        <Link href={`/${locale}/players`}>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full bg-black/20 text-gray-700 backdrop-blur-xs hover:bg-black/30 hover:text-gray-900 dark:bg-black/30 dark:text-white dark:hover:bg-black/50 dark:hover:text-white"
          >
            <Icon icon="lucide:arrow-left" className="mr-2 h-4 w-4" />
            {t("details.back")}
          </Button>
        </Link>
      </div>

      {/* New profile header matching the screenshot design */}
      <PlayerProfileBanner
        player={player}
        displayName={displayName}
        reviewCount={player.stats.totalGames}
        friendCount={friendsHook.friendCount}
        commentCount={0}
        xpStats={xpStats}
        friendActionSlot={
          <FriendActionButton
            playerId={player.id}
            isAuthenticated={!!user}
            isOwner={isOwner}
            relationshipStatus={friendsHook.relationshipStatus}
            friendshipId={friendsHook.relationshipFriendshipId}
            sendRequest={friendsHook.sendRequest}
            acceptRequest={friendsHook.acceptRequest}
            declineRequest={friendsHook.declineRequest}
            removeFriend={friendsHook.removeFriend}
          />
        }
      />

      {/* Tab navigation */}
      <PlayerProfileTabs activeTab={activeTab} onTabChange={setActiveTab} isOwner={isOwner} />

      {/* Tab content */}
      <div className="container mx-auto px-4 py-8">
        <PlayerTabContent
          activeTab={activeTab}
          player={player}
          locale={locale}
          isOwner={isOwner}
          friendsHook={friendsHook}
          t={t}
          tCommon={tCommon}
        />
      </div>
    </div>
  );
}
