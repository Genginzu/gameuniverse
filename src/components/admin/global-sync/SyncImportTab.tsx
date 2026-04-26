"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGlobalSync } from "@/hooks/useGlobalSync";
import { SyncTabLayout } from "./SyncTabLayout";

interface SyncImportTabProps {
  syncState: {
    isSyncing: boolean;
    totalSynced: number;
    totalFailed: number;
    remaining: number;
    currentGame: string | null;
    lastError: string | null;
    error: string | null;
  };
  startSync: () => void;
  stopSync: () => void;
}

export function SyncImportTab({ syncState, startSync, stopSync }: SyncImportTabProps) {
  const t = useTranslations("admin.globalSync.syncTab");
  const tCommon = useTranslations("admin.globalSync");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { entries, total, totalPages, isLoading } = useGlobalSync(page, search, "unsynced");

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <SyncTabLayout
      t={t}
      syncState={syncState}
      onStart={startSync}
      onStop={stopSync}
      startIcon="lucide:play"
      entries={entries}
      total={total}
      totalPages={totalPages}
      isLoading={isLoading}
      page={page}
      onPageChange={setPage}
      searchInput={searchInput}
      onSearchInputChange={setSearchInput}
      onSearch={handleSearch}
      searchPlaceholder={tCommon("searchPlaceholder")}
      emptyKey="allSynced"
      showProgress={syncState.isSyncing || syncState.totalSynced > 0 || syncState.totalFailed > 0}
      renderExtraErrors={() =>
        syncState.lastError ? (
          <p className="mt-2 text-xs text-orange-500 dark:text-orange-400">
            Dernière erreur : {syncState.lastError}
          </p>
        ) : null
      }
    />
  );
}
