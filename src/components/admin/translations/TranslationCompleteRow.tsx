"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { TranslationMissingItem } from "@/types/admin-translations";

interface TranslationCompleteRowProps {
  item: TranslationMissingItem;
  href: string;
}

/** Row of the "translated" tab: no bulk selection, opens the entity editor. */
export function TranslationCompleteRow({ item, href }: TranslationCompleteRowProps) {
  const t = useTranslations("admin.translations");
  const router = useRouter();
  const sourcePreview = Object.values(item.sourceText)[0] ?? "—";

  return (
    <tr
      className="cursor-pointer border-b border-white/10 transition-all duration-300 hover:bg-white/20 dark:hover:bg-slate-700/30"
      onClick={() => router.push(href)}
    >
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
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <Icon icon="mdi:check-circle" className="size-3" />
          {t("status.complete")}
        </span>
      </td>
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => router.push(href)}
          className="border-palette-secondary-500/30 text-palette-secondary-600 hover:bg-palette-secondary-50 dark:text-palette-secondary-400 dark:hover:bg-palette-secondary-900/20 inline-flex min-h-[44px] items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-300 lg:min-h-0"
        >
          <Icon icon="mdi:pencil" className="size-3.5" />
          {t("buttons.edit")}
        </button>
      </td>
    </tr>
  );
}
