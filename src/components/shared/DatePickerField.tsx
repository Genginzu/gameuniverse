"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import { parseIsoDate } from "@/lib/utils/calendar-grid";
import { DatePickerCalendar } from "./DatePickerCalendar";

interface DatePickerFieldProps {
  id?: string;
  value: string;
  locale: string;
  max?: string;
  onChange: (iso: string) => void;
  className?: string;
}

/** Editorial date field: the whole field opens a dark, accent-themed calendar popover. */
export function DatePickerField({ id, value, locale, max, onChange, className }: DatePickerFieldProps) {
  const t = useTranslations("common.datePicker");
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useDismissableLayer(popoverRef, {
    open: isOpen,
    onDismiss: () => setIsOpen(false),
    insideRefs: [triggerRef],
  });

  const selected = parseIsoDate(value);
  const displayValue = selected
    ? new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(
        selected
      )
    : t("openCalendar");

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`flex items-center justify-between gap-2 text-left ${className ?? ""} ${
          isOpen ? "border-[rgb(var(--accent-rgb,var(--neon-primary)))]" : ""
        }`}
      >
        <span className="truncate">{displayValue}</span>
        <Icon icon="lucide:calendar" className="text-editorial-muted size-4 shrink-0" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={t("openCalendar")}
          className="border-editorial-line bg-editorial-2 absolute top-full left-0 z-30 mt-2 rounded-2xl border shadow-2xl shadow-black/50"
        >
          <DatePickerCalendar
            value={value}
            locale={locale}
            max={max}
            onSelect={(iso) => {
              onChange(iso);
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
