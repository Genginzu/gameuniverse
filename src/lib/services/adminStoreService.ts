import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AFFILIATE_NETWORKS,
  type AdminStoreAffiliate,
  type AffiliateNetwork,
} from "@/types/affiliate";
import type { AdminStoreAffiliateData } from "@/lib/validations/admin-store-affiliate";

const STORE_COLUMNS =
  "id, name, website_url, logo_url, is_active, affiliate_enabled, affiliate_network, affiliate_tag, affiliate_url_template";

interface StoreRow {
  id: string;
  name: string;
  website_url: string | null;
  logo_url: string | null;
  is_active: boolean | null;
  affiliate_enabled: boolean;
  affiliate_network: string | null;
  affiliate_tag: string | null;
  affiliate_url_template: string | null;
}

function toNetwork(value: string | null): AffiliateNetwork | null {
  return AFFILIATE_NETWORKS.find((network) => network === value) ?? null;
}

export function mapStoreRow(row: StoreRow): AdminStoreAffiliate {
  return {
    id: row.id,
    name: row.name,
    websiteUrl: row.website_url,
    logoUrl: row.logo_url,
    isActive: row.is_active ?? false,
    affiliateEnabled: row.affiliate_enabled,
    affiliateNetwork: toNetwork(row.affiliate_network),
    affiliateTag: row.affiliate_tag,
    affiliateUrlTemplate: row.affiliate_url_template,
  };
}

export async function listAdminStores(db: SupabaseClient): Promise<AdminStoreAffiliate[]> {
  const { data, error } = await db.from("stores").select(STORE_COLUMNS).order("name");
  if (error) throw new Error(`Failed to list stores: ${error.message}`);
  return ((data ?? []) as StoreRow[]).map(mapStoreRow);
}

export async function updateStoreAffiliate(
  db: SupabaseClient,
  storeId: string,
  input: AdminStoreAffiliateData
): Promise<AdminStoreAffiliate | null> {
  const { data, error } = await db
    .from("stores")
    .update({
      affiliate_enabled: input.affiliateEnabled,
      affiliate_network: input.affiliateNetwork,
      affiliate_tag: input.affiliateTag,
      affiliate_url_template: input.affiliateUrlTemplate,
    })
    .eq("id", storeId)
    .select(STORE_COLUMNS)
    .maybeSingle();
  if (error) throw new Error(`Failed to update store: ${error.message}`);
  return data ? mapStoreRow(data as StoreRow) : null;
}
