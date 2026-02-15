"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useGameForm } from "@/hooks/useGameForm";
import { GameForm } from "@/components/admin/games/GameForm";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { FaArrowLeft } from "react-icons/fa";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import { type GameApiResponse, toFormData } from "@/lib/utils/game-api-transform";

/**
 * Inner component that mounts only when initialData is ready,
 * so useGameForm receives correct defaultValues on first render.
 */
function EditGameForm({
  initialData,
  gameId,
  igdbId,
}: {
  initialData: AdminGameFormData;
  gameId: string;
  igdbId: number | null;
}) {
  const t = useTranslations("admin.games");
  const router = useRouter();

  const {
    form,
    genres,
    companies,
    ratings,
    contentDescriptors,
    supportedLanguages,
    stores,
    currencies,
    platforms,
    loadingOptions,
    submitGame,
    isSubmitting,
  } = useGameForm("edit", initialData, gameId);

  const handleSubmit = useCallback(
    async (data: AdminGameFormData) => {
      try {
        await submitGame(data);
        toast({ title: t("editPage.success"), variant: "success" });
      } catch (err) {
        const message = err instanceof Error ? err.message : t("editPage.errorGeneric");
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitGame, t]
  );

  /** Re-fetch game data from API and reset the form after IGDB sync */
  const handleSyncComplete = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/games/${gameId}`);
      if (!res.ok) return;
      const data: GameApiResponse = await res.json();
      form.reset(toFormData(data));
    } catch {
      // Silently fail — overrides are already refreshed by the sync hook
    }
  }, [gameId, form]);

  // Keep showing the same loading style until options are ready
  if (loadingOptions) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-gray-500 dark:text-gray-400">{t("editPage.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/games")}>
          <FaArrowLeft className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
      </div>
      <div className="mx-auto max-w-7xl">
        <GameForm
          mode="edit"
          form={form}
          genres={genres}
          companies={companies}
          ratings={ratings}
          contentDescriptors={contentDescriptors}
          supportedLanguages={supportedLanguages}
          stores={stores}
          currencies={currencies}
          platforms={platforms}
          loadingOptions={loadingOptions}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          gameId={gameId}
          igdbId={igdbId}
          onSyncComplete={handleSyncComplete}
        />
      </div>
    </div>
  );
}

export default function EditGamePage() {
  const t = useTranslations("admin.games");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const gameId = params.id;

  const [initialData, setInitialData] = useState<AdminGameFormData | undefined>(undefined);
  const [igdbId, setIgdbId] = useState<number | null>(null);
  const [loadingGame, setLoadingGame] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadGame = async () => {
      try {
        const res = await fetch(`/api/admin/games/${gameId}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) setLoadError(t("editPage.notFound"));
          } else {
            if (mounted) setLoadError(t("editPage.loadError"));
          }
          return;
        }
        const data: GameApiResponse = await res.json();
        if (mounted) {
          setInitialData(toFormData(data));
          setIgdbId(data.igdb_id);
        }
      } catch {
        if (mounted) setLoadError(t("editPage.loadError"));
      } finally {
        if (mounted) setLoadingGame(false);
      }
    };

    loadGame();
    return () => {
      mounted = false;
    };
  }, [gameId, t]);

  if (loadingGame) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-gray-500 dark:text-gray-400">{t("editPage.loading")}</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/games")}>
            <FaArrowLeft className="mr-1 h-3 w-3" />
            {t("form.backToList")}
          </Button>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <>{initialData && <EditGameForm initialData={initialData} gameId={gameId} igdbId={igdbId} />}</>
  );
}
