"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

interface CalendarMatch {
  id: string;
  name: string;
  status: string;
  beginAt: string;
  game: string;
  opponent1: { name: string; acronym: string | null; image_url: string | null } | null;
  opponent2: { name: string; acronym: string | null; image_url: string | null } | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportCalendarMonthly() {
  const t = useTranslations("esport.calendar");
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

  const { data, isLoading } = useSWR<{ matches: CalendarMatch[] }>(
    `/api/esport/calendar?month=${monthKey}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const matches = data?.matches ?? [];

  const matchesByDay = useMemo(() => {
    const grouped: Record<number, CalendarMatch[]> = {};
    for (const match of matches) {
      const day = new Date(match.beginAt).getDate();
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(match);
    }
    return grouped;
  }, [matches]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    // Adjust to Monday start (0=Mon, 6=Sun)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    // Fill remaining cells to complete last row
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentDate]);

  const goToPrevMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const todayDate = new Date();
  const isCurrentMonth =
    todayDate.getFullYear() === currentDate.getFullYear() &&
    todayDate.getMonth() === currentDate.getMonth();

  const monthLabel = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const weekDays = [
    t("weekMon"),
    t("weekTue"),
    t("weekWed"),
    t("weekThu"),
    t("weekFri"),
    t("weekSat"),
    t("weekSun"),
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
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

        {/* Calendar grid */}
        {isLoading && matches.length === 0 ? (
          <CalendarGridSkeleton />
        ) : (
          <div className="glass-card overflow-hidden rounded-2xl">
            {/* Week day headers */}
            <div className="grid grid-cols-7 divide-x divide-gray-200 border-b border-gray-200 dark:divide-slate-600/50 dark:border-slate-600/50">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="px-1 py-2 text-center text-xs font-semibold uppercase text-gray-500 sm:px-3 sm:py-3 sm:text-sm dark:text-gray-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => (
                <CalendarCell
                  key={idx}
                  day={day}
                  isToday={isCurrentMonth && day === todayDate.getDate()}
                  matches={day ? matchesByDay[day] ?? [] : []}
                  year={currentDate.getFullYear()}
                  month={currentDate.getMonth()}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && matches.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon="mdi:calendar-blank"
              title={t("noMatches")}
              description={t("noMatchesDescription")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarCell({
  day,
  isToday,
  matches,
  year,
  month,
}: {
  day: number | null;
  isToday: boolean;
  matches: CalendarMatch[];
  year: number;
  month: number;
}) {
  if (day === null) {
    return (
      <div className="min-h-[80px] border-b border-r border-gray-200 bg-white/10 sm:min-h-[100px] dark:border-slate-600/50 dark:bg-slate-800/20" />
    );
  }

  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const hasMatches = matches.length > 0;

  const content = (
    <div
      className={`flex min-h-[80px] flex-col border-b border-r border-gray-200 p-1 transition-all sm:min-h-[100px] sm:p-2 dark:border-slate-600/50 ${
        hasMatches
          ? "cursor-pointer bg-white/30 hover:bg-white/60 dark:bg-slate-700/20 dark:hover:bg-slate-700/50"
          : "bg-white/10 dark:bg-slate-800/10"
      }`}
    >
      {/* Day number */}
      <span
        className={`mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs font-bold sm:size-7 sm:text-sm ${
          isToday
            ? "bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 text-white"
            : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {day}
      </span>

      {/* Match indicators */}
      {hasMatches && (
        <div className="mt-1 space-y-0.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-palette-primary-500/10 px-1.5 py-0.5 text-[10px] font-medium text-palette-primary-600 sm:text-xs dark:text-palette-primary-400">
            <Icon icon="mdi:sword-cross" className="size-3" />
            {matches.length}
          </span>
          {/* Show first match teams on larger screens */}
          <div className="hidden sm:block">
            {matches.slice(0, 2).map((m) => (
              <p key={m.id} className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                {m.opponent1?.acronym ?? "?"} vs {m.opponent2?.acronym ?? "?"}
              </p>
            ))}
            {matches.length > 2 && (
              <p className="text-[10px] text-gray-400">+{matches.length - 2}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (hasMatches) {
    return (
      <Link href={`/esport/calendar/${dateStr}`}>
        {content}
      </Link>
    );
  }

  return content;
}

function CalendarGridSkeleton() {
  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="grid grid-cols-7 divide-x divide-gray-200 border-b border-gray-200 dark:divide-slate-600/50 dark:border-slate-600/50">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-3 py-3">
            <Skeleton className="mx-auto h-4 w-8" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-[100px] border-b border-r border-gray-200 p-2 dark:border-slate-600/50">
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
