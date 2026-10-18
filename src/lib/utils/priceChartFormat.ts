/** Formats an ISO date (YYYY-MM-DD) as a short chart label (e.g. "janv. 2024"). */
export function formatPriceChartDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

/** Formats a price with two decimals followed by its currency code. */
export function formatPriceWithCurrency(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}
