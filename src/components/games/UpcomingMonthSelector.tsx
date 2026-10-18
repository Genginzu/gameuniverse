"use client";

import { useTranslations } from "next-intl";

interface UpcomingMonthSelectorProps {
  value: string;
  onChange: (month: string) => void;
}

export function UpcomingMonthSelector({ value, onChange }: UpcomingMonthSelectorProps) {
  const t = useTranslations("upcoming");
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "border-transparent bg-editorial-accent/15 text-editorial-accent"
        : "border-editorial-line text-editorial-muted hover:border-white/30 hover:text-white"
    }`;

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onChange("")} className={chip(!value)}>
        {t("allMonths")}
      </button>
      {months.map((m) => {
        const [y, mo] = m.split("-");
        const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        });
        return (
          <button key={m} onClick={() => onChange(m)} className={chip(value === m)}>
            {label}
          </button>
        );
      })}
    </div>
  );
}
