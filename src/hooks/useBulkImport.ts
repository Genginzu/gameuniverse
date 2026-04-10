import { useState, useCallback } from "react";
import useSWR from "swr";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type BulkImportField = "cover" | "background" | "playtime" | "metascore" | "releaseDate";

interface BulkGame {
  id: string;
  slug: string;
  igdbId: number;
  title: string;
  coverImage: string | null;
}

interface GamesResponse {
  games: BulkGame[];
  total: number;
}

export function useBulkImport() {
  const t = useTranslations("bulkImport");
  const [selectedField, setSelectedField] = useState<BulkImportField>("cover");
  const [batchSize, setBatchSize] = useState(20);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  // Fetch field counts
  const {
    data: fieldCounts,
    isLoading: countsLoading,
    mutate: refreshCounts,
  } = useSWR<Record<string, number>>("/api/admin/bulk-import/fields", fetcher);

  // Fetch games missing the selected field
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

    setSyncing(true);
    setProgress({ done: 0, total: games.length });
    toast({ title: t("syncStarted", { count: games.length }) });

    try {
      const res = await fetch("/api/admin/bulk-import/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameIds: games.map((g) => ({ id: g.id, igdbId: g.igdbId })),
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setProgress({ done: result.success, total: result.total });
        toast({
          title: t("syncDone", { success: result.success, total: result.total }),
          variant: result.failed > 0 ? "destructive" : "success",
        });
        refreshCounts();
        refreshGames();
      } else {
        toast({ title: t("syncFailed"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("syncFailed"), variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  }, [gamesData, t, refreshCounts, refreshGames]);

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
    handleSync,
    refreshGames,
  };
}
