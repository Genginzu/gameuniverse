"use client";

/**
 * PlayerDetailsContent — orchestrateur de la page profil joueur (look
 * éditorial, P2-01).
 *
 * Layout : hero asymétrique avatar 5/12 + identité 7/12, bento de stats
 * et highlights, comparaison de bibliothèque (si pertinent), navigation
 * par onglets éditoriale (kicker mono + soulignement accent dynamique),
 * contenu lazy-loadé via PlayerTabContent.
 *
 * L'accent dynamique (palette gold) est injecté par le `<DynamicAccent>`
 * parent (page.tsx).
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { useFriendRelationship } from "@/hooks/useFriendRelationship";
import type { PlayerDetails } from "@/types/player";

import { PlayerTabContent } from "./PlayerTabContent";
import { PlayerProfileSocialLinks } from "./PlayerProfileSocialLinks";
import { FriendActionButton } from "./friends/FriendActionButton";
import { LibraryComparisonSection } from "./friends/LibraryComparisonSection";
import { SubscribeButton } from "./subscription/SubscribeButton";

import { type ProfileTab, getDefaultTab } from "./profile-tabs";
import { PlayerDetailHero } from "./sections/PlayerDetailHero";
import { PlayerDetailBento } from "./sections/PlayerDetailBento";
import { PlayerDetailEditorialTabs } from "./sections/PlayerDetailEditorialTabs";

const PROFILE_TABS = [
  "feed",
  "activity",
  "library",
  "friends",
  "reviews",
  "collections",
  "achievements",
  "goals",
  "stats",
  "recommendations",
  "settings",
] as const satisfies readonly ProfileTab[];

function parseTabParam(raw: string | null, isOwner: boolean): ProfileTab | null {
  if (!raw) return null;
  if (!(PROFILE_TABS as readonly string[]).includes(raw)) return null;
  const tab = raw as ProfileTab;
  const ownerOnly: ProfileTab[] = ["feed", "goals", "recommendations", "settings"];
  if (ownerOnly.includes(tab) && !isOwner) return null;
  return tab;
}

/**
 * Détermine si l'indicateur de comparaison de bibliothèque doit être
 * affiché (uniquement quand on regarde le profil d'un *autre* joueur,
 * et qu'on est connecté).
 *
 * Exporté pour que les tests property-based puissent le couvrir
 * indépendamment du DOM (Property 3).
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

export function PlayerDetailsContent({ player, locale, currentUserId }: PlayerDetailsContentProps) {
  const t = useTranslations("players");
  const tCommon = useTranslations("common");
  const { user } = useAuth();

  // Prefer the server-resolved id so the default tab is correct on first
  // render; fall back to the client-side session while it hydrates.
  const viewerId = currentUserId ?? user?.id ?? null;
  const isOwner = viewerId === player.id;

  // Lightweight friend relationship (count + status, not the full list).
  const relationship = useFriendRelationship(player.id);

  const searchParams = useSearchParams();
  const requestedTab = parseTabParam(searchParams.get("tab"), isOwner);
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    () => requestedTab ?? getDefaultTab(isOwner)
  );

  const displayName = player.fullName || t("card.anonymousPlayer");

  const friendActionSlot = (
    <div className="flex flex-wrap items-center gap-2">
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
  );

  return (
    <div className="bg-editorial-bg relative min-h-screen text-white">
      <PlayerDetailHero
        player={player}
        displayName={displayName}
        friendActionSlot={friendActionSlot}
        socialLinksSlot={<PlayerProfileSocialLinks socialLinks={player.socialLinks} />}
        reviewCount={player.stats.totalGames}
        friendCount={relationship.friendCount}
      />

      <PlayerDetailBento player={player} locale={locale} friendCount={relationship.friendCount} />

      {/* Library comparison — visible when viewing another player's profile */}
      {shouldShowComparison(!!user, viewerId, player.id) && (
        <div className="mx-auto w-full max-w-[1600px] px-6 pb-12 lg:px-12">
          <LibraryComparisonSection playerId={player.id} locale={locale} />
        </div>
      )}

      {/* Tabs section : éditorial header + lazy content */}
      <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 lg:px-12 lg:pb-24">
        <PlayerDetailEditorialTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOwner={isOwner}
        />

        <PlayerTabContent
          activeTab={activeTab}
          player={player}
          locale={locale}
          isOwner={isOwner}
          t={t}
          tCommon={tCommon}
        />
      </section>
    </div>
  );
}

// Keep these helpers re-exported for legacy consumers that imported
// them from the public API of this module.
export { getDefaultTab } from "./profile-tabs";
export type { ProfileTab } from "./profile-tabs";
