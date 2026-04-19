"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { BulkImportField } from "@/hooks/useBulkImport";

const FIELD_ICONS: Record<BulkImportField, string> = {
  cover: "lucide:image",
  background: "lucide:wallpaper",
  playtime: "lucide:clock",
  metascore: "lucide:star",
  releaseDate: "lucide:calendar",
  popularity: "lucide:flame",
};

interface BulkImportFieldCardsProps {
  fieldCounts: Record<string, number> | undefined;
  selectedField: BulkImportField;
  onSelect: (field: BulkImportField) => void;
  loading: boolean;
}

const FIELDS: BulkImportField[] = [
  "cover",
  "background",
  "playtime",
  "metascore",
  "releaseDate",
  "popularity",
];

export function BulkImportFieldCards({
  fieldCounts,
  selectedField,
  onSelect,
  loading,
}: BulkImportFieldCardsProps) {
  const t = useTranslations("bulkImport");

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
      {FIELDS.map((field) => {
        const count = fieldCounts?.[field] ?? 0;
        const isActive = selectedField === field;

        return (
          <button
            key={field}
            onClick={() => onSelect(field)}
            className={`flex min-h-[44px] flex-col items-center gap-2 rounded-xl p-4 transition-all ${
              isActive
                ? "border border-cyan-500/50 bg-linear-to-br from-cyan-500/20 to-violet-500/20 shadow-lg"
                : "glass-card hover:bg-white/60 dark:hover:bg-slate-700/60"
            }`}
          >
            <Icon
              icon={FIELD_ICONS[field]}
              className={`size-6 ${isActive ? "text-cyan-500" : "text-gray-500 dark:text-gray-400"}`}
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {t(`fields.${field}`)}
            </span>
            {loading ? (
              <span className="h-5 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : (
              <span
                className={`text-lg font-bold ${
                  count > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
