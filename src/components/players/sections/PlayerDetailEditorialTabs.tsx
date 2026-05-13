"use client";

/**
 * Tabs éditoriaux du profil joueur : kicker mono uppercase + soulignement
 * accent dynamique (même style que les onglets Game detail). Conserve la
 * logique existante (visibility par owner, scroll horizontal mobile).
 */

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { ProfileTab } from "../profile-tabs";

interface PlayerDetailEditorialTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  isOwner: boolean;
}

const TAB_DEFINITIONS: ReadonlyArray<{
  id: ProfileTab;
  icon: string;
  ownerOnly?: boolean;
}> = [
  { id: "feed", icon: "lucide:newspaper", ownerOnly: true },
  { id: "activity", icon: "lucide:smile" },
  { id: "library", icon: "lucide:gamepad-2" },
  { id: "friends", icon: "lucide:users" },
  { id: "reviews", icon: "lucide:book-open" },
  { id: "collections", icon: "lucide:folder-open" },
  { id: "achievements", icon: "lucide:trophy" },
  { id: "goals", icon: "lucide:target", ownerOnly: true },
  { id: "stats", icon: "lucide:bar-chart-3" },
  { id: "recommendations", icon: "lucide:globe", ownerOnly: true },
  { id: "settings", icon: "lucide:settings", ownerOnly: true },
];

export function PlayerDetailEditorialTabs({
  activeTab,
  onTabChange,
  isOwner,
}: PlayerDetailEditorialTabsProps) {
  const t = useTranslations("players.tabs");
  const visibleTabs = TAB_DEFINITIONS.filter((tab) => !tab.ownerOnly || isOwner);

  return (
    <div className="editorial-player-detail-tabs-header">
      <div className="editorial-player-detail-tabs-scroll" role="tablist">
        {visibleTabs.map(({ id, icon }) => {
          const isActive = activeTab === id;
          const label = t(id);
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-active={isActive ? "true" : "false"}
              onClick={() => onTabChange(id)}
              className="editorial-player-detail-tab"
              aria-label={label}
            >
              <Icon icon={icon} className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
