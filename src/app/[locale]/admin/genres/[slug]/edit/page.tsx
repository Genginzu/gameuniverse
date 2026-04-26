"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useGenreForm } from "@/hooks/useGenreForm";
import { GenreForm } from "@/components/admin/genres/GenreForm";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";

import type { GenreFormData } from "@/lib/validations/admin-genre-form";
import type { AdminGenre } from "@/types/admin-genres";
import { Icon } from "@iconify/react";

/**
 * Inner component that mounts only when initialData is ready,
 * so useGenreForm receives correct defaultValues on first render.
 */
function EditGenreForm({ initialData }: { initialData: GenreFormData }) {
  const t = useTranslations("admin.genres");
  const router = useRouter();

  const { form, submitGenre, isSubmitting, supportedLanguages } = useGenreForm("edit", initialData);

  const handleSubmit = useCallback(
    async (data: GenreFormData) => {
      try {
        await submitGenre(data);
        toast({ title: t("editPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/genres"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("editPage.errorGeneric");
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitGenre, router, t]
  );

  return (
    <GenreForm
      mode="edit"
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      supportedLanguages={supportedLanguages}
    />
  );
}

export default function EditGenrePage() {
  const t = useTranslations("admin.genres");
  const _tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [initialData, setInitialData] = useState<GenreFormData | undefined>(undefined);
  const [loadingGenre, setLoadingGenre] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadGenre = async () => {
      try {
        const res = await fetch(`/api/admin/genres/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) {
              toast({ title: t("editPage.notFound"), variant: "destructive" });
              router.push("/admin/genres");
            }
            return;
          }
          if (mounted) setLoadError(t("editPage.errorGeneric"));
          return;
        }
        const json: { genre: AdminGenre } = await res.json();
        if (mounted) {
          setInitialData({
            slug: json.genre.slug,
            translations: json.genre.translations.map((tr) => ({
              language_code: tr.language_code,
              name: tr.name,
              description: tr.description ?? "",
            })),
          });
        }
      } catch {
        if (mounted) setLoadError(t("editPage.errorGeneric"));
      } finally {
        if (mounted) setLoadingGenre(false);
      }
    };

    loadGenre();
    return () => {
      mounted = false;
    };
  }, [slug, t, router]);

  if (loadingGenre) {
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
        <div className="mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/genres")}>
            <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
            {t("form.backToList")}
          </Button>
        </div>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/genres")}>
          <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
      </div>

      <div>
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("editPage.title")}
        </h1>

        {initialData && <EditGenreForm initialData={initialData} />}
      </div>
    </div>
  );
}
