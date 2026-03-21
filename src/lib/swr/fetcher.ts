import { apiClient } from "@/lib/api-client";

/**
 * Fetcher par défaut pour SWR.
 * Utilise l'ApiClient existant (retry, timeout, gestion d'erreurs typées).
 *
 * Usage : useSWR("/api/games?locale=fr", fetcher)
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  return apiClient.get<T>(url);
}
