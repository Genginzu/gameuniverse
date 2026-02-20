/**
 * Formate un nombre d'heures selon la locale (séparateur de milliers + 1 décimale).
 * Fonction pure — client-safe — testable en property-based.
 */
export function formatPlayTime(hours: number, locale: string): string {
  return hours.toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
