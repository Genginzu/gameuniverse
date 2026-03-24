"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSpeciesForm } from "@/hooks/useSpeciesForm";
import { SpeciesForm } from "@/components/admin/species/SpeciesForm";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import type { SpeciesFormData } from "@/lib/validations/admin-species-form";
import { Icon } from "@iconify/react";

function EditSpeciesForm({
  initialData,
  speciesId,
}: {
  initialData: SpeciesFormData;
  speciesId: string;
}) {
  const t = useTranslations("admin.species");
  const router = useRouter();

  const { form, submitSpecies, isSubmitting, supportedLanguages } = useSpeciesForm(
    "edit",
    initialData,
    speciesId
  );

  const handleSubmit = useCallback(
    async (data: SpeciesFormData) => {
      try {
        await submitSpecies(data);
        toast({ title: t("editPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/species"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("editPage.errorGeneric");
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitSpecies, router, t]
  );

  return (
    <SpeciesForm
      mode="edit"
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      supportedLanguages={supportedLanguages}
    />
  );
}

export default function EditSpeciesPage() {
  const t = useTranslations("admin.species");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const speciesId = params.id;

  const [initialData, setInitialData] = useState<SpeciesFormData | undefined>(undefined);
  const [loadingSpecies, setLoadingSpecies] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSpecies = async () => {
      try {
        const res = await fetch(`/api/admin/species/${encodeURIComponent(speciesId)}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) {
              toast({ title: t("editPage.notFound"), variant: "destructive" });
              router.push("/admin/species");
            }
            return;
          }
          if (mounted) setLoadError(t("editPage.errorGeneric"));
          return;
        }
        const json = await res.json();
        if (mounted) {
          setInitialData({
            slug: json.species.slug,
            translations: (json.species.translations ?? []).map(
              (tr: { language_code: string; name: string }) => ({
                language_code: tr.language_code,
                name: tr.name,
              })
            ),
          });
        }
      } catch {
        if (mounted) setLoadError(t("editPage.errorGeneric"));
      } finally {
        if (mounted) setLoadingSpecies(false);
      }
    };

    loadSpecies();
    return () => {
      mounted = false;
    };
  }, [speciesId, t, router]);

  if (loadingSpecies) {
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
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/species")}>
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
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/species")}>
          <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
      </div>

      <div>
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("editPage.title")}
        </h1>

        {initialData && <EditSpeciesForm initialData={initialData} speciesId={speciesId} />}
      </div>
    </div>
  );
}
