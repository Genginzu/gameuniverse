"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { LazyImage } from "@/components/ui/lazy-image";
import { getGameIcon, getMatchStatusInfo } from "@/lib/utils/esport-utils";
import type { PlayerMatch } from "@/lib/services/esportPlayerMatchesService";

interface PlayerRecentMatchesProps {
  matches: PlayerMatch[];
  isLoading: boolean;
}

/**
 * List of recent matches for a player, displayed as compact rows.
 * Renders a skeleton while loading and nothing if the list is empty.
 */
export function PlayerRecentMatches({ matches, isLoading }: PlayerRecentMatchesProps) {
  const t = useTranslations("esport.players");

  if (isLoading) {
    return (
      <section className="glass-card rounded-2xl p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          {t("recentMatches")}
        </h2>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800/60"
              aria-hidden
            />
          ))}
        </div>
      </section>
    );
  }

  if (matches.length === 0) {
    return null;
  }

  return (
    <section className="glass-card rounded-2xl p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
        <Icon icon="mdi:history" className="text-palette-primary-500 h-5 w-5" />
        {t("recentMatches")}
      </h2>
      <ul className="space-y-3">
        {matches.map((match) => (
          <li key={match.id}>
            <MatchRow match={match} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function MatchRow({ match }: { match: PlayerMatch }) {
  const t = useTranslations("esport.players");
  const [opponentA, opponentB] = match.opponents;
  const status = getMatchStatusInfo(match.status);
  const dateLabel = formatMatchDate(match.beginAt);

  const isFinished = match.status === "finished";
  const winnerA = isFinished && opponentA && match.winnerId === opponentA.id;
  const winnerB = isFinished && opponentB && match.winnerId === opponentB.id;

  return (
    <div className="rounded-xl bg-white/60 p-3 transition-colors hover:bg-white/80 dark:bg-gray-800/40 dark:hover:bg-gray-800/60">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <Icon icon={getGameIcon(match.gameSlug)} className="h-3.5 w-3.5" />
          <span className="line-clamp-1">{match.tournament}</span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {dateLabel && <span>{dateLabel}</span>}
          <StatusPill labelKey={status.labelKey} tone={status.tone} t={t} />
        </span>
      </div>

      {opponentA && opponentB ? (
        <div className="flex items-center justify-between gap-3">
          <OpponentScore opponent={opponentA} isWinner={winnerA} />
          <span className="text-xs font-bold text-gray-400">VS</span>
          <OpponentScore opponent={opponentB} isWinner={winnerB} align="right" />
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-300">{match.name}</p>
      )}
    </div>
  );
}

function OpponentScore({
  opponent,
  isWinner,
  align = "left",
}: {
  opponent: PlayerMatch["opponents"][number];
  isWinner: boolean;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-1 items-center gap-2 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      {opponent.imageUrl ? (
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white p-0.5 dark:bg-gray-700">
          <LazyImage
            src={opponent.imageUrl}
            alt={opponent.name}
            fill
            className="object-contain"
            sizes="28px"
          />
        </div>
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <Icon icon="mdi:shield-account" className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <Link
        href={`/esport/teams/${opponent.id}`}
        className={`line-clamp-1 text-sm font-semibold transition-colors hover:underline ${
          isWinner
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-gray-700 dark:text-gray-200"
        }`}
      >
        {opponent.name}
      </Link>
      <span
        className={`rounded-md px-2 py-0.5 text-sm font-bold ${
          isWinner
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
        }`}
      >
        {opponent.score}
      </span>
    </div>
  );
}

function StatusPill({
  labelKey,
  tone,
  t,
}: {
  labelKey: "live" | "upcoming" | "finished" | "canceled" | "postponed";
  tone: "live" | "upcoming" | "finished" | "neutral";
  t: ReturnType<typeof useTranslations>;
}) {
  const toneClasses: Record<typeof tone, string> = {
    live: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    finished: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${toneClasses[tone]}`}
    >
      {tone === "live" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden />
      )}
      {t(`matchStatus.${labelKey}`)}
    </span>
  );
}

function formatMatchDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
