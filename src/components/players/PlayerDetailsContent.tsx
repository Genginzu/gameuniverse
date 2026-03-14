"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import { PlayerProfileBanner } from "./PlayerProfileBanner";
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

  const {
    friendCount,
    relationshipStatus,
    relationshipFriendshipId,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  } = useFriends(player.id, locale);

  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  // Fetch available years for the year-in-review link (Req 7.1)
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    fetch(`/api/players/${player.id}/year/${currentYear}?locale=${locale}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.yearReview?.availableYears) {
          setAvailableYears(json.yearReview.availableYears);
        }
      })
      .catch(() => {});
  }, [player.id, locale]);

  const displayName = player.fullName || t("card.anonymousPlayer");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Back navigation */}
      <div className="absolute left-4 top-4 z-20">
        <Link href={`/${locale}/players`}>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full bg-black/20 text-gray-700 backdrop-blur-sm hover:bg-black/30 hover:text-gray-900 dark:bg-black/30 dark:text-white dark:hover:bg-black/50 dark:hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("details.back")}
          </Button>
        </Link>
      </div>

      {/* New profile header matching the screenshot design */}
      <PlayerProfileBanner
        player={player}
        displayName={displayName}
        reviewCount={player.stats.totalGames}
        friendCount={friendCount}
        commentCount={0}
        friendActionSlot={
          <FriendActionButton
            playerId={player.id}
            isAuthenticated={!!user}
            isOwner={isOwner}
            relationshipStatus={relationshipStatus}
            friendshipId={relationshipFriendshipId}
            sendRequest={sendRequest}
            acceptRequest={acceptRequest}
            declineRequest={declineRequest}
            removeFriend={removeFriend}
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
          availableYears={availableYears}
          user={user}
          t={t}
          tCommon={tCommon}
        />
      </div>
    </div>
  );
}
