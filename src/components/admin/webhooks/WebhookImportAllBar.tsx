"use client";

interface WebhookImportAllBarProps {
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
    <div className="flex items-center justify-between rounded-xl border-2 border-violet-300 bg-violet-50 px-4 py-3 dark:border-violet-700 dark:bg-violet-900/20">
      <span className="text-sm font-medium text-violet-800 dark:text-violet-300">
        {t("importAllHint")}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <select
          value={importCount}
          onChange={(e) => onImportCountChange(Number(e.target.value))}
          disabled={importingAll}
          className="rounded-md border border-violet-300 bg-white px-2 py-1.5 text-sm text-violet-800 dark:border-violet-600 dark:bg-violet-900/40 dark:text-violet-200"
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
          className="shrink-0 rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {importingAll ? t("importingAll") : t("importAll")}
        </button>
      </div>
    </div>
  );
}
