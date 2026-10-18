import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { resolveAffiliateRedirect } = await import("@/lib/services/affiliateRedirectService");

const PRICE_ID = "11111111-2222-3333-4444-555555555555";

type Result = { data?: unknown; error?: unknown };

function chain(result: Result, onInsert?: (row: unknown) => void) {
  const c: Record<string, unknown> = {};
  const self = new Proxy(c, {
    get: (_, prop) => {
      if (prop === "then") return (resolve: (r: Result) => void) => resolve(result);
      if (prop === "insert") {
        return (row: unknown) => {
          onInsert?.(row);
          return self;
        };
      }
      return () => self;
    },
  });
  return self;
}

function priceRow(
  overrides: Record<string, unknown> = {},
  storeOverrides: Record<string, unknown> = {}
) {
  return {
    id: PRICE_ID,
    game_id: "game-1",
    store_id: "store-1",
    store_url: "https://www.amazon.fr/dp/B0TEST",
    is_available: true,
    stores: {
      is_active: true,
      affiliate_enabled: true,
      affiliate_network: "amazon",
      affiliate_tag: "gameuniverse-21",
      affiliate_url_template: null,
      ...storeOverrides,
    },
    ...overrides,
  };
}

let inserted: unknown[];
let tables: Record<string, Result>;

function makeDb() {
  return {
    from: (table: string) =>
      chain(tables[table] ?? { data: null, error: null }, (row) => inserted.push(row)),
  } as never;
}

beforeEach(() => {
  inserted = [];
  tables = {
    game_prices: { data: priceRow(), error: null },
    stores: { data: [{ website_url: "https://www.amazon.fr" }], error: null },
    affiliate_clicks: { data: null, error: null },
  };
});

const context = { playerId: "player-1", referrer: "https://gameuniverse.gg/fr/games/x" };

describe("resolveAffiliateRedirect", () => {
  it("rejects a missing or malformed price id", async () => {
    expect(await resolveAffiliateRedirect(makeDb(), null, context)).toEqual({
      ok: false,
      status: 400,
      reason: "invalid_price",
    });
    expect((await resolveAffiliateRedirect(makeDb(), "https://evil.com", context)).ok).toBe(false);
    expect(inserted).toHaveLength(0);
  });

  it("returns 404 for unknown, unavailable or url-less prices", async () => {
    tables.game_prices = { data: null, error: null };
    expect(await resolveAffiliateRedirect(makeDb(), PRICE_ID, context)).toMatchObject({
      status: 404,
    });

    tables.game_prices = { data: priceRow({ is_available: false }), error: null };
    expect(await resolveAffiliateRedirect(makeDb(), PRICE_ID, context)).toMatchObject({
      status: 404,
    });

    tables.game_prices = { data: priceRow({ store_url: null }), error: null };
    expect(await resolveAffiliateRedirect(makeDb(), PRICE_ID, context)).toMatchObject({
      status: 404,
    });

    tables.game_prices = { data: priceRow({}, { is_active: false }), error: null };
    expect(await resolveAffiliateRedirect(makeDb(), PRICE_ID, context)).toMatchObject({
      status: 404,
    });
    expect(inserted).toHaveLength(0);
  });

  it("refuses a target outside the store allowlist and logs nothing", async () => {
    tables.game_prices = {
      data: priceRow({ store_url: "https://evil.example.com/phish" }),
      error: null,
    };
    const result = await resolveAffiliateRedirect(makeDb(), PRICE_ID, context);
    expect(result).toEqual({ ok: false, status: 403, reason: "target_not_allowed" });
    expect(inserted).toHaveLength(0);
  });

  it("logs the click and returns the affiliated url", async () => {
    const result = await resolveAffiliateRedirect(makeDb(), PRICE_ID, context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(new URL(result.url).searchParams.get("tag")).toBe("gameuniverse-21");
    expect(inserted).toEqual([
      {
        game_id: "game-1",
        store_id: "store-1",
        player_id: "player-1",
        referrer: "https://gameuniverse.gg/fr/games/x",
      },
    ]);
  });

  it("returns the raw url when the store is not affiliated", async () => {
    tables.game_prices = { data: priceRow({}, { affiliate_enabled: false }), error: null };
    const result = await resolveAffiliateRedirect(makeDb(), PRICE_ID, context);
    expect(result).toEqual({ ok: true, url: "https://www.amazon.fr/dp/B0TEST" });
  });

  it("truncates long referrers", async () => {
    await resolveAffiliateRedirect(makeDb(), PRICE_ID, {
      playerId: null,
      referrer: "x".repeat(2000),
    });
    expect((inserted[0] as { referrer: string }).referrer).toHaveLength(500);
    expect((inserted[0] as { player_id: null }).player_id).toBeNull();
  });

  it("still redirects when click logging fails", async () => {
    tables.affiliate_clicks = { data: null, error: { message: "boom" } };
    const result = await resolveAffiliateRedirect(makeDb(), PRICE_ID, context);
    expect(result.ok).toBe(true);
  });

  it("throws when the price query fails", async () => {
    tables.game_prices = { data: null, error: { message: "db down" } };
    await expect(resolveAffiliateRedirect(makeDb(), PRICE_ID, context)).rejects.toThrow("db down");
  });
});
