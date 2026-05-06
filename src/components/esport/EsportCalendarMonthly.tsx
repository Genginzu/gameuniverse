"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
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

export function EsportCalendarMonthly() {
  const t = useTranslations("esport.calendar");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedMatch, setSelectedMatch] = useState<CalendarMatch | null>(null);

  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

  const { data, isLoading } = useSWR<{ matches: CalendarMatch[] }>(
    `/api/esport/calendar?month=${monthKey}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const matches = data?.matches ?? [];

  // Group matches by day
  const matchesByDay = useMemo(() => {
    const grouped: Record<number, CalendarMatch[]> = {};
    for (const match of matches) {
      const day = new Date(match.beginAt).getDate();
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(match);
    }
    return grouped;
  }, [matches]);

  // Get days that have matches
  const daysWithMatches = useMemo(
    () => Object.keys(matchesByDay).map(Number).sort((a, b) => a - b),
    [matchesByDay]
  );

  const goToPrevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthLabel = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Month navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/50 p-2 transition-all hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/60"
          >
            <Icon icon="mdi:chevron-left" className="size-6" />
          </button>

          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold capitalize text-gray-900 sm:text-xl dark:text-white">
              {monthLabel}
            </h2>
            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg bg-palette-primary-500/10 px-3 py-1 text-xs font-medium text-palette-primary-600 transition-all hover:bg-palette-primary-500/20 dark:text-palette-primary-400"
            >
              {t("today")}
            </button>
          </div>

          <button
            type="button"
            onClick={goToNextMonth}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/50 p-2 transition-all hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/60"
          >
            <Icon icon="mdi:chevron-right" className="size-6" />
          </button>
        </div>

        {/* Content */}
        {isLoading && matches.length === 0 ? (
          <CalendarSkeleton />
        ) : daysWithMatches.length === 0 ? (
          <EmptyState
            icon="mdi:calendar-blank"
            title={t("noMatches")}
            description={t("noMatchesDescription")}
          />
        ) : (
          <div className="space-y-4">
            {daysWithMatches.map((day) => (
              <DaySection
                key={day}
                day={day}
                month={currentDate.getMonth()}
                year={currentDate.getFullYear()}
                matches={matchesByDay[day]}
                onMatchClick={setSelectedMatch}
              />
            ))}
          </div>
        )}

        {/* Match detail dialog */}
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

function DaySection({
  day,
  month,
  year,
  matches,
  onMatchClick,
}: {
  day: number;
  month: number;
  year: number;
  matches: CalendarMatch[];
  onMatchClick: (match: CalendarMatch) => void;
}) {
  const date = new Date(year, month, day);
  const isToday =
    date.toDateString() === new Date().toDateString();

  const dayLabel = date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <div
          className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${
            isToday
              ? "bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 text-white"
              : "bg-white/60 text-gray-700 dark:bg-slate-700/60 dark:text-gray-200"
          }`}
        >
          {day}
        </div>
        <span className="text-sm font-medium capitalize text-gray-600 dark:text-gray-300">
          {dayLabel}
        </span>
        <span className="ml-auto text-xs text-gray-400">
          {matches.length} match{matches.length > 1 ? "es" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {matches.map((match) => (
          <MatchRow key={match.id} match={match} onClick={() => onMatchClick(match)} />
        ))}
      </div>
    </div>
  );
}

function MatchRow({ match, onClick }: { match: CalendarMatch; onClick: () => void }) {
  const time = new Date(match.beginAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusColor =
    match.status === "running"
      ? "bg-green-500"
      : match.status === "finished"
        ? "bg-gray-400"
        : "bg-blue-500";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-white/40 p-3 text-left transition-all hover:bg-white/70 dark:bg-slate-700/30 dark:hover:bg-slate-700/60"
    >
      {/* Time */}
      <span className="w-12 shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
        {time}
      </span>

      {/* Status dot */}
      <span className={`size-2 shrink-0 rounded-full ${statusColor}`} />

      {/* Teams */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TeamBadge team={match.opponent1} isWinner={match.winnerId !== null && match.opponent1 !== null} />
        <span className="shrink-0 text-xs font-bold text-gray-400">vs</span>
        <TeamBadge team={match.opponent2} isWinner={match.winnerId !== null && match.opponent2 !== null} />
      </div>

      {/* Score (if finished) */}
      {match.status === "finished" && match.opponent1Score !== null && (
        <span className="shrink-0 text-sm font-bold text-gray-700 dark:text-gray-200">
          {match.opponent1Score} - {match.opponent2Score}
        </span>
      )}

      {/* Game badge */}
      <span className="hidden shrink-0 rounded-md bg-palette-primary-500/10 px-2 py-0.5 text-xs font-medium text-palette-primary-600 sm:inline dark:text-palette-primary-400">
        {match.game}
      </span>

      <Icon icon="mdi:chevron-right" className="size-4 shrink-0 text-gray-400" />
    </button>
  );
}

function TeamBadge({
  team,
}: {
  team: { name: string; acronym: string | null; image_url: string | null } | null;
  isWinner: boolean;
}) {
  if (!team) return <span className="text-xs text-gray-400">TBD</span>;

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {team.image_url && (
        <img src={team.image_url} alt="" className="size-5 shrink-0 rounded-sm object-contain" />
      )}
      <span className="truncate text-xs font-medium text-gray-800 sm:text-sm dark:text-gray-100">
        {team.acronym || team.name}
      </span>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-5">
          <Skeleton className="mb-3 h-5 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
