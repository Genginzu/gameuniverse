"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGlobalSyncImport } from "@/hooks/useGlobalSyncImport";
import { useGlobalSync } from "@/hooks/useGlobalSync";
import { SyncTabLayout } from "./SyncTabLayout";

export function SyncImportTab() {
  const t = useTranslations("admin.globalSync.syncTab");
  const tCommon = useTranslations("admin.globalSync");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { entries, total, totalPages, isLoading, refresh } = useGlobalSync(page, search, "unsynced");
  const { syncState, startSync, stopSync } = useGlobalSyncImport(refresh);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

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
