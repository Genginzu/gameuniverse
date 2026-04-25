"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

type TabKey = "description" | "games" | "media" | "comments";

interface CharacterTabNavigationProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  gamesCount: number;
  commentCount: number | null;
}

export function CharacterTabNavigation({
  activeTab,
  onTabChange,
  gamesCount,
  commentCount,
}: CharacterTabNavigationProps) {
  const t = useTranslations();

  const tabs: { key: TabKey; icon: string; label: string; count?: number | null }[] = [
    { key: "description", icon: "lucide:book-open", label: t("characters.tabs.description") },
    {
      key: "games",
      icon: "lucide:gamepad-2",
      label: t("characters.tabs.games"),
      count: gamesCount,
    },
    { key: "media", icon: "lucide:eye", label: t("characters.tabs.media") },
    {
      key: "comments",
      icon: "lucide:message-circle",
      label: t("characters.tabs.comments"),
      count: commentCount,
    },
  ];

  return (
    <div className="mb-8 flex justify-center">
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/80 p-1.5 backdrop-blur-xs [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ key, icon, label, count }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`shrink-0 rounded-xl px-4 py-3 text-sm font-medium transition-all sm:px-6 ${
              activeTab === key
                ? "bg-white text-slate-900 shadow-lg dark:bg-slate-700 dark:text-white"
                : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
            }`}
          >
            <Icon icon={icon} className="inline h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{label}</span>
            {count !== null && count !== undefined && (
              <span className="hidden sm:inline"> ({count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
