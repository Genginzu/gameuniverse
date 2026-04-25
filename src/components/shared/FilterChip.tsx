"use client";

import { ReactNode } from "react";

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  count?: number;
  icon?: ReactNode;
}

/**
 * Shared chip component for filter items (genres, roles, platforms, etc.).
 * Uses the cyan→violet gradient when selected, consistent across all filter panels.
 */
export function FilterChip({ label, selected, onClick, count, icon }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all sm:py-1.5 ${
        selected
          ? "bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 text-white shadow-xs"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700/50 dark:text-gray-300 dark:hover:bg-slate-700"
      }`}
    >
      {icon}
      {label}
      {count !== undefined && <span className="opacity-60">{count}</span>}
    </button>
  );
}

/** Chip displaying an active filter with a remove button */
export function ActiveFilterChip({
  label,
  onRemove,
  variant = "blue",
}: {
  label: string;
  onRemove: () => void;
  variant?: "blue" | "violet";
}) {
  const colors =
    variant === "blue"
      ? "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
      : "bg-palette-primary-100 text-palette-primary-800 hover:bg-palette-primary-200 dark:bg-palette-primary-900/30 dark:text-palette-primary-300 dark:hover:bg-palette-primary-900/50";

  return (
    <button
      onClick={onRemove}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:py-1 ${colors}`}
    >
      {label}
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}
