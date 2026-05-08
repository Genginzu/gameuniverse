import { Icon } from "@iconify/react";

export type StatTone = "positive" | "negative" | "primary" | "neutral" | "warning";

export interface StatTileProps {
  icon: string;
  label: string;
  value: string | number;
  tone: StatTone;
  hint?: string;
}

const TONE_CLASSES: Record<StatTone, string> = {
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-rose-600 dark:text-rose-400",
  primary: "text-palette-primary-600 dark:text-palette-primary-400",
  neutral: "text-gray-700 dark:text-gray-300",
  warning: "text-amber-600 dark:text-amber-400",
};

/**
 * A single stat tile rendered inside the player stats section.
 * Extracted so PlayerStats can stay focused on layout/orchestration.
 */
export function StatTile({ icon, label, value, tone, hint }: StatTileProps) {
  const klass = TONE_CLASSES[tone];
  return (
    <div className="rounded-xl bg-white/60 p-3 text-center dark:bg-gray-800/40">
      <Icon icon={icon} className={`mx-auto mb-1 h-5 w-5 ${klass}`} />
      <p className={`text-xl font-bold ${klass}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      {hint && (
        <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">{hint}</p>
      )}
    </div>
  );
}
