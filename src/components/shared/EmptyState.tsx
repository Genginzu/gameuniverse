"use client";

import { Icon } from "@iconify/react";

interface EmptyStateProps {
  /** Iconify icon name */
  icon?: string;
  title: string;
  description: string;
  /** Show a "clear filters" button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Visual variant */
  variant?: "glass" | "card";
}

export function EmptyState({
  icon = "lucide:search-x",
  title,
  description,
  action,
  variant = "glass",
}: EmptyStateProps) {
  const containerClass =
    variant === "glass"
      ? "rounded-2xl bg-white/40 shadow-xs backdrop-blur-xl dark:bg-slate-800/50"
      : "rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-center sm:py-20 ${containerClass}`}
    >
      <div className="mb-6 rounded-full bg-linear-to-br from-gray-100 to-gray-200 p-6 dark:from-gray-700 dark:to-gray-600">
        <Icon icon={icon} className="h-12 w-12 text-gray-400 sm:h-16 sm:w-16" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
        {title}
      </h3>
      <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 sm:text-base">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:from-palette-secondary-600 hover:to-palette-primary-600 hover:shadow-lg"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
