"use client";

interface WebhookImportAllBarProps {
  totalNotImported: number;
  importCount: number;
  onImportCountChange: (count: number) => void;
  importingAll: boolean;
  importingAny: boolean;
  onImportAll: () => void;
  t: (key: string) => string;
}

const IMPORT_COUNTS = [20, 40, 60, 80, 100, 200, 300, 400];

export function WebhookImportAllBar({
  importCount,
  onImportCountChange,
  importingAll,
  importingAny,
  onImportAll,
  t,
}: WebhookImportAllBarProps) {
  return (
    <div className="border-palette-primary-300 bg-palette-primary-50 dark:border-palette-primary-700 dark:bg-palette-primary-900/20 flex items-center justify-between rounded-xl border-2 px-4 py-3">
      <span className="text-palette-primary-800 dark:text-palette-primary-300 text-sm font-medium">
        {t("importAllHint")}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <select
          value={importCount}
          onChange={(e) => onImportCountChange(Number(e.target.value))}
          disabled={importingAll}
          className="border-palette-primary-300 text-palette-primary-800 dark:border-palette-primary-600 dark:bg-palette-primary-900/40 dark:text-palette-primary-200 rounded-md border bg-white px-2 py-1.5 text-sm"
        >
          {IMPORT_COUNTS.map((n) => (
            <option key={n} value={n}>
              {n} {t("importCountLabel")}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={importingAll || importingAny}
          onClick={onImportAll}
          className="from-palette-secondary-500 to-palette-primary-500 shrink-0 rounded-lg bg-linear-to-r px-5 py-2 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {importingAll ? t("importingAll") : t("importAll")}
        </button>
      </div>
    </div>
  );
}
