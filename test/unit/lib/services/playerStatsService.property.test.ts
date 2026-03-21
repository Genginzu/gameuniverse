import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import {
  computeTotalPlayTime,
  computeFavoriteGenre,
  computeReviewStats,
  formatPlayTime,
  filterEntriesByYear,
  computeMostActiveMonth,
  type LibraryEntryWithGenres,
  type LibraryEntryForYear,
  type LibraryEntryWithDate,
} from "@/lib/services/playerStatsService";

// Mock Next.js / next-intl dependencies so the pure function can be imported
// without triggering React/navigation side-effects in the node test environment.
vi.mock("next-intl", () => ({ useTranslations: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ Link: "a" }));
vi.mock("@iconify/react", () => ({ Icon: "span" }));

import { resolveYearLink } from "@/components/players/YearInReviewLink";

/**
 * Feature: player-enriched-stats, Property 1: Somme du temps de jeu total
 *
 * _Pour toute_ bibliothèque de joueur contenant N entrées avec des valeurs
 * `play_time_hours` arbitraires (≥ 0), le temps de jeu total retourné doit
 * être égal à la somme de toutes les valeurs `play_time_hours` de la
 * bibliothèque, arrondie à 1 décimale.
 *
 * **Validates: Requirements 1.1**
 */

// --- Generators ---

/** Generates a non-negative play time value (≥ 0, max 50000) */
const playTimeArb = fc.integer({ min: 0, max: 500000 }).map((n) => n / 10);

/** Generates an array of play time values (0 to 100 entries) */
const playTimesArb = fc.array(playTimeArb, {
  minLength: 0,
  maxLength: 100,
});

// --- Helper ---

/** Reference implementation: sum rounded to 1 decimal */
function expectedTotalPlayTime(playTimes: number[]): number {
  if (playTimes.length === 0) return 0;
  const sum = playTimes.reduce((acc, t) => acc + t, 0);
  return Math.round(sum * 10) / 10;
}

// --- Tests ---

