"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import {
  SHOWCASE_LIBRARY_STATUSES,
  type AdminShowcaseItem,
  type ShowcaseLibraryStatus,
} from "@/types/home";
import { ShowcaseThumb } from "./ShowcaseThumb";

interface ShowcaseItemRowProps {
  item: AdminShowcaseItem;
  index: number;
  total: number;
  disabled: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onStatusChange: (id: string, status: ShowcaseLibraryStatus) => void;
}

const ICON_BUTTON =
  "flex size-11 items-center justify-center rounded-xl text-gray-500 transition-all duration-300 hover:bg-white/40 hover:text-gray-900 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-slate-700/60 dark:hover:text-white";

export function ShowcaseItemRow({
  item,
  index,
  total,
  disabled,
  onMove,
  onRemove,
  onStatusChange,
}: ShowcaseItemRowProps) {
  const t = useTranslations("admin.homeShowcase");
  const name = item.entity?.name ?? t("missingEntity");

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-white/20 bg-white/40 p-3 backdrop-blur-xl sm:flex-row sm:items-center dark:border-slate-700/50 dark:bg-slate-800/50">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="w-6 text-center font-mono text-sm text-gray-400">{index + 1}</span>
        <ShowcaseThumb imageUrl={item.entity?.imageUrl ?? null} kind={item.kind} />
        <span className="min-w-0 truncate text-sm font-medium text-gray-900 dark:text-white">
          {name}
        </span>
      </div>

      <div className="flex items-center gap-1 self-end sm:self-auto">
        {item.kind === "game" && (
          <select
            aria-label={t("statusLabel", { name })}
            value={item.libraryStatus ?? "owned"}
            disabled={disabled}
            onChange={(event) =>
              onStatusChange(item.id, event.target.value as ShowcaseLibraryStatus)
            }
            className="glass-input mr-1 min-h-11 rounded-xl px-3 text-base sm:text-sm"
          >
            {SHOWCASE_LIBRARY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`statuses.${status}`)}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          className={ICON_BUTTON}
          disabled={disabled || index === 0}
          onClick={() => onMove(index, -1)}
          aria-label={t("moveUp", { name })}
        >
          <Icon icon="lucide:arrow-up" className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className={ICON_BUTTON}
          disabled={disabled || index === total - 1}
          onClick={() => onMove(index, 1)}
          aria-label={t("moveDown", { name })}
        >
          <Icon icon="lucide:arrow-down" className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className={`${ICON_BUTTON} hover:text-red-600 dark:hover:text-red-400`}
          disabled={disabled}
          onClick={() => onRemove(item.id)}
          aria-label={t("remove", { name })}
        >
          <Icon icon="lucide:trash-2" className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}
