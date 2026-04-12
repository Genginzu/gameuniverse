"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { GlobalSyncTab } from "@/components/admin/global-sync/GlobalSyncTab";
import { SyncImportTab } from "@/components/admin/global-sync/SyncImportTab";
import { MetascoreSyncTab } from "@/components/admin/global-sync/MetascoreSyncTab";

const TABS = ["download", "sync", "metascore"] as const;
type Tab = (typeof TABS)[number];

export default function GlobalSyncPage() {
  const t = useTranslations("admin.globalSync");
  useAdminAuth();
  const [activeTab, setActiveTab] = useState<Tab>("download");

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === "download" && <GlobalSyncTab />}
      {activeTab === "sync" && <SyncImportTab />}
      {activeTab === "metascore" && <MetascoreSyncTab />}
    </div>
  );
}
