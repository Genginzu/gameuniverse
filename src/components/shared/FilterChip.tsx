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
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        selected
          ? "bg-linear-to-r from-cyan-500 to-violet-500 text-white shadow-xs"
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
      : "bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50";

  return (
    <button
      onClick={onRemove}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${colors}`}
    >
      {label}
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
