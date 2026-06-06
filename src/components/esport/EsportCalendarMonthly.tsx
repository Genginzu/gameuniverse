"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { EmptyState } from "@/components/shared/EmptyState";

interface CalendarMatch {
  id: string;
  name: string;
  status: string;
  beginAt: string;
  game: string;
  opponent1: { name: string; acronym: string | null; image_url: string | null; pandascoreId: number | null } | null;
  opponent2: { name: string; acronym: string | null; image_url: string | null; pandascoreId: number | null } | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const NAV_BTN =
  "border-editorial-line bg-editorial-2 hover:bg-editorial-3 hover:border-editorial-accent/50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]";

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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Editorial hero */}
      <header className="mb-8">
        <KickerLabel>{t("kicker")}</KickerLabel>
        <h1 className="mt-2 font-display text-[clamp(1.75rem,3vw+1rem,3rem)] leading-[1.05] font-bold tracking-tight text-white">
          {t("title")}
        </h1>
        <p className="text-editorial-muted mt-3 max-w-[60ch] text-base leading-relaxed">
          {t("subtitle")}
        </p>
      </header>

      {/* Month navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button type="button" onClick={goToPrevMonth} className={NAV_BTN} aria-label={t("weekMon")}>
          <Icon icon="mdi:chevron-left" className="size-6" />
        </button>

        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-bold capitalize text-white sm:text-xl">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={goToToday}
            className="text-editorial-accent bg-editorial-accent/15 hover:bg-editorial-accent/25 rounded-lg px-3 py-1 text-xs font-medium transition"
          >
            {t("today")}
          </button>
        </div>

        <button type="button" onClick={goToNextMonth} className={NAV_BTN} aria-label={t("weekSun")}>
          <Icon icon="mdi:chevron-right" className="size-6" />
        </button>
      </div>

      {/* Calendar grid */}
      {isLoading && matches.length === 0 ? (
        <CalendarGridSkeleton />
      ) : (
        <div className="border-editorial-line bg-editorial-2 overflow-hidden rounded-2xl border">
          {/* Week day headers */}
          <div className="border-editorial-line grid grid-cols-7 border-b">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-editorial-muted border-editorial-line border-r px-1 py-2 text-center text-xs font-semibold uppercase tracking-wide last:border-r-0 sm:px-3 sm:py-3 sm:text-sm"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid auto-rows-[120px] grid-cols-7 sm:auto-rows-[140px]">
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
    return <div className="border-editorial-line h-full border-b border-r bg-white/[0.02]" />;
  }

  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const hasMatches = matches.length > 0;

  const content = (
    <div
      className={`border-editorial-line flex h-full flex-col overflow-hidden border-b border-r p-1 transition-all sm:p-2 ${
        hasMatches
          ? "bg-editorial-3 hover:border-editorial-accent/40 cursor-pointer"
          : "bg-transparent"
      }`}
    >
      {/* Day number */}
      <span
        className={`mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs font-bold sm:size-7 sm:text-sm ${
          isToday ? "bg-editorial-accent text-white" : "text-white/80"
        }`}
      >
        {day}
      </span>

      {/* Match indicators */}
      {hasMatches && (
        <div className="mt-1 space-y-0.5">
          <span className="text-editorial-accent bg-editorial-accent/15 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium sm:text-xs">
            <Icon icon="mdi:sword-cross" className="size-3" />
            {matches.length}
          </span>
          {/* Show first match teams on larger screens */}
          <div className="hidden sm:block">
            {matches.slice(0, 2).map((m) => (
              <p key={m.id} className="text-editorial-muted truncate text-[10px]">
                {m.opponent1?.acronym ?? "?"} vs {m.opponent2?.acronym ?? "?"}
              </p>
            ))}
            {matches.length > 2 && (
              <p className="text-editorial-muted/70 text-[10px]">+{matches.length - 2}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (hasMatches) {
    return (
      <Link href={`/esport/calendar/${dateStr}`} className="h-full">
        {content}
      </Link>
    );
  }

  return content;
}

function CalendarGridSkeleton() {
  return (
    <div className="border-editorial-line bg-editorial-2 overflow-hidden rounded-2xl border">
      <div className="border-editorial-line grid grid-cols-7 border-b">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="border-editorial-line border-r px-3 py-3 last:border-r-0">
            <div className="mx-auto h-4 w-8 animate-pulse rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
      <div className="grid auto-rows-[120px] grid-cols-7 sm:auto-rows-[140px]">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="border-editorial-line border-b border-r p-2">
            <div className="size-6 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
