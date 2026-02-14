"use client";

import { type UseFormReturn } from "react-hook-form";
import { Calendar } from "lucide-react";
import { useLocale } from "next-intl";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import { buildGameColors, formatReleaseDate } from "@/lib/utils/game-utils";

interface GameReleaseDatePreviewProps {
  form: UseFormReturn<AdminGameFormData>;
  t: (key: string) => string;
}

/**
 * Live preview of the release date card as it appears on the public game page.
 * Watches form release_date + color fields and renders a miniature
 * representation matching the GameOverviewSection release date card.
 */
export function GameReleaseDatePreview({ form, t }: GameReleaseDatePreviewProps) {
  const locale = useLocale();
  const releaseDate = form.watch("release_date");
  const bgColorRaw = form.watch("background_color");
  const accentColorRaw = form.watch("accent_color");
  const labelColorRaw = form.watch("label_color");
  const textColorRaw = form.watch("text_color");

  const colors = buildGameColors({
    backgroundColor: bgColorRaw || undefined,
    accentColor: accentColorRaw || undefined,
    labelColor: labelColorRaw || undefined,
    textColor: textColorRaw || undefined,
  });

  const formattedDate = formatReleaseDate(releaseDate || undefined, locale);

  return (
    <div className="mt-3">
      <div
        className="overflow-hidden rounded-xl border border-gray-200/60 p-4 dark:border-gray-700/40"
        style={{ backgroundColor: colors.backgroundColor }}
        data-testid="release-date-preview"
      >
        {!formattedDate ? (
          <div className="flex flex-col items-center justify-center py-4 text-slate-400">
            <Calendar className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-xs">
              {t("releaseDateNoData") ?? "Aucune date de sortie renseignée"}
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
            data-testid="release-date-preview-card"
          >
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" style={{ color: colors.accent }} />
              <span className="text-sm" style={{ color: colors.labelColor }}>
                {t("releaseDate") ?? "Date de sortie"}
              </span>
            </div>
            <span className="font-medium" style={{ color: colors.textColor }}>
              {formattedDate}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
