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

/**
 * Pick the best translation, but skip entries where `name` is empty/missing.
 * Fallback chain: locale with name → "en" with name → any with name → locale → "en" → first.
 */
export function pickTranslationWithName<T extends { language_code: string; name?: string | null }>(
  translations: T[] | null | undefined,
  locale: string
): T | undefined {
  if (!translations || translations.length === 0) return undefined;

  const hasName = (t: T) => !!t.name?.trim();

  return (
    translations.find((t) => t.language_code === locale && hasName(t)) ||
    translations.find((t) => t.language_code === "en" && hasName(t)) ||
    translations.find(hasName) ||
    translations.find((t) => t.language_code === locale) ||
    translations.find((t) => t.language_code === "en") ||
    translations[0]
  );
}
