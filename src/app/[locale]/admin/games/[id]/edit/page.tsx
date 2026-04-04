"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useGameForm } from "@/hooks/useGameForm";
import { GameForm } from "@/components/admin/games/GameForm";
import { Button } from "@/components/ui/button";
import { AdminFormSkeleton } from "@/components/admin/shared/AdminFormSkeleton";
import { toast } from "@/hooks/use-toast";

import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import {
  type GameApiResponse,
  toFormData,
  extractCompaniesFromApi,
} from "@/lib/utils/game-api-transform";
import { Icon } from "@iconify/react";
import type { Company } from "@/types/admin-games";

/**
 * Inner component that mounts only when initialData is ready,
 * so useGameForm receives correct defaultValues on first render.
 */
function EditGameForm({
  initialData,
  gameId,
  igdbId,
  gameCompanies,
}: {
  initialData: AdminGameFormData;
  gameId: string;
  igdbId: number | null;
  gameCompanies: Company[];
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
    gamePlatforms,
    loadingOptions,
    submitGame,
    isSubmitting,
    refreshGamePlatforms,
  } = useGameForm("edit", initialData, gameId);

  // Track game-specific companies (may be updated after sync)
  const [localGameCompanies, setLocalGameCompanies] = useState(gameCompanies);

  // Merge reference companies with game-specific companies so assigned
  // companies always appear even if they are inactive in the reference list
  const mergedCompanies = useMemo(() => {
    const refIds = new Set(companies.map((c) => c.id));
    const missing = localGameCompanies.filter((gc) => !refIds.has(gc.id));
    return [...companies, ...missing];
  }, [companies, localGameCompanies]);

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
      setLocalGameCompanies(extractCompaniesFromApi(data));
      // Sync may have created new platforms — reload the reference list
      await refreshGamePlatforms();
    } catch {
      // Silently fail — overrides are already refreshed by the sync hook
    }
  }, [gameId, form, refreshGamePlatforms]);

  // Keep showing the same loading style until options are ready
  if (loadingOptions) {
    return <AdminFormSkeleton showHeroBanner tabs={13} fields={5} />;
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/games")}>
            <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
            {t("form.backToList")}
          </Button>
          <a
            href={`/fr/games/${initialData.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <Icon icon="fa:external-link" className="h-3 w-3" />
            {t("form.viewGame")}
          </a>
          {igdbId && (
            <a
              href={`https://www.igdb.com/games/${initialData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <Icon icon="simple-icons:igdb" className="h-3 w-3" />
              {t("form.viewOnIgdb")}
            </a>
          )}
        </div>
        <GameForm
          mode="edit"
          form={form}
          genres={genres}
          companies={mergedCompanies}
          ratings={ratings}
          contentDescriptors={contentDescriptors}
          supportedLanguages={supportedLanguages}
          stores={stores}
          currencies={currencies}
          platforms={platforms}
          gamePlatforms={gamePlatforms}
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
  const [gameCompanies, setGameCompanies] = useState<Company[]>([]);
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
          setGameCompanies(extractCompaniesFromApi(data));
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
    return <AdminFormSkeleton showHeroBanner tabs={13} fields={5} />;
  }

  if (loadError) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/games")}>
            <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
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
    <>
      {initialData && (
        <EditGameForm
          initialData={initialData}
          gameId={gameId}
          igdbId={igdbId}
          gameCompanies={gameCompanies}
        />
      )}
    </>
  );
}
