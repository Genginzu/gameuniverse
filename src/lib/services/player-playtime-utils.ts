/**
 * Pure utility for computing player playtime average.
 * Extracted for testability via property-based tests.
 */

/**
 * Compute the arithmetic mean and count from an array of strictly positive
 * playtime values.
 *
 * @param values - Array of play_time_hours values (must all be > 0)
 * @returns { average, count } where average is null when the array is empty
 */
export function computePlaytimeAverage(values: number[]): {
  average: number | null;
  count: number;
} {
  const positiveValues = values.filter((v) => v > 0);
  const count = positiveValues.length;

  if (count === 0) {
    return { average: null, count: 0 };
  }

  const sum = positiveValues.reduce((acc, val) => acc + val, 0);
  const average = sum / count;

  return { average, count };
}
