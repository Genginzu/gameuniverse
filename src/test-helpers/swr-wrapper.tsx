import React from "react";
import { SWRConfig } from "swr";

/**
 * Fetcher simple pour les tests — appelle fetch directement sans retry.
 * Contrairement au fetcher de prod (apiClient.get avec retry/timeout),
 * celui-ci échoue immédiatement, ce qui évite les timeouts en test.
 */
async function testFetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const data = isJson ? await response.json() : {};

    const error = new Error(data?.error || `HTTP ${response.status}`) as Error & {
      statusCode?: number;
      type?: string;
    };
    error.statusCode = response.status;

    // Mapper les status codes vers les types d'erreur (comme ApiClient)
    if (response.status === 404) error.type = "NOT_FOUND";
    throw error;
  }

  return response.json();
}

/**
 * Wrapper SWR pour les tests de hooks.
 * - fetcher: fetcher simple sans retry (pas de timeout en test)
 * - provider: cache isolé par test (pas de fuite entre tests)
 * - dedupingInterval: 0 pour éviter la déduplication en test
 * - errorRetryCount: 0 pour ne pas retenter en test
 */
export function createSWRWrapper() {
  return function SWRWrapper({ children }: { children: React.ReactNode }) {
    return (
      <SWRConfig
        value={{
          fetcher: testFetcher,
          provider: () => new Map(),
          dedupingInterval: 0,
          errorRetryCount: 0,
        }}
      >
        {children}
      </SWRConfig>
    );
  };
}
