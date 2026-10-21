"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { StatXL } from "@/components/shared/StatXL";
import type { GameSummary } from "@/types/game";
import { DEMO_PROGRESS, DEMO_TRACKING_STATS } from "./previewDemoData";

interface TrackingPreviewProps {
  games: GameSummary[];
}

function NowPlayingRow({ game, progress }: { game: GameSummary; progress: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-editorial-3 relative h-14 w-10 shrink-0 overflow-hidden rounded-md">
        {game.coverImage ? (
          <Image src={game.coverImage} alt="" fill sizes="40px" className="object-cover" />
        ) : (
          <Icon icon="lucide:gamepad-2" className="text-editorial-muted m-auto size-5" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="truncate font-medium text-white">{game.title}</span>
          <span className="text-editorial-muted font-mono">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="from-neon-secondary to-neon-primary h-full rounded-full bg-gradient-to-r"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/** Profile stats card: demo personal stats + real games in "now playing". */
export function TrackingPreview({ games }: TrackingPreviewProps) {
  const t = useTranslations("landing.previews.mockups");
  const formatter = new Intl.NumberFormat(useLocale());
  const nowPlaying = games.slice(0, DEMO_PROGRESS.length);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        <StatXL
          value={`${formatter.format(DEMO_TRACKING_STATS.playtimeHours)}h`}
          label={t("trackingPlaytime")}
          className="[&>span:first-child]:text-[clamp(1.5rem,4vw,2.25rem)]"
        />
        <StatXL
          value={formatter.format(DEMO_TRACKING_STATS.completedGames)}
          label={t("trackingCompleted")}
          className="[&>span:first-child]:text-[clamp(1.5rem,4vw,2.25rem)]"
        />
        <StatXL
          value={`${DEMO_TRACKING_STATS.averageRating}/20`}
          label={t("trackingAverage")}
          className="[&>span:first-child]:text-[clamp(1.5rem,4vw,2.25rem)]"
        />
      </div>

      {nowPlaying.length > 0 && (
        <div className="border-editorial-line flex flex-col gap-4 border-t pt-5">
          <KickerLabel as="span">{t("trackingNowPlaying")}</KickerLabel>
          {nowPlaying.map((game, index) => (
            <NowPlayingRow key={game.id} game={game} progress={DEMO_PROGRESS[index]} />
          ))}
        </div>
      )}
    </div>
  );
}