describe("Property 1: Somme du temps de jeu total", () => {
  it("total play time equals sum of all play_time_hours rounded to 1 decimal", () => {
    fc.assert(
      fc.property(playTimesArb, (playTimes) => {
        const result = computeTotalPlayTime(playTimes);
        const expected = expectedTotalPlayTime(playTimes);

        expect(result).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });

  it("returns 0 for an empty library", () => {
    expect(computeTotalPlayTime([])).toBe(0);
  });

  it("single entry returns that value rounded to 1 decimal", () => {
    fc.assert(
      fc.property(playTimeArb, (playTime) => {
        const result = computeTotalPlayTime([playTime]);
        expect(result).toBe(Math.round(playTime * 10) / 10);
      }),
      { numRuns: 100 }
    );
  });

  it("result is always non-negative for non-negative inputs", () => {
    fc.assert(
      fc.property(playTimesArb, (playTimes) => {
        const result = computeTotalPlayTime(playTimes);
        expect(result).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-enriched-stats, Property 2: Précision décimale du temps de jeu
 *
 * _Pour tout_ temps de jeu total calculé, la valeur retournée doit avoir au
 * maximum une décimale (c'est-à-dire que `value * 10` est un entier).
 *
 * **Validates: Requirements 1.3**
 */
describe("Property 2: Précision décimale du temps de jeu", () => {
  it("result * 10 is always an integer", () => {
    fc.assert(
      fc.property(playTimesArb, (playTimes) => {
        const result = computeTotalPlayTime(playTimes);
        expect(Math.round(result * 10)).toBe(result * 10);
      }),
      { numRuns: 200 }
    );
  });
});

/**
 * Feature: player-enriched-stats, Property 3: Calcul du genre favori avec pondération multi-genre
 *
 * _Pour toute_ bibliothèque de joueur contenant des jeux avec des genres associés,
 * le genre favori retourné doit être celui dont le temps de jeu pondéré est le
 * plus élevé, où le temps de jeu d'un jeu ayant N genres est réparti à parts
 * égales (temps / N) entre chaque genre. Le résultat doit inclure le nom du genre
 * et le temps de jeu pondéré total. En cas d'égalité, le genre alphabétiquement
 * premier est sélectionné.
 *
 * **Validates: Requirements 2.1, 2.2, 2.4**
 */

// --- Generators (Property 3) ---

const genreNameArb = fc.string({
  unit: fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
  minLength: 1,
  maxLength: 10,
});
const genresArb = fc.array(genreNameArb, { minLength: 1, maxLength: 5 });
const libraryEntryArb = fc.record({
  playTimeHours: fc.integer({ min: 1, max: 50000 }).map((n) => n / 10),
  genres: genresArb,
});
const libraryArb = fc.array(libraryEntryArb, { minLength: 1, maxLength: 50 });

// --- Reference implementation (Property 3) ---

/**
 * Computes weighted play time per genre from a library.
 * Each entry's play time is split equally across its genres.
 */
function computeWeightedGenreTimes(entries: LibraryEntryWithGenres[]): Map<string, number> {
  const genreMap = new Map<string, number>();
  for (const entry of entries) {
    if (entry.playTimeHours <= 0 || entry.genres.length === 0) continue;
    const weight = entry.playTimeHours / entry.genres.length;
    for (const genre of entry.genres) {
      genreMap.set(genre, (genreMap.get(genre) ?? 0) + weight);
    }
  }
  return genreMap;
}

// --- Tests (Property 3) ---

describe("Property 3: Calcul du genre favori avec pondération multi-genre", () => {
  it("returned genre is one of the genres present in the input entries", () => {
    fc.assert(
      fc.property(libraryArb, (entries) => {
        const result = computeFavoriteGenre(entries);
        if (result === null) return; // no valid entries — nothing to check

        const allGenres = new Set(entries.flatMap((e) => e.genres));
        expect(allGenres.has(result.name)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it("returned playTime equals the sum of weighted contributions for that genre (rounded to 1 decimal)", () => {
    fc.assert(
      fc.property(libraryArb, (entries) => {
        const result = computeFavoriteGenre(entries);
        if (result === null) return;

        const genreTimes = computeWeightedGenreTimes(entries);
        const expectedTime = Math.round((genreTimes.get(result.name) ?? 0) * 10) / 10;

        expect(result.playTime).toBe(expectedTime);
      }),
      { numRuns: 200 }
    );
  });

  it("no other genre has a higher weighted play time than the returned genre", () => {
    fc.assert(
      fc.property(libraryArb, (entries) => {
        const result = computeFavoriteGenre(entries);
        if (result === null) return;

        const genreTimes = computeWeightedGenreTimes(entries);
        for (const [, time] of genreTimes) {
          const rounded = Math.round(time * 10) / 10;
          expect(rounded).toBeLessThanOrEqual(result.playTime);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("on tie, the alphabetically first genre wins", () => {
    fc.assert(
      fc.property(libraryArb, (entries) => {
        const result = computeFavoriteGenre(entries);
        if (result === null) return;

        const genreTimes = computeWeightedGenreTimes(entries);
        // Collect all genres that share the same max rounded time
        const tiedGenres: string[] = [];
        for (const [genre, time] of genreTimes) {
          const rounded = Math.round(time * 10) / 10;
          if (rounded === result.playTime) {
            tiedGenres.push(genre);
          }
        }

        tiedGenres.sort();
        expect(result.name).toBe(tiedGenres[0]);
      }),
      { numRuns: 200 }
    );
  });
});

/**
 * Feature: player-enriched-stats, Property 4: Comptage des reviews et note moyenne
 *
 * _Pour tout_ ensemble de reviews d'un joueur, le compteur retourné doit être égal
 * au nombre de reviews, et la note moyenne doit être égale à la moyenne
 * arithmétique des ratings de toutes les reviews (arrondie à une décimale).
 *
 * **Validates: Requirements 3.1, 3.3**
 */

// --- Generators (Property 4) ---

/** Rating entier de 0 à 20 (système de notation du projet) */
const ratingArb = fc.integer({ min: 0, max: 20 });

/** Tableau de ratings (0 à 100 reviews) */
const ratingsArb = fc.array(ratingArb, { minLength: 0, maxLength: 100 });

/** Tableau non-vide de ratings */
const nonEmptyRatingsArb = fc.array(ratingArb, { minLength: 1, maxLength: 100 });

// --- Tests (Property 4) ---

describe("Property 4: Comptage des reviews et note moyenne", () => {
  it("review count equals the number of ratings", () => {
    fc.assert(
      fc.property(ratingsArb, (ratings) => {
        const result = computeReviewStats(ratings);
        expect(result.reviewCount).toBe(ratings.length);
      }),
      { numRuns: 200 }
    );
  });

  it("averageRating is null for an empty ratings array", () => {
    const result = computeReviewStats([]);
    expect(result.reviewCount).toBe(0);
    expect(result.averageRating).toBeNull();
  });

  it("averageRating equals the arithmetic mean rounded to 1 decimal", () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (ratings) => {
        const result = computeReviewStats(ratings);
        const expectedAvg =
          Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10;
        expect(result.averageRating).toBe(expectedAvg);
      }),
      { numRuns: 200 }
    );
  });

  it("averageRating * 10 is always an integer when not null", () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (ratings) => {
        const result = computeReviewStats(ratings);
        expect(result.averageRating).not.toBeNull();
        expect(Math.round(result.averageRating! * 10)).toBe(result.averageRating! * 10);
      }),
      { numRuns: 200 }
    );
  });

  it("averageRating is within the rating range [0, 20]", () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (ratings) => {
        const result = computeReviewStats(ratings);
        expect(result.averageRating).toBeGreaterThanOrEqual(0);
        expect(result.averageRating).toBeLessThanOrEqual(20);
      }),
      { numRuns: 200 }
    );
  });
});

/**
 * Feature: player-enriched-stats, Property 5: Formatage des nombres selon la locale
 *
 * _Pour tout_ nombre positif et toute locale supportée (`fr`, `en`), la fonction
 * de formatage doit produire une chaîne contenant le séparateur de milliers
 * approprié à la locale et au maximum une décimale.
 *
 * **Validates: Requirements 4.4**
 */

// --- Generators (Property 5) ---

/** Positive number with up to 1 decimal (0.1 to 99999.9) */
const positiveHoursArb = fc.integer({ min: 1, max: 999999 }).map((n) => n / 10);

/** Large number guaranteed >= 1000 for thousands-separator checks */
const largeHoursArb = fc.integer({ min: 10000, max: 999999 }).map((n) => n / 10);

/** Supported locales */
const localeArb = fc.constantFrom("fr", "en");

// --- Helpers (Property 5) ---

/** Strips all non-digit, non-decimal-separator characters to extract the raw digits */
function extractDigits(formatted: string): string {
  return formatted.replace(/[^\d]/g, "");
}

// --- Tests (Property 5) ---

describe("Property 5: Formatage des nombres selon la locale", () => {
  it("output always contains exactly one decimal digit", () => {
    fc.assert(
      fc.property(positiveHoursArb, localeArb, (hours, locale) => {
        const result = formatPlayTime(hours, locale);

        // Find the decimal separator (last non-digit character before the final digits)
        // In "en": period, in "fr": comma
        // The output should end with the decimal separator + exactly 1 digit
        const decimalSepPattern = /[.,]\d$/;
        expect(result).toMatch(decimalSepPattern);

        // Verify there's only ONE decimal portion (no multiple decimal separators acting as decimal)
        // Extract the part after the last decimal separator
        const lastSepIndex = Math.max(result.lastIndexOf("."), result.lastIndexOf(","));
        const decimalPart = result.slice(lastSepIndex + 1);
        expect(decimalPart).toHaveLength(1);
        expect(decimalPart).toMatch(/^\d$/);
      }),
      { numRuns: 100 }
    );
  });

  it("for numbers >= 1000, the output contains a thousands separator", () => {
    fc.assert(
      fc.property(largeHoursArb, localeArb, (hours, locale) => {
        const result = formatPlayTime(hours, locale);

        // The formatted string should be longer than just digits + decimal separator
        // because a thousands separator is inserted.
        // Extract all digit characters — there should be more non-digit chars than just the decimal sep.
        const nonDigitChars = result.replace(/\d/g, "");
        // At least 2 non-digit characters: one thousands separator + one decimal separator
        expect(nonDigitChars.length).toBeGreaterThanOrEqual(2);
      }),
      { numRuns: 100 }
    );
  });

  it("English locale uses period as decimal separator", () => {
    fc.assert(
      fc.property(positiveHoursArb, (hours) => {
        const result = formatPlayTime(hours, "en");

        // The last occurrence of a period should be the decimal separator
        // followed by exactly 1 digit at the end
        expect(result).toMatch(/\.\d$/);
      }),
      { numRuns: 100 }
    );
  });

  it("French locale uses comma as decimal separator", () => {
    fc.assert(
      fc.property(positiveHoursArb, (hours) => {
        const result = formatPlayTime(hours, "fr");

        // French uses comma as decimal separator, followed by exactly 1 digit at end
        expect(result).toMatch(/,\d$/);
      }),
      { numRuns: 100 }
    );
  });

  it("formatted output preserves the numeric value (digits match)", () => {
    fc.assert(
      fc.property(positiveHoursArb, localeArb, (hours, locale) => {
        const result = formatPlayTime(hours, locale);

        // Extract all digits from the formatted string
        const digits = extractDigits(result);

        // The expected value with 1 decimal: format the number ourselves
        const expected = hours.toFixed(1);
        const expectedDigits = expected.replace(/[^\d]/g, "");

        expect(digits).toBe(expectedDigits);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-enriched-stats, Property 6: Filtrage par année pour le résumé annuel
 *
 * _Pour toute_ bibliothèque de joueur contenant des entrées réparties sur plusieurs
 * années, le résumé annuel pour une année donnée doit inclure uniquement les entrées
 * dont le champ `added_at` tombe dans l'année spécifiée. Le temps de jeu total et le
 * nombre de jeux ajoutés doivent correspondre exclusivement aux entrées de cette année.
 *
 * **Validates: Requirements 5.1**
 */

// --- Generators (Property 6) ---

const MIN_TS_2020 = new Date("2020-01-01T00:00:00Z").getTime();
const MAX_TS_2026 = new Date("2026-12-31T23:59:59Z").getTime();

const yearArb = fc.integer({ min: 2020, max: 2026 });

/** Generates a valid ISO date string between 2020 and 2026 via timestamp */
const isoDateArb = fc
  .integer({ min: MIN_TS_2020, max: MAX_TS_2026 })
  .map((ts) => new Date(ts).toISOString());

const entryForYearArb = fc.record({
  addedAt: isoDateArb,
  playTimeHours: fc.integer({ min: 0, max: 50000 }).map((n) => n / 10),
});

const entriesForYearArb = fc.array(entryForYearArb, {
  minLength: 0,
  maxLength: 50,
});

// --- Tests (Property 6) ---

describe("Property 6: Filtrage par année pour le résumé annuel", () => {
  it("filtered entries only contain entries from the target year", () => {
    fc.assert(
      fc.property(entriesForYearArb, yearArb, (entries, year) => {
        const filtered = filterEntriesByYear(entries, year);

        for (const entry of filtered) {
          expect(new Date(entry.addedAt).getFullYear()).toBe(year);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("no entry from the target year is missing from the filtered result", () => {
    fc.assert(
      fc.property(entriesForYearArb, yearArb, (entries, year) => {
        const filtered = filterEntriesByYear(entries, year);
        const expectedCount = entries.filter(
          (e) => new Date(e.addedAt).getFullYear() === year
        ).length;

        expect(filtered.length).toBe(expectedCount);
      }),
      { numRuns: 200 }
    );
  });

  it("total play time of filtered entries matches sum of play times for that year only", () => {
    fc.assert(
      fc.property(entriesForYearArb, yearArb, (entries, year) => {
        const filtered = filterEntriesByYear(entries, year);
        const totalFiltered = computeTotalPlayTime(filtered.map((e) => e.playTimeHours));

        const expectedSum = computeTotalPlayTime(
          entries
            .filter((e) => new Date(e.addedAt).getFullYear() === year)
            .map((e) => e.playTimeHours)
        );

        expect(totalFiltered).toBe(expectedSum);
      }),
      { numRuns: 200 }
    );
  });

  it("games added count equals the number of filtered entries", () => {
    fc.assert(
      fc.property(entriesForYearArb, yearArb, (entries, year) => {
        const filtered = filterEntriesByYear(entries, year);
        const gamesAdded = filtered.length;
        const expectedGamesAdded = entries.filter(
          (e) => new Date(e.addedAt).getFullYear() === year
        ).length;

        expect(gamesAdded).toBe(expectedGamesAdded);
      }),
      { numRuns: 200 }
    );
  });

  it("returns empty array when no entries match the target year", () => {
    // All entries in 2020, filter for 2025
    const min2020 = new Date("2020-01-01T00:00:00Z").getTime();
    const max2020 = new Date("2020-12-31T23:59:59Z").getTime();

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            addedAt: fc
              .integer({ min: min2020, max: max2020 })
              .map((ts) => new Date(ts).toISOString()),
            playTimeHours: fc.integer({ min: 0, max: 50000 }).map((n) => n / 10),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (entries) => {
          const filtered = filterEntriesByYear(entries, 2025);
          expect(filtered).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: player-enriched-stats, Property 7: Calcul du mois le plus actif
 *
 * _Pour tout_ ensemble d'entrées de bibliothèque dans une année donnée, le mois le
 * plus actif retourné doit être celui avec le plus grand nombre d'entrées ajoutées.
 * Le nombre de jeux ajoutés ce mois-là doit correspondre au compte réel.
 *
 * **Validates: Requirements 5.5**
 */

// --- Generators (Property 7) ---

/** Generates an entry with a date in a specific month of 2024 */
const monthEntryArb = fc.integer({ min: 1, max: 12 }).chain((month) =>
  fc.constant({
    addedAt: `2024-${String(month).padStart(2, "0")}-15T12:00:00Z`,
  })
);

/** Non-empty array of month entries (1 to 50) */
const monthEntriesArb = fc.array(monthEntryArb, {
  minLength: 1,
  maxLength: 50,
});

// --- Reference helper (Property 7) ---

/** Counts entries per month (1-12) from an array of entries */
function countEntriesByMonth(entries: LibraryEntryWithDate[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const entry of entries) {
    const month = new Date(entry.addedAt).getMonth() + 1;
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return counts;
}

// --- Tests (Property 7) ---

describe("Property 7: Calcul du mois le plus actif", () => {
  it("returned month is between 1 and 12", () => {
    fc.assert(
      fc.property(monthEntriesArb, (entries) => {
        const result = computeMostActiveMonth(entries);
        expect(result).not.toBeNull();
        expect(result!.month).toBeGreaterThanOrEqual(1);
        expect(result!.month).toBeLessThanOrEqual(12);
      }),
      { numRuns: 100 }
    );
  });

  it("returned gamesAdded equals the actual count of entries in that month", () => {
    fc.assert(
      fc.property(monthEntriesArb, (entries) => {
        const result = computeMostActiveMonth(entries);
        expect(result).not.toBeNull();

        const counts = countEntriesByMonth(entries);
        expect(result!.gamesAdded).toBe(counts.get(result!.month));
      }),
      { numRuns: 100 }
    );
  });

  it("no other month has more entries than the returned month", () => {
    fc.assert(
      fc.property(monthEntriesArb, (entries) => {
        const result = computeMostActiveMonth(entries);
        expect(result).not.toBeNull();

        const counts = countEntriesByMonth(entries);
        for (const [, count] of counts) {
          expect(count).toBeLessThanOrEqual(result!.gamesAdded);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("on tie, the earliest month (lowest number) wins", () => {
    fc.assert(
      fc.property(monthEntriesArb, (entries) => {
        const result = computeMostActiveMonth(entries);
        expect(result).not.toBeNull();

        const counts = countEntriesByMonth(entries);
        // Collect all months that share the max count
        const tiedMonths: number[] = [];
        for (const [month, count] of counts) {
          if (count === result!.gamesAdded) {
            tiedMonths.push(month);
          }
        }

        tiedMonths.sort((a, b) => a - b);
        expect(result!.month).toBe(tiedMonths[0]);
      }),
      { numRuns: 100 }
    );
  });

  it("returns null for empty input", () => {
    expect(computeMostActiveMonth([])).toBeNull();
  });
});

// ============================================================================
// Property 8: Résolution du lien vers l'année
// ============================================================================

/**
 * Feature: player-enriched-stats, Property 8: Résolution du lien vers l'année
 *
 * _Pour tout_ ensemble d'années disponibles (non vide), le lien vers le résumé
 * annuel doit pointer vers l'année en cours si elle contient des données, sinon
 * vers la plus récente année ayant des données. Si aucune année n'a de données,
 * aucun lien ne doit être affiché.
 *
 * **Validates: Requirements 7.2**
 */

// --- Generators (Property 8) ---

/** Generates a year between 2015 and 2030 */
const linkYearArb = fc.integer({ min: 2015, max: 2030 });

/** Generates a non-empty unique array of years */
const availableYearsArb = fc.uniqueArray(linkYearArb, {
  minLength: 1,
  maxLength: 10,
});

// --- Tests (Property 8) ---

describe("Property 8: Résolution du lien vers l'année", () => {
  it("returns null when availableYears is empty", () => {
    fc.assert(
      fc.property(linkYearArb, (currentYear) => {
        expect(resolveYearLink([], currentYear)).toBeNull();
      }),
      { numRuns: 200 }
    );
  });

  it("returns currentYear when it is in availableYears", () => {
    fc.assert(
      fc.property(availableYearsArb, (years) => {
        // Pick a year from the list to use as currentYear
        const currentYear = years[0];
        expect(resolveYearLink(years, currentYear)).toBe(currentYear);
      }),
      { numRuns: 200 }
    );
  });

  it("returns the maximum year when currentYear is NOT in availableYears", () => {
    fc.assert(
      fc.property(availableYearsArb, (years) => {
        // Pick a currentYear guaranteed not to be in the list
        const maxYear = Math.max(...years);
        const currentYear = maxYear + 1;
        expect(resolveYearLink(years, currentYear)).toBe(maxYear);
      }),
      { numRuns: 200 }
    );
  });

  it("returned year is always contained in availableYears (when not null)", () => {
    fc.assert(
      fc.property(availableYearsArb, linkYearArb, (years, currentYear) => {
        const result = resolveYearLink(years, currentYear);
        expect(result).not.toBeNull();
        expect(years).toContain(result);
      }),
      { numRuns: 200 }
    );
  });

  it("returned year is never null when availableYears is non-empty", () => {
    fc.assert(
      fc.property(availableYearsArb, linkYearArb, (years, currentYear) => {
        const result = resolveYearLink(years, currentYear);
        expect(result).not.toBeNull();
      }),
      { numRuns: 200 }
    );
  });
});

// ============================================================================
// Property 9: Visibilité des statistiques selon la confidentialité
// ============================================================================

/**
 * Feature: player-enriched-stats, Property 9: Visibilité des statistiques selon la confidentialité
 *
 * _Pour tout_ joueur et tout visiteur, les statistiques enrichies doivent être
 * visibles si et seulement si le visiteur est le propriétaire du profil OU le
 * réglage `stats_private` est `false`.
 *
 * **Validates: Requirements 8.2, 8.3**
 */

import { shouldShowStats } from "@/components/players/PlayerEnrichedStats";

// --- Tests (Property 9) ---

describe("Property 9: Visibilité des statistiques selon la confidentialité", () => {
  it("stats are always visible when isOwnProfile is true (Req 8.3)", () => {
    fc.assert(
      fc.property(fc.boolean(), (statsPrivate) => {
        expect(shouldShowStats(true, statsPrivate)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it("stats are visible when statsPrivate is false (Req 8.1)", () => {
    fc.assert(
      fc.property(fc.boolean(), (isOwnProfile) => {
        expect(shouldShowStats(isOwnProfile, false)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it("stats are hidden only when isOwnProfile is false AND statsPrivate is true (Req 8.2)", () => {
    expect(shouldShowStats(false, true)).toBe(false);
  });

  it("visibility formula: shouldShowStats(isOwn, priv) === (isOwn || !priv)", () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (isOwnProfile, statsPrivate) => {
        expect(shouldShowStats(isOwnProfile, statsPrivate)).toBe(isOwnProfile || !statsPrivate);
      }),
      { numRuns: 200 }
    );
  });
});
