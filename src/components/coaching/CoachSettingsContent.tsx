"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@iconify/react";
import { CoachProfileForm } from "./CoachProfileForm";
import { CoachGamesSection } from "./CoachGamesSection";
import { CoachPricingSection } from "./CoachPricingSection";
import type { CoachProfile } from "@/types/coaching";

const TABS = ["profile", "games", "pricing"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, string> = {
  profile: "lucide:user",
  games: "lucide:gamepad-2",
  pricing: "lucide:credit-card",
};

export function CoachSettingsContent() {
  const t = useTranslations("coaching.settings");
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { data } = useSWR<{ profile: CoachProfile | null }>("/api/coaching/profile", fetcher);

  const hasProfile = !!data?.profile;

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="space-y-6 p-4 md:space-y-8 md:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((tab) => {
          const disabled = tab !== "profile" && !hasProfile;
          return (
            <button
              key={tab}
              onClick={() => !disabled && setActiveTab(tab)}
              disabled={disabled}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-linear-to-r from-cyan-500 to-violet-500 text-white"
                  : disabled
                    ? "cursor-not-allowed bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              <Icon icon={TAB_ICONS[tab]} className="size-4" />
              {t(`tabs.${tab}`)}
            </button>
          );
        })}
      </div>

      {activeTab === "profile" && <CoachProfileForm />}
      {activeTab === "games" && hasProfile && <CoachGamesSection />}
      {activeTab === "pricing" && hasProfile && <CoachPricingSection />}
    </div>
  );
}
