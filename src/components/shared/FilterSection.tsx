"use client";

import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Variantes visuelles supportées par les composants de filtres partagés.
 * - `default` : style legacy/admin (glassmorphism `bg-white/60`).
 * - `editorial` : style refonte éditoriale (surface `--editorial-bg-2`).
 */
export type FilterVariant = "default" | "editorial";

interface FilterSectionProps {
  title: string;
  availableLabel: string;
  children: ReactNode;
  /** Show skeleton placeholders while loading */
  loading?: boolean;
  /** Skeleton widths for loading state */
  skeletonWidths?: number[];
  /** Variante visuelle. Default: `"default"` (legacy). */
  variant?: FilterVariant;
}

/**
 * Shared container for a filter section (genres, platforms, roles, etc.).
 * Provides consistent styling across all filter panels via the `variant` prop.
 */
export function FilterSection({
  title,
  availableLabel,
  children,
  loading = false,
  skeletonWidths = [88, 104, 80, 96, 72, 92, 84, 100],
  variant = "default",
}: FilterSectionProps) {
  if (variant === "editorial") {
    return (
      <div className="editorial-filter-section">
        <div className="editorial-filter-section-header">
          {loading ? (
            <>
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </>
          ) : (
            <>
              <h3 className="editorial-filter-section-title">{title}</h3>
              <span className="editorial-filter-section-available">
                {availableLabel}
              </span>
            </>
          )}
        </div>
        <div className="editorial-filter-section-content">
          {loading
            ? skeletonWidths.map((w, i) => (
                <Skeleton
                  key={i}
                  className="h-7 rounded-full"
                  style={{ width: `${w}px` }}
                />
              ))
            : children}
        </div>
      </div>
    );
  }

  // Default (legacy) glassmorphism variant
  if (loading) {
    return (
      <div className="rounded-xl bg-white/60 p-4 ring-1 ring-gray-200/50 backdrop-blur-xs dark:bg-slate-800/50 dark:ring-slate-700/50">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {skeletonWidths.map((w, i) => (
            <Skeleton key={i} className="h-7 rounded-full" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/60 p-4 ring-1 ring-gray-200/50 backdrop-blur-xs dark:bg-slate-800/50 dark:ring-slate-700/50">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">{availableLabel}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
