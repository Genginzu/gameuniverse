import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useApiClient } from "@/lib/api-client";
import { useAsyncError } from "@/components/providers/ErrorProvider";
import { toast } from "@/hooks/use-toast";
import type { PlayerSummary, PlayerPagination as PlayerPaginationType } from "@/types/player";

export function usePlayersList() {
  const tErrors = useTranslations("errors");
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [pagination, setPagination] = useState<PlayerPaginationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const apiClient = useApiClient();
  const { executeAsync } = useAsyncError();

  const fetchPlayers = useCallback(
    async (search: string = "", gameCounts: string[] = [], page: number = 1) => {
      setLoading(true);

      const result = await executeAsync(async () => {
        const params = new URLSearchParams({ page: page.toString(), limit: "20" });
        if (search.trim()) params.append("search", search.trim());
        if (gameCounts.length > 0) params.append("gameCountRange", gameCounts[0]);

        const data = await apiClient.get(`/api/players?${params.toString()}`, {
          retryConfig: { maxAttempts: 3, baseDelay: 1000 },
        });
        return { players: data.players || [], pagination: data.pagination || null };
      }, "fetchPlayers");

      if (result) {
        setPlayers(result.players);
        setPagination(result.pagination);
      } else {
        toast({
          variant: "destructive",
          title: tErrors("loadingError"),
          description: tErrors("loadingErrorDescription"),
        });
      }

      setLoading(false);
      setInitialLoading(false);
    },
    [apiClient, executeAsync, tErrors]
  );

  // Initial load
  useEffect(() => {
    const loadInitialPlayers = async () => {
      setLoading(true);
      setInitialLoading(true);

      const result = await executeAsync(async () => {
        const params = new URLSearchParams({ page: "1", limit: "20" });
        const data = await apiClient.get(`/api/players?${params.toString()}`, {
          retryConfig: { maxAttempts: 3, baseDelay: 1000 },
        });
        return { players: data.players || [], pagination: data.pagination || null };
      }, "fetchPlayers");

      if (result) {
        setPlayers(result.players);
        setPagination(result.pagination);
      }
      setLoading(false);
      setInitialLoading(false);
    };
    loadInitialPlayers();
  }, []);

  return { players, pagination, loading, initialLoading, fetchPlayers };
}
