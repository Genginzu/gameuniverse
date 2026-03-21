"use client";

import { type UseFormReturn } from "react-hook-form";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import { buildGameColors, getMetascoreColor } from "@/lib/utils/game-utils";

interface GameMetascorePreviewProps {
  form: UseFormReturn<AdminGameFormData>;
}

/**
 * Live preview of the Metascore card as it appears on the public game page.
 * Watches form metascore + color fields and renders a miniature
 * representation matching the GameOverviewSection metascore card.
 */
export function GameMetascorePreview({ form }: GameMetascorePreviewProps) {
  const tDetails = useTranslations("gameDetails");
  const metascoreRaw = form.watch("metascore");
  const bgColorRaw = form.watch("background_color");
  const accentColorRaw = form.watch("accent_color");
  const labelColorRaw = form.watch("label_color");

  const colors = buildGameColors({
    backgroundColor: bgColorRaw || undefined,
    accentColor: accentColorRaw || undefined,
    labelColor: labelColorRaw || undefined,
  });

  const score =
    metascoreRaw !== null && metascoreRaw !== undefined && metascoreRaw !== ""
      ? Number(metascoreRaw)
      : null;
  const hasScore = score !== null && !isNaN(score) && score >= 0;

  const ratingLabel = hasScore
    ? score >= 90
      ? tDetails("metascoreRatings.exceptional")
      : score >= 75
        ? tDetails("metascoreRatings.excellent")
        : score >= 60
          ? tDetails("metascoreRatings.good")
          : score >= 40
            ? tDetails("metascoreRatings.average")
            : tDetails("metascoreRatings.poor")
    : null;

  return (
    <div className="mt-3">
      <div
        className="overflow-hidden rounded-xl border border-gray-200/60 p-4 dark:border-gray-700/40"
        style={{ backgroundColor: colors.backgroundColor }}
        data-testid="metascore-preview"
      >
        {!hasScore ? (
          <div className="flex flex-col items-center justify-center py-4 text-slate-400">
            <Icon icon="lucide:star" className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-xs">Aucun metascore renseigné</p>
          </div>
        ) : (
          <div
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
            data-testid="metascore-preview-card"
          >
            <div className="mb-2 flex items-center gap-2">
              <Icon icon="lucide:star" className="h-4 w-4" style={{ color: colors.accent }} />
              <span className="text-sm" style={{ color: colors.labelColor }}>
                Metascore
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`${getMetascoreColor(score)} rounded-lg px-3 py-1 text-lg font-bold text-white`}
              >
                {score}
              </div>
              <span className="text-sm" style={{ color: colors.labelColor }}>
                {ratingLabel}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
