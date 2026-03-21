"use client";

import { type UseFormReturn } from "react-hook-form";
import { Icon } from "@iconify/react";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import { buildGameColors } from "@/lib/utils/game-utils";

interface GamePlaytimePreviewProps {
  form: UseFormReturn<AdminGameFormData>;
  t: (key: string) => string;
}

function formatHours(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || num <= 0) return "-";
  if (num < 1) return `${Math.round(num * 60)} min`;
  return `${num}h`;
}

/**
 * Live preview of playtime values as they appear on the public game page.
 * Watches form playtime + accent color fields and renders a miniature
 * representation matching the GamePlaytimeOfficial component.
 */
export function GamePlaytimePreview({ form, t }: GamePlaytimePreviewProps) {
  const hastily = form.watch("playtime_hastily");
  const normally = form.watch("playtime_normally");
  const completely = form.watch("playtime_completely");
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
  const accent = colors.accent;

  const hasAny =
    (hastily !== null && hastily !== undefined && hastily !== "") ||
    (normally !== null && normally !== undefined && normally !== "") ||
    (completely !== null && completely !== undefined && completely !== "");

  const cards = [
    { icon: "lucide:zap", label: t("playtimeHastily") ?? "Rapide", value: hastily },
    { icon: "lucide:gamepad-2", label: t("playtimeNormally") ?? "Normal", value: normally },
    {
      icon: "lucide:trophy",
      label: t("playtimeCompletely") ?? "Complétionniste",
      value: completely,
    },
  ] as const;

  return (
    <div className="mt-3">
      <h4 className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        {t("playtimePreview") ?? "Aperçu du temps de jeu"}
      </h4>
      <div
        className="overflow-hidden rounded-xl border border-gray-200/60 p-4 dark:border-gray-700/40"
        style={{ backgroundColor: colors.backgroundColor }}
        data-testid="playtime-preview"
      >
        {!hasAny ? (
          <div className="flex flex-col items-center justify-center py-4 text-slate-400">
            <Icon icon="lucide:clock" className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-xs">{t("playtimeNoData") ?? "Aucun temps de jeu renseigné"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <h5
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: colors.textColor }}
            >
              <Icon icon="lucide:clock" className="h-4 w-4" style={{ color: accent }} />
              {t("playtime") ?? "Temps de jeu"}
            </h5>
            <div className="space-y-1.5">
              {cards.map(({ icon: iconName, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2"
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${accent}20` }}
                  >
                    <Icon icon={iconName} className="h-3.5 w-3.5" style={{ color: accent }} />
                  </div>
                  <span className="flex-1 text-xs" style={{ color: colors.labelColor }}>
                    {label}
                  </span>
                  <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                    {formatHours(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
