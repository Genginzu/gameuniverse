"use client";

import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import type { PlayerWallet, WalletResponse } from "@/types/coins";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface UseWalletReturn {
  wallet: PlayerWallet | null;
  isLoading: boolean;
  error: string | null;
  mutate: () => Promise<void>;
}

export function useWallet(): UseWalletReturn {
  const { user } = useAuth();

  const { data, isLoading, error, mutate } = useSWR<WalletResponse>(
    user?.id ? "/api/players/me/wallet" : null,
    fetcher,
    { refreshInterval: 60000, onError: () => {} }
  );

  return {
    wallet: data?.wallet ?? null,
    isLoading,
    error: error ? "Failed to fetch wallet" : null,
    mutate: async () => {
      await mutate();
    },
  };
}
