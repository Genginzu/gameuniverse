"use client";

import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReviewTranslations } from "@/hooks/useTranslations";

interface ReviewPointsListProps {
  points: string[];
  onChange: (points: string[]) => void;
  type: "positive" | "negative";
  maxPoints: number;
}

export function ReviewPointsList({ points, onChange, type, maxPoints }: ReviewPointsListProps) {
  const t = useReviewTranslations();
  const isPositive = type === "positive";
  const label = isPositive ? t("points.positiveLabel") : t("points.negativeLabel");
  const accentColor = isPositive
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
  const borderColor = isPositive
    ? "border-green-500/30 focus-within:ring-green-500/50"
    : "border-red-500/30 focus-within:ring-red-500/50";

  const addPoint = () => {
    if (points.length < maxPoints) {
      onChange([...points, ""]);
    }
  };

  const removePoint = (index: number) => {
    onChange(points.filter((_, i) => i !== index));
  };

  const updatePoint = (index: number, value: string) => {
    const updated = [...points];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${accentColor}`}>
          {isPositive ? "👍" : "👎"} {label}s{" "}
          {t("points.count", { count: points.length, max: maxPoints })}
        </span>
        {points.length < maxPoints && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addPoint}
            className={accentColor}
          >
            <Icon icon="lucide:plus" className="mr-1 h-4 w-4" />
            {t("points.add")}
          </Button>
        )}
      </div>

      {points.map((point, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className={`text-sm ${accentColor}`}>{isPositive ? "+" : "−"}</span>
          <Input
            value={point}
            onChange={(e) => updatePoint(index, e.target.value)}
            placeholder={`${label} ${index + 1}`}
            maxLength={200}
            className={borderColor}
            aria-label={`${label} ${index + 1}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removePoint(index)}
            className="text-muted-foreground h-8 w-8 shrink-0 hover:text-red-500"
            aria-label={t("points.removeAriaLabel", {
              label: label.toLowerCase(),
              index: index + 1,
            })}
          >
            <Icon icon="lucide:trash-2" className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {points.length === 0 && (
        <p className="text-muted-foreground text-sm">
          {isPositive ? t("points.emptyPositive") : t("points.emptyNegative")}
        </p>
      )}
    </div>
  );
}
