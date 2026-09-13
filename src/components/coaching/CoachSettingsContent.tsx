"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { CoachProfileForm } from "./CoachProfileForm";
import { CoachGamesSection } from "./CoachGamesSection";
import { CoachPricingSection } from "./CoachPricingSection";
import { StripeConnectSection } from "./StripeConnectSection";
import type { CoachProfile } from "@/types/coaching";

const TABS = ["profile", "games", "pricing", "stripe"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, string> = {
  profile: "lucide:user",
  games: "lucide:gamepad-2",
  pricing: "lucide:credit-card",
  stripe: "lucide:wallet",
};

export function CoachSettingsContent() {
  const t = useTranslations("coaching.settings");
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { data } = useSWR<{ profile: CoachProfile | null }>("/api/coaching/profile", fetcher);

  const hasProfile = !!data?.profile;

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6 lg:p-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.06]" />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <h1 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
          {t("title")}
        </h1>
        <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-3 rounded-xl border p-8 text-center">
          <Icon icon="lucide:lock" className="text-editorial-muted size-10" />
          <p className="text-editorial-muted text-sm">{t("loginRequired")}</p>
          <Link
            href="/auth"
            className="from-palette-secondary-500 to-palette-primary-500 rounded-lg bg-linear-to-r px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t("login")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:space-y-8 md:p-6 lg:p-8">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
          {t("title")}
        </h1>
        <p className="text-editorial-muted mt-1 text-sm">{t("subtitle")}</p>
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
                  ? "from-palette-secondary-500 to-palette-primary-500 bg-linear-to-r text-white"
                  : disabled
                    ? "cursor-not-allowed bg-white/5 text-white/30"
                    : "text-editorial-muted bg-white/10 hover:bg-white/15"
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
      {activeTab === "stripe" && hasProfile && <StripeConnectSection />}
    </div>
  );
}
