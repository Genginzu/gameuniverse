/**
 * Count total active filters.
 */
export function countActiveFilters(activeFilters: Record<string, string[]>): number {
  return Object.values(activeFilters).reduce((sum, values) => sum + values.length, 0);
}
