"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import {
  useBulkImportCharacters,
  type CharacterImportField,
} from "@/hooks/useBulkImportCharacters";
import { BulkImportGameList } from "@/components/admin/bulk-import/BulkImportGameList";

const VALID_FIELDS: CharacterImportField[] = ["image", "background"];

export default function BulkImportCharacterFieldPage() {
  const params = useParams();
  const field = params.field as string;
  const t = useTranslations("bulkImportCharacters");

  const isValid = VALID_FIELDS.includes(field as CharacterImportField);

  const {
    batchSize,
    setBatchSize,
    fieldCounts,
    games,
    gamesTotal,
    gamesLoading,
    syncing,
    progress,
    gameStatuses,
    gameErrors,
    handleSync,
    handleAbort,
  } = useBulkImportCharacters(isValid ? (field as CharacterImportField) : "image");

  if (!isValid) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <Icon icon="lucide:alert-circle" className="size-12 text-red-500" />
        <p className="text-gray-600 dark:text-gray-400">{t("invalidField")}</p>
        <Link href="/admin/bulk-import-characters" className="text-palette-secondary-500 hover:underline">
          {t("backToFields")}
        </Link>
      </div>
    );
  }

  const count = fieldCounts?.[field] ?? 0;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <Link
          href="/admin/bulk-import-characters"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Icon icon="lucide:arrow-left" className="size-4" />
          {t("backToFields")}
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">
            {t(`fields.${field}`)}
          </h1>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {count}
          </span>
        </div>
      </div>

      <BulkImportGameList
        games={games}
        total={gamesTotal}
        loading={gamesLoading}
        syncing={syncing}
        batchSize={batchSize}
        selectedField={field as CharacterImportField}
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
