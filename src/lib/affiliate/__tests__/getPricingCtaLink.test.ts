import { describe, it, expect } from "vitest";
import {
  AFFILIATE_LINK_REL,
  EXTERNAL_LINK_REL,
  getPricingCtaLink,
} from "@/lib/affiliate/getPricingCtaLink";
import type { GamePricing } from "@/types/game";

function pricing(overrides: Partial<GamePricing> = {}): GamePricing {
  return {
    id: "price-1",
    price: 59.99,
    currency: "EUR",
    platform: "PC",
    lastUpdated: "",
    storeUrl: "https://store.steampowered.com/app/1",
    isAffiliate: false,
    store: { name: "Steam" },
    ...overrides,
  };
}

describe("getPricingCtaLink", () => {
  it("returns null without a store url", () => {
    expect(getPricingCtaLink(pricing({ storeUrl: undefined }))).toBeNull();
  });

  it("keeps the raw store link for non-affiliated stores", () => {
    expect(getPricingCtaLink(pricing())).toEqual({
      href: "https://store.steampowered.com/app/1",
      rel: EXTERNAL_LINK_REL,
      isAffiliate: false,
    });
  });

  it("routes affiliated stores through /api/go with a sponsored rel", () => {
    expect(getPricingCtaLink(pricing({ isAffiliate: true }))).toEqual({
      href: "/api/go?price=price-1",
      rel: AFFILIATE_LINK_REL,
      isAffiliate: true,
    });
    expect(AFFILIATE_LINK_REL).toBe("sponsored nofollow noopener noreferrer");
  });

  it("falls back to the raw link when an affiliated price has no id", () => {
    expect(getPricingCtaLink(pricing({ isAffiliate: true, id: undefined }))?.isAffiliate).toBe(
      false
    );
  });
});
