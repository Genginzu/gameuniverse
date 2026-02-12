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
  background_image_url: string | null;
  release_date: string | null;
  metascore: number | null;
  playtime_hastily: number | null;
  playtime_normally: number | null;
  playtime_completely: number | null;
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
  screenshots: Array<{
    url: string;
    alt_text: string | null;
    caption: string | null;
    display_order: number | null;
    is_featured: boolean;
  }>;
  artwork: Array<{
    url: string;
    alt_text: string | null;
    caption: string | null;
    artwork_type: string | null;
    display_order: number | null;
    is_featured: boolean;
  }>;
  game_ratings: Array<{
    rating_id: string;
    is_primary: boolean;
    content_descriptors: string[];
  }>;
  versions: Array<{
    version_title: string;
    description: string | null;
    cover_image_url: string | null;
    display_order: number | null;
  }>;
  languages: Array<{
    language_code: string;
    language_name: string;
    has_audio: boolean;
    has_subtitles: boolean;
    has_interface: boolean;
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
    background_image_url: game.background_image_url ?? "",
    release_date: game.release_date ?? "",
    metascore: game.metascore ?? "",
    playtime_hastily: game.playtime_hastily ?? "",
    playtime_normally: game.playtime_normally ?? "",
    playtime_completely: game.playtime_completely ?? "",
    genres: game.genres.map((g) => ({ genre_id: g.genre_id })),
    companies: game.companies.map((c) => ({
      company_id: c.company_id,
      role: c.role as "developer" | "publisher",
      is_primary: c.is_primary,
    })),
    screenshots: (game.screenshots ?? []).map((s) => ({
      url: s.url,
      alt_text: s.alt_text ?? "",
      caption: s.caption ?? "",
      display_order: s.display_order,
      is_featured: s.is_featured,
    })),
    artwork: (game.artwork ?? []).map((a) => ({
      url: a.url,
      alt_text: a.alt_text ?? "",
      caption: a.caption ?? "",
      artwork_type: a.artwork_type ?? "",
      display_order: a.display_order,
      is_featured: a.is_featured,
    })),
    age_ratings: (game.game_ratings ?? []).map((r) => ({
      rating_id: r.rating_id,
      is_primary: r.is_primary,
      content_descriptors: r.content_descriptors ?? [],
    })),
    versions: (game.versions ?? []).map((v) => ({
      version_title: v.version_title,
      description: v.description ?? "",
      cover_image_url: v.cover_image_url ?? "",
      display_order: v.display_order,
    })),
    languages: (game.languages ?? []).map((l) => ({
      language_code: l.language_code,
      language_name: l.language_name,
      has_audio: l.has_audio,
      has_subtitles: l.has_subtitles,
      has_interface: l.has_interface,
    })),
  };
}

/**
 * Inner component that mounts only when initialData is ready,
 * so useGameForm receives correct defaultValues on first render.
 */
function EditGameForm({ initialData, gameId }: { initialData: AdminGameFormData; gameId: string }) {
  const t = useTranslations("admin.games");
  const router = useRouter();

  const {
    form,
    genres,
    companies,
    ratings,
    contentDescriptors,
    supportedLanguages,
    loadingOptions,
    submitGame,
    isSubmitting,
  } = useGameForm("edit", initialData, gameId);

  const handleSubmit = useCallback(
    async (data: AdminGameFormData) => {
      try {
        await submitGame(data);
        toast({ title: t("editPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/games"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("editPage.errorGeneric");
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitGame, router, t]
  );

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
          loadingOptions={loadingOptions}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
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

  return <>{initialData && <EditGameForm initialData={initialData} gameId={gameId} />}</>;
}
