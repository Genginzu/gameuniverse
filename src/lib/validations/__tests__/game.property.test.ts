import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { gamePriceSchema } from "@/lib/validations/game";

/**
 * Property: price non-negativity (game-pricing-structure, requirement 2.1).
 *
 * `gamePriceSchema` validates every price entry sent when an admin creates or
 * updates a game, so a negative price must never pass validation.
 */

const storeIdGen = fc.uuid();
const currencyGen = fc.constantFrom("EUR", "USD", "GBP", "JPY", "CHF");
const platformGen = fc.constantFrom("PC", "PlayStation", "Xbox", "Nintendo Switch");

function parsePrice(storeId: string, price: number, currency: string, platform: string) {
  return gamePriceSchema.safeParse({ store_id: storeId, price, currency, platform });
}

describe("gamePriceSchema — price non-negativity", () => {
  it("accepts any price >= 0", () => {
    fc.assert(
      fc.property(
        storeIdGen,
        fc.float({ min: 0, max: 10000, noNaN: true }),
        currencyGen,
        platformGen,
        (storeId, price, currency, platform) => {
          expect(parsePrice(storeId, price, currency, platform).success).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("rejects any negative price", () => {
    fc.assert(
      fc.property(
        storeIdGen,
        fc.float({ min: Math.fround(-10000), max: Math.fround(-0.01), noNaN: true }),
        currencyGen,
        platformGen,
        (storeId, price, currency, platform) => {
          expect(parsePrice(storeId, price, currency, platform).success).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });
});
