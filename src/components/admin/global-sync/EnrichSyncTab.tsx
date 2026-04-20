"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGlobalEnrichSync } from "@/hooks/useGlobalEnrichSync";
import { useGlobalSync } from "@/hooks/useGlobalSync";
import { SyncTabLayout } from "./SyncTabLayout";

export function EnrichSyncTab() {
  const t = useTranslations("admin.globalSync.enrichTab");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { entries, total, totalPages, isLoading, refresh } = useGlobalSync(page, search, "to_enrich");
  const { enrichState, startEnrich, stopEnrich } = useGlobalEnrichSync(refresh);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  return (
    <SyncTabLayout
      t={t}
      syncState={enrichState}
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
