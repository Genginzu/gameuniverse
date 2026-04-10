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
    if (!games || games.length === 0) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSyncing(true);
    setProgress({ done: 0, failed: 0, total: games.length });

    const gameById = new Map(games.map((g) => [g.id, g]));

    const initialStatuses: Record<string, GameSyncStatus> = {};
    for (const g of games) initialStatuses[g.id] = "pending";
    setGameStatuses(initialStatuses);
    setGameErrors({});

    toast({ title: t("syncStarted", { count: games.length }) });

    try {
      const res = await fetch("/api/admin/bulk-import/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameIds: games.map((g) => ({ id: g.id, igdbId: g.igdbId })),
          field,
        }),
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
              const game = gameById.get(gameId);
              if (game) {
                toast({ title: t("gameSynced", { title: game.title }), variant: "success" });
              }
              setProgress({ done: successCount, failed: failCount, total: games.length });
            } else if (event.type === "error") {
              failCount++;
              setGameStatuses((prev) => ({ ...prev, [gameId]: "error" }));
              setGameErrors((prev) => ({ ...prev, [gameId]: event.error || "Unknown error" }));
              const game = gameById.get(gameId);
              if (game) {
                toast({
                  title: t("gameSyncFailed", { title: game.title }),
                  variant: "destructive",
                });
              }
              setProgress({ done: successCount, failed: failCount, total: games.length });
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
  }, [gamesData, t, field, refreshCounts, refreshGames]);

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
