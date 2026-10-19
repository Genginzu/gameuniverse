import type { SupabaseClient } from "@supabase/supabase-js";
import { buildAffiliateUrl } from "@/lib/affiliate/buildAffiliateUrl";
import { buildAllowedHosts, isAllowedStoreTarget } from "@/lib/affiliate/isAllowedStoreTarget";
import {
  AFFILIATE_NETWORKS,
  type AffiliateNetwork,
  type AffiliateStoreConfig,
} from "@/types/affiliate";
import { logger } from "@/lib/logger";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REFERRER_LENGTH = 500;

interface PriceRow {
  id: string;
  game_id: string;
  store_id: string;
  store_url: string | null;
  is_available: boolean | null;
  stores: {
    is_active: boolean | null;
    affiliate_enabled: boolean;
    affiliate_network: string | null;
    affiliate_tag: string | null;
    affiliate_url_template: string | null;
  } | null;
}

export type AffiliateRedirectResult =
  { ok: true; url: string } | { ok: false; status: 400 | 403 | 404; reason: string };

export interface AffiliateClickContext {
  playerId: string | null;
  referrer: string | null;
}

function toNetwork(value: string | null): AffiliateNetwork | null {
  return AFFILIATE_NETWORKS.find((network) => network === value) ?? null;
}

function toStoreConfig(store: NonNullable<PriceRow["stores"]>): AffiliateStoreConfig {
  return {
    affiliateEnabled: store.affiliate_enabled,
    affiliateNetwork: toNetwork(store.affiliate_network),
    affiliateTag: store.affiliate_tag,
    affiliateUrlTemplate: store.affiliate_url_template,
  };
}

async function fetchAllowedHosts(db: SupabaseClient): Promise<string[]> {
  const { data, error } = await db.from("stores").select("website_url").eq("is_active", true);
  if (error) throw new Error(`Failed to load store allowlist: ${error.message}`);
  return buildAllowedHosts(
    (data ?? []).map((row: { website_url: string | null }) => row.website_url)
  );
}

async function logClick(db: SupabaseClient, price: PriceRow, context: AffiliateClickContext) {
  const { error } = await db.from("affiliate_clicks").insert({
    game_id: price.game_id,
    store_id: price.store_id,
    player_id: context.playerId,
    referrer: context.referrer ? context.referrer.slice(0, MAX_REFERRER_LENGTH) : null,
  });
  if (error) logger.error("Failed to log affiliate click", { error, priceId: price.id });
}

/**
 * Resolves a game price into its outbound (affiliated) store URL and logs the click.
 * The raw product URL must belong to an active store domain (anti open-redirect).
 * Click logging is best effort: a logging failure never blocks the redirect.
 */
export async function resolveAffiliateRedirect(
  db: SupabaseClient,
  priceId: string | null,
  context: AffiliateClickContext
): Promise<AffiliateRedirectResult> {
  if (!priceId || !UUID_RE.test(priceId))
    return { ok: false, status: 400, reason: "invalid_price" };

  const { data, error } = await db
    .from("game_prices")
    .select(
      "id, game_id, store_id, store_url, is_available, stores(is_active, affiliate_enabled, affiliate_network, affiliate_tag, affiliate_url_template)"
    )
    .eq("id", priceId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load game price: ${error.message}`);

  const price = data as PriceRow | null;
  if (!price || !price.is_available || !price.store_url || !price.stores?.is_active) {
    return { ok: false, status: 404, reason: "price_not_found" };
  }

  const allowedHosts = await fetchAllowedHosts(db);
  if (!isAllowedStoreTarget(price.store_url, allowedHosts)) {
    logger.warn("Blocked affiliate redirect to non-allowlisted host", { priceId });
    return { ok: false, status: 403, reason: "target_not_allowed" };
  }

  await logClick(db, price, context);
  return { ok: true, url: buildAffiliateUrl(toStoreConfig(price.stores), price.store_url) };
}
