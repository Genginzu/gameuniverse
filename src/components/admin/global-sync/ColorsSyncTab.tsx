"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGlobalSync } from "@/hooks/useGlobalSync";
import { SyncTabLayout } from "./SyncTabLayout";

interface ColorsSyncTabProps {
  syncState: {
    isSyncing: boolean;
    totalSynced: number;
    totalFailed: number;
    remaining: number;
    currentGame: string | null;
    error: string | null;
  };
  startColors: () => void;
  stopColors: () => void;
}

export function ColorsSyncTab({ syncState, startColors, stopColors }: ColorsSyncTabProps) {
  const t = useTranslations("admin.globalSync.colorsTab");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { entries, total, totalPages, isLoading } = useGlobalSync(page, search, "to_colors");

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <SyncTabLayout
      t={t}
      syncState={syncState}
      onStart={startColors}
      onStop={stopColors}
      startIcon="lucide:palette"
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
