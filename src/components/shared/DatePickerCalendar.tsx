"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { buildMonthGrid, parseIsoDate, toIsoDate, weekdayLabels } from "@/lib/utils/calendar-grid";

interface DatePickerCalendarProps {
  value: string;
  locale: string;
  max?: string;
  onSelect: (iso: string) => void;
}

const NAV_BUTTON_CLASS =
  "text-editorial-muted flex size-11 items-center justify-center rounded-full transition hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-30";

export function DatePickerCalendar({ value, locale, max, onSelect }: DatePickerCalendarProps) {
  const t = useTranslations("common.datePicker");
  const initial = parseIsoDate(value) ?? new Date();
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const days = useMemo(() => buildMonthGrid(view.year, view.month), [view]);
  const weekdays = useMemo(() => weekdayLabels(locale), [locale]);
  const todayIso = toIsoDate(new Date());
  const monthTitle = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    new Date(view.year, view.month, 1)
  );
  const nextMonthStart = toIsoDate(new Date(view.year, view.month + 1, 1));
  const isAfterMax = (iso: string) => Boolean(max && iso > max);

  const shiftMonth = (delta: number) => {
    const target = new Date(view.year, view.month + delta, 1);
    setView({ year: target.getFullYear(), month: target.getMonth() });
  };

  return (
    <div className="w-[min(20rem,calc(100vw-2rem))] p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label={t("previousMonth")}
          className={NAV_BUTTON_CLASS}
        >
          <Icon icon="lucide:chevron-left" className="size-4" />
        </button>
        <p className="font-display text-sm font-semibold text-white capitalize" aria-live="polite">
          {monthTitle}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={isAfterMax(nextMonthStart)}
          aria-label={t("nextMonth")}
          className={NAV_BUTTON_CLASS}
        >
          <Icon icon="lucide:chevron-right" className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((label) => (
          <span
            key={label}
            className="text-editorial-muted py-1 text-[0.7rem] font-semibold tracking-wider uppercase"
          >
            {label.replace(".", "")}
          </span>
        ))}
        {days.map((day) => {
          const isSelected = day.iso === value;
          const isToday = day.iso === todayIso;
          const disabled = isAfterMax(day.iso);
          return (
            <button
              key={day.iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day.iso)}
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
              className={[
                "flex aspect-square min-h-9 items-center justify-center rounded-lg text-sm transition",
                isSelected
                  ? "btn-filled font-semibold"
                  : `hover:bg-editorial-accent/15 hover:text-white ${day.inMonth ? "text-white" : "text-editorial-muted/60"}`,
                !isSelected && isToday ? "border-editorial-accent border" : "",
                "disabled:pointer-events-none disabled:opacity-25",
              ].join(" ")}
            >
              {day.day}
            </button>
          );
        })}
      </div>

      <div className="border-editorial-line mt-3 flex justify-end border-t pt-2">
        <button
          type="button"
          onClick={() => onSelect(todayIso)}
          disabled={isAfterMax(todayIso)}
          className="text-editorial-accent min-h-11 rounded-lg px-3 text-sm font-semibold transition hover:bg-white/[0.06] disabled:opacity-30"
        >
          {t("today")}
        </button>
      </div>
    </div>
  );
}
