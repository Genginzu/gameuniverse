/**
 * Categorical chart colours, resolved at runtime from the `--chart-*` tokens of
 * `src/app/globals.css` (themselves derived from the site palette).
 *
 * Recharts and inline styles accept CSS variables, so charts follow a rebrand without
 * code changes.
 */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
] as const;

/** Neutral colour for "other" buckets, axes and grid lines. */
export const CHART_NEUTRAL = "var(--color-palette-neutral-400)";

/** Colour of the series at `index`, cycling through {@link CHART_COLORS}. */
export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
