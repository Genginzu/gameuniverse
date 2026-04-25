/**
 * Helper function to calculate visible pages with ellipsis.
 * Shows pages around the current page with dots for gaps.
 */
export function getVisiblePages(currentPage: number, totalPages: number): (number | string)[] {
  const delta = 2;
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];

  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  if (start > 1) {
    rangeWithDots.push(1);
    if (start > 2) {
      rangeWithDots.push("...");
    }
  }

  rangeWithDots.push(...range);

  if (end < totalPages) {
    if (end < totalPages - 1) {
      rangeWithDots.push("...");
    }
    rangeWithDots.push(totalPages);
  }

  return rangeWithDots;
}
