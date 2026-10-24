"use client";

/**
 * HomeLevelProgress : player level + XP progress bar towards the next level.
 */

import { useTranslations } from "next-intl";

import type { PlayerXpStats } from "@/types/achievement";

interface HomeLevelProgressProps {
  xp: PlayerXpStats | null;
}

export function HomeLevelProgress({ xp }: HomeLevelProgressProps) {
  const t = useTranslations("homeDashboard.hero");

  if (!xp) {
    return <div className="mt-2 h-10 max-w-sm animate-pulse rounded-lg bg-white/[0.06]" />;
  }

  return (
    <div className="mt-2 flex max-w-sm flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-white">{t("level", { level: xp.level })}</span>
        <span className="text-editorial-muted font-mono text-xs">
          {t("xpProgress", { current: xp.currentLevelXp, next: xp.nextLevelXp })}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={t("levelProgress")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={xp.progressPercent}
        className="h-1.5 overflow-hidden rounded-full bg-white/10"
      >
        <div
          className="from-palette-secondary-500 to-palette-primary-500 h-full rounded-full bg-linear-to-r"
          style={{ width: `${xp.progressPercent}%` }}
        />
      </div>
    </div>
  );
}
