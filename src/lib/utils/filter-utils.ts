/**
 * Check if any filters are active.
 */
export function hasActiveFilters(activeFilters: Record<string, string[]>): boolean {
  return Object.values(activeFilters).some((values) => values.length > 0);
}

/**
 * Count total active filters.
 */
export function countActiveFilters(activeFilters: Record<string, string[]>): number {
  return Object.values(activeFilters).reduce((sum, values) => sum + values.length, 0);
}

/**
 * Toggle a filter value (add/remove for checkbox, replace for radio).
 */
export function toggleFilterValue(
  currentValues: string[],
  value: string,
  type: "checkbox" | "radio"
): string[] {
  if (type === "radio") {
    return [value];
  }

  if (currentValues.includes(value)) {
    return currentValues.filter((v) => v !== value);
  }

  return [...currentValues, value];
}
