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
  positive: "text-emerald-300",
  negative: "text-rose-300",
  primary: "text-editorial-accent",
  neutral: "text-white/85",
  warning: "text-amber-300",
};

/**
 * A single stat tile rendered inside the player stats section.
 * Extracted so PlayerStats can stay focused on layout/orchestration.
 */
export function StatTile({ icon, label, value, tone, hint }: StatTileProps) {
  const klass = TONE_CLASSES[tone];
  return (
    <div className="border-editorial-line bg-editorial-2 rounded-xl border p-3 text-center">
      <Icon icon={icon} className={`mx-auto mb-1 h-5 w-5 ${klass}`} />
      <p className={`text-xl font-bold ${klass}`}>{value}</p>
      <p className="text-editorial-muted text-xs">{label}</p>
      {hint && <p className="text-editorial-muted/70 mt-0.5 text-[10px]">{hint}</p>}
    </div>
  );
}
