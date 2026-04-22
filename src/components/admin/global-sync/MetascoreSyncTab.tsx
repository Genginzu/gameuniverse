"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGlobalSync } from "@/hooks/useGlobalSync";
import { SyncTabLayout, StatBadge } from "./SyncTabLayout";

interface MetascoreSyncTabProps {
  syncState: {
    isSyncing: boolean;
    totalSynced: number;
    totalFailed: number;
    remaining: number;
    currentGame: string | null;
    lastSource: string | null;
    error: string | null;
  };
  startMetascoreSync: () => void;
  stopMetascoreSync: () => void;
}

export function MetascoreSyncTab({ syncState, startMetascoreSync, stopMetascoreSync }: MetascoreSyncTabProps) {
  const t = useTranslations("admin.globalSync.metascoreTab");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { entries, total, totalPages, isLoading } = useGlobalSync(page, search, "to_metascore");

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  return (
    <SyncTabLayout
      t={t}
      syncState={syncState}
      onStart={startMetascoreSync}
      onStop={stopMetascoreSync}
      startIcon="lucide:star"
      entries={entries}
      total={total}
      totalPages={totalPages}
      isLoading={isLoading}
      page={page}
      onPageChange={setPage}
      searchInput={searchInput}
      onSearchInputChange={setSearchInput}
      onSearch={handleSearch}
      searchPlaceholder={t("searchPlaceholder")}
      emptyKey="allDone"
      renderExtraStats={() =>
        syncState.lastSource ? (
          <StatBadge icon="lucide:database" color="text-cyan-500" label={t("source", { source: syncState.lastSource })} />
        ) : null
      }
    />
  );
}
