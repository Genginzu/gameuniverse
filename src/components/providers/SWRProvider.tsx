"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/swr/fetcher";

interface SWRProviderProps {
  children: React.ReactNode;
}

/**
 * Provider SWR global avec configuration par défaut.
 *
 * - fetcher : utilise l'ApiClient (retry + timeout + erreurs typées)
 * - revalidateOnFocus : revalide quand l'utilisateur revient sur l'onglet
 * - revalidateOnReconnect : revalide à la reconnexion réseau
 * - dedupingInterval : déduplique les requêtes identiques pendant 5s
 * - errorRetryCount : pas de retry SWR (déjà géré par ApiClient)
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
        errorRetryCount: 0,
      }}
    >
      {children}
    </SWRConfig>
  );
}
