"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGlobalMetascoreSync } from "@/hooks/useGlobalMetascoreSync";
import { useGlobalSync } from "@/hooks/useGlobalSync";
import { SyncTabLayout, StatBadge } from "./SyncTabLayout";

export function MetascoreSyncTab() {
  const t = useTranslations("admin.globalSync.metascoreTab");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { entries, total, totalPages, isLoading, refresh } = useGlobalSync(page, search, "to_metascore");
  const { metascoreState, startMetascoreSync, stopMetascoreSync } = useGlobalMetascoreSync(refresh);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  return (
    <SyncTabLayout
      t={t}
      syncState={metascoreState}
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
        metascoreState.lastSource ? (
          <StatBadge icon="lucide:database" color="text-cyan-500" label={t("source", { source: metascoreState.lastSource })} />
        ) : null
      }
    />
  );
}
