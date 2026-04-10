import { useState, useCallback, useRef } from "react";
import useSWR from "swr";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type BulkImportField = "cover" | "background" | "playtime" | "metascore" | "releaseDate";

export interface BulkGame {
  id: string;
  slug: string;
  igdbId: number;
  title: string;
  coverImage: string | null;
  viewCount: number;
  metascore: number | null;
}

export type GameSyncStatus = "pending" | "syncing" | "success" | "error";

interface GamesResponse {
  games: BulkGame[];
  total: number;
}

export function useBulkImport(field: BulkImportField = "cover") {
  const t = useTranslations("bulkImport");
  const [batchSize, setBatchSize] = useState(20);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, failed: 0, total: 0 });
  const [gameStatuses, setGameStatuses] = useState<Record<string, GameSyncStatus>>({});
  const [gameErrors, setGameErrors] = useState<Record<string, string>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    data: fieldCounts,
    isLoading: countsLoading,
    mutate: refreshCounts,
  } = useSWR<Record<string, number>>("/api/admin/bulk-import/fields", fetcher);

  const {
    data: gamesData,
    isLoading: gamesLoading,
    mutate: refreshGames,
  } = useSWR<GamesResponse>(
    `/api/admin/bulk-import/games?field=${field}&limit=${batchSize === 0 ? 99999 : batchSize}`,
    fetcher
  );

  const handleSync = useCallback(async () => {
    const games = gamesData?.games;
    const isAllMode = batchSize === 0;

    if (!isAllMode && (!games || games.length === 0)) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSyncing(true);
    const totalEstimate = isAllMode ? (gamesData?.total ?? 0) : (games?.length ?? 0);
    setProgress({ done: 0, failed: 0, total: totalEstimate });

    const _gameById = new Map((games || []).map((g) => [g.id, g]));

    if (!isAllMode && games) {
      const initialStatuses: Record<string, GameSyncStatus> = {};
      for (const g of games) initialStatuses[g.id] = "pending";
      setGameStatuses(initialStatuses);
    } else {
      setGameStatuses({});
    }
    setGameErrors({});

    toast({ title: t("syncStarted", { count: totalEstimate }) });

    try {
      // Build endpoint and payload
      let endpoint: string;
      let payload: Record<string, unknown>;

      if (field === "metascore" && !isAllMode) {
        endpoint = "/api/admin/bulk-import/sync-metascore";
        payload = {
          games: (games || []).map((g) => ({ id: g.id, igdbId: g.igdbId, slug: g.slug })),
        };
      } else if (isAllMode) {
        endpoint = "/api/admin/bulk-import/sync";
        payload = { all: true, field };
      } else {
        endpoint = "/api/admin/bulk-import/sync";
        payload = { gameIds: (games || []).map((g) => ({ id: g.id, igdbId: g.igdbId })), field };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        toast({ title: t("syncFailed"), variant: "destructive" });
        setSyncing(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let successCount = 0;
      let failCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            const gameId = event.gameId as string;

            if (event.type === "syncing") {
              setGameStatuses((prev) => ({ ...prev, [gameId]: "syncing" }));
            } else if (event.type === "success") {
              successCount++;
              setGameStatuses((prev) => ({ ...prev, [gameId]: "success" }));
              refreshCounts(
                (prev) => (prev ? { ...prev, [field]: Math.max(0, (prev[field] ?? 0) - 1) } : prev),
                { revalidate: false }
              );
              setProgress({ done: successCount, failed: failCount, total: totalEstimate });
            } else if (event.type === "error") {
              failCount++;
              setGameStatuses((prev) => ({ ...prev, [gameId]: "error" }));
              setGameErrors((prev) => ({ ...prev, [gameId]: event.error || "Unknown error" }));
              setProgress({ done: successCount, failed: failCount, total: totalEstimate });
            } else if (event.type === "done") {
              toast({
                title: t("syncDone", { success: event.success, total: event.total }),
                variant: event.failed > 0 ? "destructive" : "success",
              });
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      refreshCounts();
      refreshGames();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        toast({ title: t("syncAborted"), variant: "destructive" });
      } else {
        toast({ title: t("syncFailed"), variant: "destructive" });
      }
    } finally {
      setSyncing(false);
      abortControllerRef.current = null;
    }
  }, [gamesData, t, field, batchSize, refreshCounts, refreshGames]);

  const handleAbort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    batchSize,
    setBatchSize,
    fieldCounts,
    countsLoading,
    games: gamesData?.games ?? [],
    gamesTotal: gamesData?.total ?? 0,
    gamesLoading,
    syncing,
    progress,
    gameStatuses,
    gameErrors,
    handleSync,
    handleAbort,
    refreshGames,
  };
}
