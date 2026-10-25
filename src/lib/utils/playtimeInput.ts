/**
 * Parses an hours field typed by a player. Accepts a dot or a comma as the
 * decimal separator ("250.5", "250,5") and surrounding spaces.
 * Returns null for an empty field and NaN for anything that is not a number.
 */
export function parsePlaytimeInput(value: string): number | null {
  const normalized = value.trim().replace(/\s+/g, "").replace(",", ".");
  if (!normalized) return null;
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}
