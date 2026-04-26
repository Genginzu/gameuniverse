"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGlobalSync } from "@/hooks/useGlobalSync";
import type { BatchSyncState } from "@/hooks/useBatchSync";
import { SyncTabLayout } from "./SyncTabLayout";

interface BatchSyncTabProps {
  /** i18n namespace for this tab (e.g. "admin.globalSync.screenshotsTab") */
  ns: string;
  /** Filter key for the GET endpoint (e.g. "to_screenshots") */
  filter: string;
  /** Icon for the start button */
  startIcon: string;
  /** Sync state from useBatchSync, lifted to page level */
  syncState: BatchSyncState;
  onStart: () => void;
  onStop: () => void;
}

export function BatchSyncTab({
  ns,
  filter,
  startIcon,
  syncState,
  onStart,
  onStop,
}: BatchSyncTabProps) {
  const t = useTranslations(ns);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { entries, total, totalPages, isLoading } = useGlobalSync(page, search, filter);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <SyncTabLayout
      t={t}
      syncState={syncState}
      onStart={onStart}
      onStop={onStop}
      startIcon={startIcon}
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
    />
  );
}
