"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useGlobalDownload } from "@/hooks/useGlobalDownload";
import { useGlobalSyncImport } from "@/hooks/useGlobalSyncImport";
import { useGlobalColorsSync } from "@/hooks/useGlobalColorsSync";
import { useGlobalMetascoreSync } from "@/hooks/useGlobalMetascoreSync";
import { useBatchSync } from "@/hooks/useBatchSync";
import { GlobalSyncTab } from "@/components/admin/global-sync/GlobalSyncTab";
import { SyncImportTab } from "@/components/admin/global-sync/SyncImportTab";
import { BatchSyncTab } from "@/components/admin/global-sync/BatchSyncTab";
import { ColorsSyncTab } from "@/components/admin/global-sync/ColorsSyncTab";
import { MetascoreSyncTab } from "@/components/admin/global-sync/MetascoreSyncTab";

const TABS = [
  "download",
  "sync",
  "screenshots",
  "artworks",
  "videos",
  "classifications",
  "languages",
  "versions",
  "playtime",
  "popularity",
  "colors",
  "metascore",
] as const;
type Tab = (typeof TABS)[number];

const NS = "admin.globalSync";

export default function GlobalSyncPage() {
  const t = useTranslations(NS);
  useAdminAuth();
  const [activeTab, setActiveTab] = useState<Tab>("download");

  const { downloadState, startDownload, stopDownload } = useGlobalDownload();
  const { syncState, startSync, stopSync } = useGlobalSyncImport();
  const screenshots = useBatchSync("/api/admin/global-sync/screenshots");
  const artworks = useBatchSync("/api/admin/global-sync/artworks");
  const videos = useBatchSync("/api/admin/global-sync/videos");
  const classifications = useBatchSync("/api/admin/global-sync/classifications");
  const languages = useBatchSync("/api/admin/global-sync/languages");
  const versions = useBatchSync("/api/admin/global-sync/versions");
  const playtime = useBatchSync("/api/admin/global-sync/playtime");
  const popularity = useBatchSync("/api/admin/global-sync/popularity");
  const { colorsState, startColors, stopColors } = useGlobalColorsSync();
  const { metascoreState, startMetascoreSync, stopMetascoreSync } = useGlobalMetascoreSync();

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === "download" && (
        <GlobalSyncTab
          downloadState={downloadState}
          startDownload={startDownload}
          stopDownload={stopDownload}
        />
      )}
      {activeTab === "sync" && (
        <SyncImportTab syncState={syncState} startSync={startSync} stopSync={stopSync} />
      )}
      {activeTab === "screenshots" && (
        <BatchSyncTab
          ns={`${NS}.screenshotsTab`}
          filter="to_screenshots"
          startIcon="lucide:image"
          syncState={screenshots.syncState}
          onStart={screenshots.start}
          onStop={screenshots.stop}
        />
      )}
      {activeTab === "artworks" && (
        <BatchSyncTab
          ns={`${NS}.artworksTab`}
          filter="to_artworks"
          startIcon="lucide:palette"
          syncState={artworks.syncState}
          onStart={artworks.start}
          onStop={artworks.stop}
        />
      )}
      {activeTab === "videos" && (
        <BatchSyncTab
          ns={`${NS}.videosTab`}
          filter="to_videos"
          startIcon="lucide:video"
          syncState={videos.syncState}
          onStart={videos.start}
          onStop={videos.stop}
        />
      )}
      {activeTab === "classifications" && (
        <BatchSyncTab
          ns={`${NS}.classificationsTab`}
          filter="to_classifications"
          startIcon="lucide:shield"
          syncState={classifications.syncState}
          onStart={classifications.start}
          onStop={classifications.stop}
        />
      )}
      {activeTab === "languages" && (
        <BatchSyncTab
          ns={`${NS}.languagesTab`}
          filter="to_languages"
          startIcon="lucide:globe"
          syncState={languages.syncState}
          onStart={languages.start}
          onStop={languages.stop}
        />
      )}
      {activeTab === "versions" && (
        <BatchSyncTab
          ns={`${NS}.versionsTab`}
          filter="to_versions"
          startIcon="lucide:layers"
          syncState={versions.syncState}
          onStart={versions.start}
          onStop={versions.stop}
        />
      )}
      {activeTab === "playtime" && (
        <BatchSyncTab
          ns={`${NS}.playtimeTab`}
          filter="to_playtime"
          startIcon="lucide:clock"
          syncState={playtime.syncState}
          onStart={playtime.start}
          onStop={playtime.stop}
        />
      )}
      {activeTab === "popularity" && (
        <BatchSyncTab
          ns={`${NS}.popularityTab`}
          filter="to_popularity"
          startIcon="lucide:trending-up"
          syncState={popularity.syncState}
          onStart={popularity.start}
          onStop={popularity.stop}
        />
      )}
      {activeTab === "colors" && (
        <ColorsSyncTab syncState={colorsState} startColors={startColors} stopColors={stopColors} />
      )}
      {activeTab === "metascore" && (
        <MetascoreSyncTab
          syncState={metascoreState}
          startMetascoreSync={startMetascoreSync}
          stopMetascoreSync={stopMetascoreSync}
        />
      )}
    </div>
  );
}
