"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { fetcher } from "@/lib/swr/fetcher";
import type { AdminStoreAffiliate } from "@/types/affiliate";
import type { AdminStoreAffiliateData } from "@/lib/validations/admin-store-affiliate";

const STORES_KEY = "/api/admin/stores";

export function useAdminStores() {
  const { data, error, isLoading, mutate } = useSWR<{ stores: AdminStoreAffiliate[] }>(
    STORES_KEY,
    fetcher
  );

  const updateAffiliate = useCallback(
    async (storeId: string, input: AdminStoreAffiliateData): Promise<AdminStoreAffiliate> => {
      const response = await fetch(`${STORES_KEY}/${encodeURIComponent(storeId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error(`Failed to update store (${response.status})`);
      const { store } = (await response.json()) as { store: AdminStoreAffiliate };
      await mutate(
        (current) => ({
          stores: (current?.stores ?? []).map((s) => (s.id === store.id ? store : s)),
        }),
        { revalidate: false }
      );
      return store;
    },
    [mutate]
  );

  return {
    stores: data?.stores ?? [],
    isLoading,
    error: error as Error | undefined,
    updateAffiliate,
  };
}
