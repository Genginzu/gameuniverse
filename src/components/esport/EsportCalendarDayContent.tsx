"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { CalendarMatchDetail } from "@/components/esport/CalendarMatchDetail";

interface CalendarMatch {
  id: string;
  pandascoreId: number | null;
  name: string;
  status: string;
  beginAt: string;
  game: string;
  tournamentId: string | null;
  opponent1: { name: string; acronym: string | null; image_url: string | null } | null;
  opponent2: { name: string; acronym: string | null; image_url: string | null } | null;
  opponent1Score: number | null;
  opponent2Score: number | null;
  winnerId: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportCalendarDayContent({ date }: { date: string }) {
  const t = useTranslations("esport.calendar");
  const [selectedMatch, setSelectedMatch] = useState<CalendarMatch | null>(null);

  // Extract month from date (YYYY-MM-DD -> YYYY-MM)
  const monthKey = date.slice(0, 7);

  const { data, isLoading } = useSWR<{ matches: CalendarMatch[] }>(
    `/api/esport/calendar?month=${monthKey}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Filter matches for this specific day
  const dayMatches = (data?.matches ?? []).filter((m) => m.beginAt.startsWith(date));

  const dateObj = new Date(date + "T00:00:00");
  const dateLabel = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/esport/calendar"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/50 p-2 transition-all hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/60"
          >
            <Icon icon="mdi:arrow-left" className="size-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold capitalize text-gray-900 sm:text-xl dark:text-white">
              {dateLabel}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {dayMatches.length} {t("matchCount")}
            </p>
          </div>
        </div>

        {/* Matches grid */}
        {isLoading ? (
          <DaySkeleton />
        ) : dayMatches.length === 0 ? (
          <EmptyState
            icon="mdi:calendar-blank"
            title={t("noMatches")}
            description={t("noMatchesDescription")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dayMatches.map((match) => (
              <MatchCard key={match.id} match={match} onClick={() => setSelectedMatch(match)} />
            ))}
          </div>
        )}

        {selectedMatch && (
          <CalendarMatchDetail
            match={selectedMatch}
            open={!!selectedMatch}
            onOpenChange={(open) => { if (!open) setSelectedMatch(null); }}
          />
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, onClick }: { match: CalendarMatch; onClick: () => void }) {
  const t = useTranslations("esport.calendar");

  const time = new Date(match.beginAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusLabel =
    match.status === "running"
      ? t("matchLive")
      : match.status === "finished"
        ? t("matchFinished")
        : t("matchUpcoming");

  const statusColor =
    match.status === "running"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : match.status === "finished"
        ? "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400"
        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

  return (
    <button type="button" onClick={onClick} className="glass-card w-full cursor-pointer rounded-2xl p-4 text-left transition-all duration-300 hover:shadow-lg sm:p-5">
      {/* Header: time + status + game */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:clock-outline" className="size-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{time}</span>
        </div>
        <Badge className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      {/* Teams face-off */}
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <TeamDisplay team={match.opponent1} score={match.opponent1Score} />
        <span className="text-sm font-bold text-gray-400">VS</span>
        <TeamDisplay team={match.opponent2} score={match.opponent2Score} />
      </div>

      {/* Game badge */}
      <div className="mt-4 flex items-center justify-center">
        <span className="rounded-md bg-palette-primary-500/10 px-2 py-0.5 text-xs font-medium text-palette-primary-600 dark:text-palette-primary-400">
          {match.game}
        </span>
      </div>
    </button>
  );
}

function TeamDisplay({
  team,
  score,
}: {
  team: { name: string; acronym: string | null; image_url: string | null } | null;
  score: number | null;
}) {
  if (!team) {
    return <span className="text-sm text-gray-400">TBD</span>;
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {team.image_url ? (
        <img src={team.image_url} alt="" className="size-10 rounded-lg object-contain sm:size-12" />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-lg bg-gray-200 sm:size-12 dark:bg-slate-700">
          <Icon icon="mdi:account-group" className="size-5 text-gray-400" />
        </div>
      )}
      <span className="max-w-[80px] truncate text-center text-xs font-bold text-gray-800 sm:text-sm dark:text-gray-100">
        {team.acronym || team.name}
      </span>
      {score !== null && (
        <span className="text-lg font-bold text-gray-900 dark:text-white">{score}</span>
      )}
    </div>
  );
}

function DaySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-5">
          <div className="mb-4 flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <div className="flex items-center justify-center gap-4">
            <Skeleton className="size-12 rounded-lg" />
            <Skeleton className="h-4 w-6" />
            <Skeleton className="size-12 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
