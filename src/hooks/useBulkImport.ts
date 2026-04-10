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
}

export type GameSyncStatus = "pending" | "syncing" | "success" | "error";

interface GamesResponse {
  games: BulkGame[];
  total: number;
}

export function useBulkImport() {
  const t = useTranslations("bulkImport");
  const [selectedField, setSelectedField] = useState<BulkImportField>("cover");
  const [batchSize, setBatchSize] = useState(20);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, failed: 0, total: 0 });
  const [gameStatuses, setGameStatuses] = useState<Record<string, GameSyncStatus>>({});
  const abortRef = useRef(false);

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
    `/api/admin/bulk-import/games?field=${selectedField}&limit=${batchSize}`,
    fetcher
  );

  const handleSync = useCallback(async () => {
    const games = gamesData?.games;
    if (!games || games.length === 0) return;

    abortRef.current = false;
    setSyncing(true);
    setProgress({ done: 0, failed: 0, total: games.length });

    // Initialize all games as pending
    const initialStatuses: Record<string, GameSyncStatus> = {};
    for (const g of games) initialStatuses[g.id] = "pending";
    setGameStatuses(initialStatuses);

    toast({ title: t("syncStarted", { count: games.length }) });

    let successCount = 0;
    let failCount = 0;

    for (const game of games) {
      if (abortRef.current) break;

      // Mark current game as syncing
      setGameStatuses((prev) => ({ ...prev, [game.id]: "syncing" }));

      try {
        const res = await fetch("/api/admin/bulk-import/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameIds: [{ id: game.id, igdbId: game.igdbId }],
          }),
        });

        const result = await res.json();
        const ok = res.ok && result.success > 0;

        if (ok) {
          successCount++;
          setGameStatuses((prev) => ({ ...prev, [game.id]: "success" }));
          toast({
            title: t("gameSynced", { title: game.title }),
            variant: "success",
          });
        } else {
          failCount++;
          setGameStatuses((prev) => ({ ...prev, [game.id]: "error" }));
          toast({
            title: t("gameSyncFailed", { title: game.title }),
            variant: "destructive",
          });
        }
      } catch {
        failCount++;
        setGameStatuses((prev) => ({ ...prev, [game.id]: "error" }));
        toast({
          title: t("gameSyncFailed", { title: game.title }),
          variant: "destructive",
        });
      }

      setProgress({ done: successCount, failed: failCount, total: games.length });
    }

    // Final summary toast
    toast({
      title: t("syncDone", { success: successCount, total: games.length }),
      variant: failCount > 0 ? "destructive" : "success",
    });

    refreshCounts();
    refreshGames();
    setSyncing(false);
  }, [gamesData, t, refreshCounts, refreshGames]);

  const handleAbort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return {
    selectedField,
    setSelectedField,
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
    handleSync,
    handleAbort,
    refreshGames,
  };
}
