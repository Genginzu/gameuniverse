"use client";

import type { TrackableField } from "@/types/admin-games";
import { useTranslations } from "next-intl";

interface IgdbFieldIndicatorProps {
  fieldName: TrackableField;
  isIgdbField: boolean;
}

/**
 * Small IGDB badge displayed next to a field label when the field
 * still contains original IGDB data (no manual override).
 *
 * Renders nothing if isIgdbField is false.
 *
 * Requirements: 6.1, 6.2, 6.4
 */
export function IgdbFieldIndicator({ isIgdbField }: IgdbFieldIndicatorProps) {
  const t = useTranslations("admin.games.form");

  if (!isIgdbField) return null;

  return (
    <span
      title={t("igdbFieldTooltip")}
      className="bg-palette-primary-100 text-palette-primary-700 dark:bg-palette-primary-900/40 dark:text-palette-primary-300 ml-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] leading-none font-semibold"
      aria-label={t("igdbFieldTooltip")}
    >
      IGDB
    </span>
  );
}
