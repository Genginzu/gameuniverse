"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGlobalColorsSync } from "@/hooks/useGlobalColorsSync";
import { useGlobalSync } from "@/hooks/useGlobalSync";
import { SyncTabLayout } from "./SyncTabLayout";

export function ColorsSyncTab() {
  const t = useTranslations("admin.globalSync.colorsTab");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { entries, total, totalPages, isLoading, refresh } = useGlobalSync(page, search, "to_colors");
  const { colorsState, startColors, stopColors } = useGlobalColorsSync(refresh);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  return (
    <SyncTabLayout
      t={t}
      syncState={colorsState}
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
