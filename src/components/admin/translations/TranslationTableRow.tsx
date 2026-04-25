"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { TranslationMissingItem } from "@/types/admin-translations";

interface TranslationTableRowProps {
  item: TranslationMissingItem;
  isSelected: boolean;
  isTranslating: boolean;
  href: string;
  onToggleSelect: (id: string) => void;
  onTranslate: (item: TranslationMissingItem) => void;
  onTranslateAndReview: (item: TranslationMissingItem) => void;
}

export function TranslationTableRow({
  item,
  isSelected,
  isTranslating,
  href,
  onToggleSelect,
  onTranslate,
  onTranslateAndReview,
}: TranslationTableRowProps) {
  const t = useTranslations("admin.translations");
  const router = useRouter();
  const sourcePreview = Object.values(item.sourceText)[0] ?? "—";

  return (
    <tr
      className="cursor-pointer border-b border-white/10 transition-all duration-300 hover:bg-white/20 dark:hover:bg-slate-700/30"
      onClick={() => router.push(href)}
    >
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item.entityId)}
          className="size-4 rounded border-gray-300 text-palette-secondary-500 focus:ring-palette-secondary-500 dark:border-slate-600"
        />
      </td>
      <td className="max-w-[120px] truncate px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
        {item.identifier}
      </td>
      <td className="max-w-[200px] truncate px-3 py-3 text-sm text-gray-900 dark:text-white">
        {sourcePreview}
      </td>
      <td className="px-3 py-3">
        <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {t(`languages.${item.sourceLang}`)}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {item.missingLangs.map((lang) => (
            <span
              key={lang}
              className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
            >
              {t(`languages.${lang}`)}
            </span>
          ))}
        </div>
      </td>
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onTranslate(item)}
            disabled={isTranslating}
            className="inline-flex items-center gap-1 rounded-lg bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 px-2.5 py-1 text-xs font-medium text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50"
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
            className="inline-flex items-center gap-1 rounded-lg border border-palette-secondary-500/30 px-2.5 py-1 text-xs font-medium text-palette-secondary-600 transition-all duration-300 hover:bg-palette-secondary-50 disabled:opacity-50 dark:text-palette-secondary-400 dark:hover:bg-palette-secondary-900/20"
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
