"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useReviewTranslations } from "@/hooks/useTranslations";

interface RatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
  max?: number;
}

function getRatingColor(value: number | null, max: number): string {
  if (value === null) return "text-slate-400";
  const ratio = value / max;
  if (ratio >= 0.75) return "text-green-400";
  if (ratio >= 0.5) return "text-yellow-400";
  if (ratio >= 0.25) return "text-orange-400";
  return "text-red-400";
}

export function RatingInput({ value, onChange, max = 20 }: RatingInputProps) {
  const t = useReviewTranslations();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") return;
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(0, parsed)));
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Input
        type="number"
        min={0}
        max={max}
        step={1}
        value={value ?? ""}
        onChange={handleChange}
        className="w-24 text-center text-lg font-semibold"
        aria-label={t("rating.ariaLabel", { max })}
      />
      <span className={cn("text-lg font-medium", getRatingColor(value, max))}>/ {max}</span>
      {value !== null && (
        <span
          className={cn(
            "rounded-lg px-2 py-1 text-sm font-medium",
            getRatingColor(value, max),
            "bg-slate-800"
          )}
        >
          {value}/{max}
        </span>
      )}
    </div>
  );
}
