"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Icon } from "@iconify/react";
import { EsportTeamsList } from "@/components/admin/esport/EsportTeamsList";
import { EsportPlayersList } from "@/components/admin/esport/EsportPlayersList";
import { EsportTournamentsList } from "@/components/admin/esport/EsportTournamentsList";
import { EsportMatchesList } from "@/components/admin/esport/EsportMatchesList";
import type { AdminEsportTab } from "@/types/esport";

const TABS: { key: AdminEsportTab; icon: string }[] = [
  { key: "teams", icon: "mdi:account-group" },
  { key: "players", icon: "mdi:account" },
  { key: "tournaments", icon: "mdi:trophy" },
  { key: "matches", icon: "mdi:sword-cross" },
];

export default function AdminEsportPage() {
  const t = useTranslations("admin.esport");
  useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminEsportTab>("teams");

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <div className="from-palette-secondary-500 to-palette-primary-500 flex size-10 items-center justify-center rounded-xl bg-linear-to-r">
          <Icon icon="mdi:trophy" className="size-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
          {t("title")}
        </h1>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {TABS.map(({ key, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
              activeTab === key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <Icon icon={icon} className="size-4" />
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      {activeTab === "teams" && <EsportTeamsList />}
      {activeTab === "players" && <EsportPlayersList />}
      {activeTab === "tournaments" && <EsportTournamentsList />}
      {activeTab === "matches" && <EsportMatchesList />}
    </div>
  );
}
