export const AFFILIATE_NETWORKS = [
  "amazon",
  "impact",
  "partnerize",
  "awin",
  "cj",
  "custom",
] as const;

export type AffiliateNetwork = (typeof AFFILIATE_NETWORKS)[number];

export interface AffiliateStoreConfig {
  affiliateEnabled: boolean;
  affiliateNetwork: AffiliateNetwork | null;
  affiliateTag: string | null;
  affiliateUrlTemplate: string | null;
}

export type AffiliateEnv = Readonly<Record<string, string | undefined>>;

export interface AdminStoreAffiliate {
  id: string;
  name: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  isActive: boolean;
  affiliateEnabled: boolean;
  affiliateNetwork: AffiliateNetwork | null;
  affiliateTag: string | null;
  affiliateUrlTemplate: string | null;
}
