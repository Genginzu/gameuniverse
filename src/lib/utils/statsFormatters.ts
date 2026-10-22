/**
 * Utility functions for the player stats dashboard.
 * - Locale-aware number formatting (Req 10.3)
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
 * Validate that `id` is a valid UUID v4 string.
 */
export function validatePlayerId(id: string): boolean {
  return UUID_V4_REGEX.test(id);
}
