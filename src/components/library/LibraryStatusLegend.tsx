"use client";

/**
 * LibraryStatusLegend : key of the status icons shown on the `/library` cards.
 */

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { LIBRARY_STATUSES } from "@/lib/validations/library";
import { LIBRARY_STATUS_ICONS } from "./LibraryStatusMenu";

export function LibraryStatusLegend() {
  const t = useTranslations("libraryStatus");

  return (
    <ul
      aria-label={t("legendTitle")}
      className="text-editorial-muted mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
    >
      {LIBRARY_STATUSES.map((status) => (
        <li key={status} className="inline-flex items-center gap-2">
          <span
            className="bg-editorial-bg/80 border-editorial-line grid size-7 place-items-center rounded-full border text-white"
            aria-hidden
          >
            <Icon icon={LIBRARY_STATUS_ICONS[status]} className="size-3.5" />
          </span>
          {t(status)}
        </li>
      ))}
    </ul>
  );
}
