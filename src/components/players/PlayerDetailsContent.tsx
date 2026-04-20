"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useAuth } from "@/hooks/useAuth";
import { useFriendRelationship } from "@/hooks/useFriendRelationship";
import { PlayerProfileBanner } from "./PlayerProfileBanner";
import type { PlayerXpStats } from "@/types/achievement";
import { PlayerProfileTabs, type ProfileTab, getDefaultTab } from "./PlayerProfileTabs";

const PROFILE_TABS = [
  "feed",
  "activity",
  "library",
  "friends",
  "reviews",
  "collections",
  "achievements",
  "stats",
  "recommendations",
  "settings",
] as const satisfies readonly ProfileTab[];

function parseTabParam(raw: string | null, isOwner: boolean): ProfileTab | null {
  if (!raw) return null;
  if (!(PROFILE_TABS as readonly string[]).includes(raw)) return null;
  const tab = raw as ProfileTab;
  const ownerOnly: ProfileTab[] = ["feed", "recommendations", "settings"];
  if (ownerOnly.includes(tab) && !isOwner) return null;
  return tab;
}
import { PlayerTabContent } from "./PlayerTabContent";
import { FriendActionButton } from "./friends/FriendActionButton";
import { LibraryComparisonSection } from "./friends/LibraryComparisonSection";
import { SubscribeButton } from "./subscription/SubscribeButton";
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
  currentUserId: string | null;
}

export function PlayerDetailsContent({
  player,
  locale,
  currentUserId,
}: PlayerDetailsContentProps) {
  const t = useTranslations("players");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  // Prefer the server-resolved id so the default tab is correct on first render;
  // fall back to the client-side session while it hydrates.
  const viewerId = currentUserId ?? user?.id ?? null;
  const isOwner = viewerId === player.id;

  // Lightweight hook: only fetches friend count + relationship status (not the full list)
  const relationship = useFriendRelationship(player.id);

  const searchParams = useSearchParams();
  const requestedTab = parseTabParam(searchParams.get("tab"), isOwner);
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    () => requestedTab ?? getDefaultTab(isOwner)
  );

  // SWR-cached XP stats for the ProgressRing (Req 5.4, 5.5)
  const { data: xpStats } = useSWR<PlayerXpStats>(`/api/players/${player.id}/xp`, {
    revalidateOnFocus: false,
  });

  const displayName = player.fullName || t("card.anonymousPlayer");

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Back navigation */}
      <div className="absolute top-4 left-4 z-20">
        <Link href="/players">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] rounded-full bg-black/20 text-gray-700 backdrop-blur-xs hover:bg-black/30 hover:text-gray-900 dark:bg-black/30 dark:text-white dark:hover:bg-black/50 dark:hover:text-white"
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
        friendCount={relationship.friendCount}
        commentCount={0}
        xpStats={xpStats ?? null}
        friendActionSlot={
          <div className="flex items-center gap-2">
            <FriendActionButton
              playerId={player.id}
              isAuthenticated={!!user}
              isOwner={isOwner}
              relationshipStatus={relationship.relationshipStatus}
              friendshipId={relationship.relationshipFriendshipId}
              sendRequest={relationship.sendRequest}
              acceptRequest={relationship.acceptRequest}
              declineRequest={relationship.declineRequest}
              removeFriend={relationship.removeFriend}
            />
            <SubscribeButton targetId={player.id} isAuthenticated={!!user} isOwner={isOwner} />
          </div>
        }
      />

      {/* Library comparison — visible when viewing another player's profile */}
      {shouldShowComparison(!!user, viewerId, player.id) && (
        <div className="container mx-auto px-4 pt-6">
          <LibraryComparisonSection playerId={player.id} locale={locale} />
        </div>
      )}

      {/* Tab navigation */}
      <PlayerProfileTabs activeTab={activeTab} onTabChange={setActiveTab} isOwner={isOwner} />

      {/* Tab content */}
      <div className="container mx-auto px-4 py-8">
        <PlayerTabContent
          activeTab={activeTab}
          player={player}
          locale={locale}
          isOwner={isOwner}
          t={t}
          tCommon={tCommon}
        />
      </div>
    </div>
  );
}
