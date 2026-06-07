"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { LazyImage } from "@/components/ui/lazy-image";
import { Pagination } from "@/components/shared/Pagination";
import { getGameIcon, getMatchStatusInfo } from "@/lib/utils/esport-utils";
import type { PlayerMatch } from "@/lib/services/esportPlayerMatchesService";

interface PlayerRecentMatchesProps {
  matches: PlayerMatch[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

/**
 * Paginated list of matches the player participated in. The parent owns
 * `page` state so it can be wired to SWR; this component is purely
 * presentational.
 */
export function PlayerRecentMatches({
  matches,
  total,
  page,
  limit,
  onPageChange,
  isLoading,
}: PlayerRecentMatchesProps) {
  const t = useTranslations("esport.players");

  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

  if (isLoading && matches.length === 0) {
    return (
      <section className="border-editorial-line bg-editorial-2 rounded-2xl border p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-white">{t("recentMatches")}</h2>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.06]" aria-hidden />
          ))}
        </div>
      </section>
    );
  }

  if (matches.length === 0) {
    return null;
  }

  return (
    <section className="border-editorial-line bg-editorial-2 rounded-2xl border p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <Icon icon="mdi:history" className="text-editorial-accent h-5 w-5" />
        {t("recentMatches")}
      </h2>
      <ul className="space-y-3">
        {matches.map((match) => (
          <li key={match.id}>
            <MatchRow match={match} />
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={total}
            onPageChange={onPageChange}
            loading={isLoading}
          />
        </div>
      )}
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
    <div className="bg-editorial-3 hover:bg-editorial-3/70 rounded-xl p-3 transition-colors">
      <div className="text-editorial-muted mb-2 flex items-center justify-between text-xs">
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
          <span className="text-editorial-muted text-xs font-bold">VS</span>
          <OpponentScore opponent={opponentB} isWinner={winnerB} align="right" />
        </div>
      ) : (
        <p className="text-editorial-muted text-sm">{match.name}</p>
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
        <div className="bg-editorial-2 relative h-7 w-7 shrink-0 overflow-hidden rounded-full p-0.5">
          <LazyImage
            src={opponent.imageUrl}
            alt={opponent.name}
            fill
            className="object-contain"
            sizes="28px"
          />
        </div>
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Icon icon="mdi:shield-account" className="text-editorial-muted h-4 w-4" />
        </div>
      )}
      <Link
        href={`/esport/teams/${opponent.id}`}
        className={`line-clamp-1 text-sm font-semibold transition-colors hover:underline ${
          isWinner ? "text-emerald-300" : "text-white/80"
        }`}
      >
        {opponent.name}
      </Link>
      <span
        className={`rounded-md px-2 py-0.5 text-sm font-bold ${
          isWinner ? "bg-emerald-500/15 text-emerald-300" : "text-editorial-muted bg-white/10"
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
    live: "bg-red-500/15 text-red-300",
    upcoming: "bg-editorial-accent/15 text-editorial-accent",
    finished: "bg-emerald-500/15 text-emerald-300",
    neutral: "text-editorial-muted bg-white/10",
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
