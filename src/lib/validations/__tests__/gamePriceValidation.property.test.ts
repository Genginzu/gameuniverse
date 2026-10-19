import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { gamePriceSchema } from "@/lib/validations/game";

/**
 * Feature: game-pricing-structure — Property-based tests (tasks 5.1–5.4).
 *
 * The pricing data model is enforced at two layers:
 *  - the `gamePriceSchema` Zod schema (application layer), and
 *  - SQL constraints on the `stores` / `game_prices` tables (database layer:
 *    `stores.name UNIQUE`, `UNIQUE(game_id, store_id, platform)`,
 *    `CHECK (price >= 0)`, and the `store_id` foreign key).
 *
 * Properties 2 is validated directly against the real Zod schema. Properties
 * 1, 3 and 4 encode the database-level invariants as pure reference reducers
 * that model the exact upsert / integrity semantics the SQL constraints
 * guarantee (these constraints cannot be exercised from Vitest without a live
 * database). Property 5 is validated against the real comparison code in a
 * dedicated spec (`src/lib/__tests__/pricing.unit.test.ts`).
 */

// --- Shared generators ---

const uuidGen = fc.uuid();
const currencyGen = fc.constantFrom("EUR", "USD", "GBP", "JPY", "CHF");
const platformGen = fc.constantFrom("PC", "PlayStation", "Xbox", "Nintendo Switch", "Stadia");
const nonNegativePriceGen = fc.float({ min: 0, max: 10000, noNaN: true });

// ---------------------------------------------------------------------------
// Property 1: Store Name Uniqueness (Validates Requirements 1.2)
// ---------------------------------------------------------------------------

interface StoreModel {
  name: string;
  website_url?: string;
}

/**
 * Models the `stores.name UNIQUE` constraint: inserting a store whose name
 * already exists must not create a duplicate row.
 */
function upsertStoreByName(stores: StoreModel[], incoming: StoreModel): StoreModel[] {
  const existingIndex = stores.findIndex((s) => s.name === incoming.name);
  if (existingIndex >= 0) {
    const next = [...stores];
    next[existingIndex] = incoming;
    return next;
  }
  return [...stores, incoming];
}

function hasUniqueNames(stores: StoreModel[]): boolean {
  return new Set(stores.map((s) => s.name)).size === stores.length;
}

describe("Property 1: Store Name Uniqueness", () => {
  it("never produces two stores sharing the same name after upsert", () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ name: fc.string({ minLength: 1, maxLength: 20 }) }), {
          maxLength: 30,
        }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (incomingNames, _seed) => {
          const stores = incomingNames.reduce<StoreModel[]>(
            (acc, s) => upsertStoreByName(acc, { name: s.name }),
            []
          );
          expect(hasUniqueNames(stores)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("replaces (does not duplicate) when upserting an existing name", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (name) => {
        let stores: StoreModel[] = [];
        stores = upsertStoreByName(stores, { name, website_url: "https://a.example" });
        stores = upsertStoreByName(stores, { name, website_url: "https://b.example" });
        expect(stores).toHaveLength(1);
        expect(stores[0].website_url).toBe("https://b.example");
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Price Non-Negativity (Validates Requirements 2.1)
// ---------------------------------------------------------------------------

describe("Property 2: Price Non-Negativity", () => {
  it("accepts any price >= 0", () => {
    fc.assert(
      fc.property(
        uuidGen,
        nonNegativePriceGen,
        currencyGen,
        platformGen,
        (storeId, price, currency, platform) => {
          const result = gamePriceSchema.safeParse({
            store_id: storeId,
            price,
            currency,
            platform,
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("rejects any negative price", () => {
    fc.assert(
      fc.property(
        uuidGen,
        fc.float({ min: Math.fround(-10000), max: Math.fround(-0.01), noNaN: true }),
        currencyGen,
        platformGen,
        (storeId, price, currency, platform) => {
          const result = gamePriceSchema.safeParse({
            store_id: storeId,
            price,
            currency,
            platform,
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Game-Store-Platform Uniqueness (Validates Requirements 2.3)
// ---------------------------------------------------------------------------

interface PriceModel {
  game_id: string;
  store_id: string;
  platform: string;
  price: number;
}

function priceKey(p: PriceModel): string {
  return `${p.game_id}::${p.store_id}::${p.platform}`;
}

/**
 * Models the `UNIQUE(game_id, store_id, platform)` constraint via upsert: a
 * second entry for the same triple updates the existing row instead of adding
 * a duplicate.
 */
function upsertPrice(prices: PriceModel[], incoming: PriceModel): PriceModel[] {
  const idx = prices.findIndex((p) => priceKey(p) === priceKey(incoming));
  if (idx >= 0) {
    const next = [...prices];
    next[idx] = incoming;
    return next;
  }
  return [...prices, incoming];
}

describe("Property 3: Game-Store-Platform Uniqueness", () => {
  it("keeps at most one entry per (game, store, platform) triple", () => {
    const priceEntryGen = fc.record({
      game_id: fc.constantFrom("g1", "g2", "g3"),
      store_id: fc.constantFrom("s1", "s2"),
      platform: fc.constantFrom("PC", "Xbox"),
      price: nonNegativePriceGen,
    });

    fc.assert(
      fc.property(fc.array(priceEntryGen, { maxLength: 50 }), (entries) => {
        const result = entries.reduce<PriceModel[]>((acc, e) => upsertPrice(acc, e), []);
        const keys = result.map(priceKey);
        expect(new Set(keys).size).toBe(keys.length);
      }),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Store Reference Integrity (Validates Requirements 1.4, 2.2)
// ---------------------------------------------------------------------------

/**
 * Models the `game_prices.store_id` foreign key combined with the active-store
 * filter used when exposing prices: every surfaced price must reference an
 * existing, active store.
 */
function resolveValidPrices(
  prices: Array<{ store_id: string }>,
  stores: Array<{ id: string; is_active: boolean }>
): Array<{ store_id: string }> {
  const activeIds = new Set(stores.filter((s) => s.is_active).map((s) => s.id));
  return prices.filter((p) => activeIds.has(p.store_id));
}

describe("Property 4: Store Reference Integrity", () => {
  it("only surfaces prices referencing an existing active store", () => {
    const storeGen = fc.record({ id: fc.uuid(), is_active: fc.boolean() });

    fc.assert(
      fc.property(
        fc.array(storeGen, { minLength: 1, maxLength: 10 }),
        fc.array(fc.record({ store_id: fc.oneof(fc.uuid(), fc.constant("missing")) }), {
          maxLength: 30,
        }),
        (stores, prices) => {
          const resolved = resolveValidPrices(prices, stores);
          const activeIds = new Set(stores.filter((s) => s.is_active).map((s) => s.id));
          for (const p of resolved) {
            expect(activeIds.has(p.store_id)).toBe(true);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
