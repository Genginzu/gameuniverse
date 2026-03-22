/**
 * Pick the best translation from an array based on locale preference.
 * Fallback chain: requested locale → "en" → first available.
 */
export function pickTranslation<T extends { language_code: string }>(
  translations: T[] | null | undefined,
  locale: string
): T | undefined {
  if (!translations || translations.length === 0) return undefined;
  return (
    translations.find((t) => t.language_code === locale) ||
    translations.find((t) => t.language_code === "en") ||
    translations[0]
  );
}
