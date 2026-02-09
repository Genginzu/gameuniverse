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

interface GameApiResponse {
  id: string;
  slug: string;
  cover_image_url: string | null;
  release_date: string | null;
  translations: Array<{
    language_code: string;
    title: string;
    description: string | null;
  }>;
  genres: Array<{ genre_id: string }>;
  companies: Array<{
    company_id: string;
    role: string;
    is_primary: boolean;
  }>;
}

function toFormData(game: GameApiResponse): AdminGameFormData {
  return {
    slug: game.slug,
    translations: game.translations.map((t) => ({
      language_code: t.language_code,
      title: t.title,
      description: t.description ?? "",
    })),
    cover_image_url: game.cover_image_url ?? "",
    release_date: game.release_date ?? "",
    genres: game.genres.map((g) => ({ genre_id: g.genre_id })),
    companies: game.companies.map((c) => ({
      company_id: c.company_id,
      role: c.role as "developer" | "publisher",
      is_primary: c.is_primary,
    })),
  };
}

export default function EditGamePage() {
  const t = useTranslations("admin.games");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const gameId = params.id;

  const [initialData, setInitialData] = useState<AdminGameFormData | undefined>(undefined);
  const [loadingGame, setLoadingGame] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { form, genres, companies, loadingOptions, submitGame, isSubmitting } = useGameForm(
    "edit",
    initialData,
    gameId
  );

  // Fetch existing game data
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

  const handleSubmit = useCallback(
    async (data: AdminGameFormData) => {
      try {
        await submitGame(data);
        toast({ title: t("editPage.success") });
        router.push("/admin/games");
      } catch (err) {
        const message = err instanceof Error ? err.message : t("editPage.errorGeneric");
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitGame, router, t]
  );

  if (loadingGame) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-500">{t("editPage.loading")}</span>
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
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/games")}>
          <FaArrowLeft className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("editPage.title")}</h1>
      </div>

      <div className="mx-auto max-w-3xl">
        <GameForm
          mode="edit"
          form={form}
          genres={genres}
          companies={companies}
          loadingOptions={loadingOptions}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
