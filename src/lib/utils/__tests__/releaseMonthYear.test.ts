import { describe, it, expect } from "vitest";

import { formatReleaseMonthYear } from "@/lib/utils/releaseMonthYear";

describe("formatReleaseMonthYear", () => {
  it.each([
    ["2026-11-19", undefined, "11/2026"],
    ["2026-01-01T00:00:00+00:00", undefined, "01/2026"],
    ["2026-12-31", 2026, "2026"],
    ["1970-01-01", 1970, null],
    [undefined, 2024, "2024"],
    [null, null, null],
    ["not-a-date", undefined, null],
  ])("formats %j (year %j) as %j", (releaseDate, releaseYear, expected) => {
    expect(formatReleaseMonthYear(releaseDate, releaseYear)).toBe(expected);
  });
});
