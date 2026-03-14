/**
 * Utility functions for the player stats dashboard.
 * - Locale-aware number formatting (Req 10.3)
 * - Localized month labels (Req 6.4, 10.4)
 * - UUID v4 validation (Req 9.4)
 */

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Format a number using locale-aware thousands separators and decimals.
 * Uses `Intl.NumberFormat` under the hood.
 */
export function formatLocalizedNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Return the full localized month name for a given month/year.
 * `month` is 1-based (1 = January, 12 = December).
 */
export function getLocalizedMonthLabel(month: number, year: number, locale: string): string {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale, { month: "long" }).format(date);
}

/**
 * Validate that `id` is a valid UUID v4 string.
 */
export function validatePlayerId(id: string): boolean {
  return UUID_V4_REGEX.test(id);
}
