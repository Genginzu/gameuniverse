"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGlobalSync } from "@/hooks/useGlobalSync";
import { SyncTabLayout } from "./SyncTabLayout";

interface EnrichSyncTabProps {
  syncState: {
    isSyncing: boolean;
    totalSynced: number;
    totalFailed: number;
    remaining: number;
    currentGame: string | null;
    error: string | null;
  };
  startEnrich: () => void;
  stopEnrich: () => void;
}

export function EnrichSyncTab({ syncState, startEnrich, stopEnrich }: EnrichSyncTabProps) {
  const t = useTranslations("admin.globalSync.enrichTab");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { entries, total, totalPages, isLoading } = useGlobalSync(page, search, "to_enrich");

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  return (
    <SyncTabLayout
      t={t}
      syncState={syncState}
      onStart={startEnrich}
      onStop={stopEnrich}
      startIcon="lucide:sparkles"
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
