"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { DiffField } from "@/types/webhook-diff";

interface DiffRowProps {
  field: DiffField;
  forced: boolean;
  onToggleForce: () => void;
  applied: boolean;
}

export function DiffRow({ field, forced, onToggleForce, applied }: DiffRowProps) {
  const t = useTranslations("webhooks.diff");

  const statusStyles: Record<string, string> = {
    unchanged: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    changed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    conflict: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return "—";
    return String(val);
  };

  const isChanged = field.status !== "unchanged";

  return (
    <tr className={`transition-colors ${isChanged ? "bg-yellow-50/30 dark:bg-yellow-900/5" : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"}`}>
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
        {t(field.label)}
        {field.hasOverride && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <Icon icon="lucide:shield" className="h-3 w-3" />{t("adminEdited")}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
        <div className="break-words whitespace-pre-wrap">{formatValue(field.localValue)}</div>
      </td>
      <td className={`px-4 py-3 ${isChanged ? "font-medium text-palette-secondary-700 dark:text-palette-secondary-400" : "text-gray-600 dark:text-gray-300"}`}>
        <div className="break-words whitespace-pre-wrap">{formatValue(field.igdbValue)}</div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[field.status]}`}>{t(`statuses.${field.status}`)}</span>
      </td>
      <td className="px-4 py-3">
        {field.status === "conflict" && !applied && (
          <button onClick={onToggleForce} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${forced ? "bg-amber-500 text-white shadow-sm" : "border border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/20"}`}>
            <Icon icon={forced ? "lucide:check" : "lucide:replace"} className="h-3 w-3" />
            {forced ? t("willOverwrite") : t("overwrite")}
          </button>
        )}
        {field.status === "changed" && !applied && (
          <span className="text-xs text-green-600 dark:text-green-400">
            <Icon icon="lucide:arrow-right" className="inline h-3 w-3" /> {t("autoApply")}
          </span>
        )}
      </td>
    </tr>
  );
}
