/**
 * Feature: achievements-system
 * Property 1: catalog entry completeness
 * Property 2: tier ordering by threshold within a category
 *
 * Runs against the real seed in the migration (parsed at test time) and the
 * real admin achievement schema, so a bad seed row or a schema change that
 * rejects seeded data fails here.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { adminAchievementFormSchema } from "@/lib/validations/admin-achievement-form";

const MIGRATION = join(process.cwd(), "supabase/migrations/20240313000001_achievement_catalog.sql");
const COLUMNS = [
  "key",
  "category",
  "tier",
  "threshold",
  "xpValue",
  "icon",
  "nameFr",
  "nameEn",
  "descriptionFr",
  "descriptionEn",
  "sortOrder",
] as const;
const NUMERIC = new Set(["threshold", "xpValue", "sortOrder"]);

type SeedRow = Record<(typeof COLUMNS)[number], string | number>;

/** Parses the `VALUES (...)` tuples of the achievement_catalog seed INSERTs. */
function parseSeed(sql: string): SeedRow[] {
  const inserts = sql.match(/INSERT INTO public\.achievement_catalog[\s\S]*?;/g) ?? [];
  return inserts.flatMap((insert) =>
    [...insert.matchAll(/\(\s*('[^]*?)\)\s*[,;]/g)].map(([, tuple]) => {
      const values = [...tuple.matchAll(/'([^']*)'|(-?\d+)/g)].map(([, str, num]) =>
        str !== undefined ? str : Number(num)
      );
      return Object.fromEntries(
        COLUMNS.map((col, i) => [col, NUMERIC.has(col) ? Number(values[i]) : values[i]])
      ) as SeedRow;
    })
  );
}

const SEED = parseSeed(readFileSync(MIGRATION, "utf8"));
const TIER_RANK: Record<string, number> = { bronze: 0, silver: 1, gold: 2 };

describe("Achievement catalog seed", () => {
  it("contains the 24 documented achievements with unique keys", () => {
    expect(SEED).toHaveLength(24);
    expect(new Set(SEED.map((row) => row.key)).size).toBe(SEED.length);
  });

  it.each(SEED.map((row) => [row.key, row] as const))(
    "Property 1: %s is a complete, valid catalog entry",
    (_key, row) => {
      const result = adminAchievementFormSchema.safeParse(row);
      expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
    }
  );

  it("Property 2: a lower threshold never has a higher tier within a category", () => {
    for (const a of SEED) {
      for (const b of SEED) {
        if (a.category === b.category && a.threshold < b.threshold) {
          expect(TIER_RANK[a.tier], `${a.key} vs ${b.key}`).toBeLessThanOrEqual(TIER_RANK[b.tier]);
        }
      }
    }
  });

  it("orders entries within each category by a unique, threshold-ascending sort_order", () => {
    const categories = new Set(SEED.map((row) => row.category));
    for (const category of categories) {
      const rows = SEED.filter((row) => row.category === category);
      const bySort = [...rows].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
      expect(new Set(rows.map((row) => row.sortOrder)).size, category).toBe(rows.length);
      expect(
        bySort.map((row) => row.threshold),
        category
      ).toEqual([...rows].map((row) => Number(row.threshold)).sort((a, b) => a - b));
    }
  });
});
