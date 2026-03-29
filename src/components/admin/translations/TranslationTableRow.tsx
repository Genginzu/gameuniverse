"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { TranslationMissingItem, EntityType } from "@/types/admin-translations";

interface TranslationTableRowProps {
  item: TranslationMissingItem;
  entityType: EntityType;
  isSelected: boolean;
  isTranslating: boolean;
  onToggleSelect: (id: string) => void;
  onTranslate: (item: TranslationMissingItem) => void;
  onTranslateAndReview: (item: TranslationMissingItem) => void;
}

const STATUS_STYLES: Record<string, string> = {
  missing: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  complete: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function TranslationTableRow({
  item,
  entityType: _entityType,
  isSelected,
  isTranslating,
  onToggleSelect,
  onTranslate,
  onTranslateAndReview,
}: TranslationTableRowProps) {
  const t = useTranslations("admin.translations");

  // Display the first source field value as preview
  const sourcePreview = Object.values(item.sourceText)[0] ?? "—";
  const targetPreview = Object.values(item.targetText)[0];

  return (
    <tr className="border-b border-white/10 transition-all duration-300 hover:bg-white/20 dark:hover:bg-slate-700/30">
      {/* Checkbox */}
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item.entityId)}
          className="size-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 dark:border-slate-600"
        />
      </td>

      {/* Identifier */}
      <td className="max-w-[120px] truncate px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
        {item.identifier}
      </td>

      {/* Source text */}
      <td className="max-w-[200px] truncate px-3 py-3 text-sm text-gray-900 dark:text-white">
        {sourcePreview}
      </td>

      {/* Target text */}
      <td className="max-w-[200px] truncate px-3 py-3 text-sm">
        {targetPreview ? (
          <span className="text-gray-700 dark:text-gray-300">{targetPreview}</span>
        ) : (
          <span className="text-red-400 italic dark:text-red-500">{t("status.missing")}</span>
        )}
      </td>

      {/* Status badge */}
      <td className="px-3 py-3">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[item.status]}`}
        >
          {t(`status.${item.status}`)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onTranslate(item)}
            disabled={isTranslating}
            className="inline-flex items-center gap-1 rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-2.5 py-1 text-xs font-medium text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          >
            {isTranslating ? (
              <Icon icon="mdi:loading" className="size-3.5 animate-spin" />
            ) : (
              <Icon icon="mdi:translate" className="size-3.5" />
            )}
            {t("buttons.translate")}
          </button>

          <button
            onClick={() => onTranslateAndReview(item)}
            disabled={isTranslating}
            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 px-2.5 py-1 text-xs font-medium text-cyan-600 transition-all duration-300 hover:bg-cyan-50 disabled:opacity-50 dark:text-cyan-400 dark:hover:bg-cyan-900/20"
          >
            {isTranslating ? (
              <Icon icon="mdi:loading" className="size-3.5 animate-spin" />
            ) : (
              <Icon icon="mdi:file-eye" className="size-3.5" />
            )}
            {t("buttons.translateAndReview")}
          </button>
        </div>
      </td>
    </tr>
  );
}
