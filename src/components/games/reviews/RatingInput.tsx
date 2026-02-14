"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getRatingColor } from "@/lib/utils/ratingColor";
import { useReviewTranslations } from "@/hooks/useTranslations";

interface RatingInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  max?: number;
}

export function RatingInput({ value, onChange, max = 20 }: RatingInputProps) {
  const t = useReviewTranslations();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange(null);
      return;
    }
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
    </div>
  );
}
