"use client";

/**
 * RecommendationCardActions : controls stacked over a recommendation card
 * (top-left, where recommendation cards show no platforms): "not interested"
 * then "add to library". Revealed on hover / focus on desktop, always visible
 * on touch devices.
 */

import { CardActionButton } from "@/components/games/CardActionButton";

interface RecommendationCardActionsProps {
  dismissLabel: string;
  addLabel: string;
  disabled?: boolean;
  onDismiss: () => void;
  onAdd: () => void;
}

export function RecommendationCardActions({
  dismissLabel,
  addLabel,
  disabled = false,
  onDismiss,
  onAdd,
}: RecommendationCardActionsProps) {
  return (
    <div className="pointer-events-none absolute top-2 left-2 z-[5] flex flex-col gap-2 opacity-0 transition group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100">
      <CardActionButton icon="lucide:eye-off" label={dismissLabel} disabled={disabled} onClick={onDismiss} />
      <CardActionButton icon="lucide:plus" label={addLabel} disabled={disabled} onClick={onAdd} />
    </div>
  );
}
