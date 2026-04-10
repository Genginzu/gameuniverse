"use client";

import { useTranslations } from "next-intl";
import { useBulkImport } from "@/hooks/useBulkImport";
import { BulkImportFieldCards } from "@/components/admin/bulk-import/BulkImportFieldCards";
import { BulkImportGameList } from "@/components/admin/bulk-import/BulkImportGameList";

export default function AdminBulkImportPage() {
  const t = useTranslations("bulkImport");
  const {
    selectedField,
    setSelectedField,
    batchSize,
    setBatchSize,
    fieldCounts,
    countsLoading,
    games,
    gamesTotal,
    gamesLoading,
    syncing,
    progress,
    gameStatuses,
    gameErrors,
    handleSync,
    handleAbort,
  } = useBulkImport();

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("description")}</p>
      </div>

      <BulkImportFieldCards
        fieldCounts={fieldCounts}
        selectedField={selectedField}
        onSelect={setSelectedField}
        loading={countsLoading}
      />

      <BulkImportGameList
        games={games}
        total={gamesTotal}
        loading={gamesLoading}
        syncing={syncing}
        batchSize={batchSize}
        selectedField={selectedField}
        progress={progress}
        gameStatuses={gameStatuses}
        gameErrors={gameErrors}
        onBatchSizeChange={setBatchSize}
        onSync={handleSync}
        onAbort={handleAbort}
      />
    </div>
  );
}
