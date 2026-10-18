import type { GamePricing } from "@/types/game";

export const AFFILIATE_LINK_REL = "sponsored nofollow noopener noreferrer";
export const EXTERNAL_LINK_REL = "noopener noreferrer";

export interface PricingCtaLink {
  href: string;
  rel: string;
  isAffiliate: boolean;
}

/**
 * Affiliated prices go through the tracked /api/go redirect; every other price
 * keeps its raw store link so non-affiliated stores behave exactly as before.
 */
export function getPricingCtaLink(pricing: GamePricing): PricingCtaLink | null {
  if (!pricing.storeUrl) return null;
  if (pricing.isAffiliate && pricing.id) {
    return {
      href: `/api/go?price=${encodeURIComponent(pricing.id)}`,
      rel: AFFILIATE_LINK_REL,
      isAffiliate: true,
    };
  }
  return { href: pricing.storeUrl, rel: EXTERNAL_LINK_REL, isAffiliate: false };
}
