"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useGenderForm } from "@/hooks/useGenderForm";
import { GenderForm } from "@/components/admin/genders/GenderForm";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import type { GenderFormData } from "@/lib/validations/admin-gender-form";
import { Icon } from "@iconify/react";

function EditGenderForm({
  initialData,
  genderId,
}: {
  initialData: GenderFormData;
  genderId: string;
}) {
  const t = useTranslations("admin.genders");
  const router = useRouter();

  const { form, submitGender, isSubmitting, supportedLanguages } = useGenderForm(
    "edit",
    initialData,
    genderId
  );

  const handleSubmit = useCallback(
    async (data: GenderFormData) => {
      try {
        await submitGender(data);
        toast({ title: t("editPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/genders"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("editPage.errorGeneric");
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitGender, router, t]
  );

  return (
    <GenderForm
      mode="edit"
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      supportedLanguages={supportedLanguages}
    />
  );
}

export default function EditGenderPage() {
  const t = useTranslations("admin.genders");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const genderId = params.id;

  const [initialData, setInitialData] = useState<GenderFormData | undefined>(undefined);
  const [loadingGender, setLoadingGender] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadGender = async () => {
      try {
        const res = await fetch(`/api/admin/genders/${encodeURIComponent(genderId)}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) {
              toast({ title: t("editPage.notFound"), variant: "destructive" });
              router.push("/admin/genders");
            }
            return;
          }
          if (mounted) setLoadError(t("editPage.errorGeneric"));
          return;
        }
        const json = await res.json();
        if (mounted) {
          setInitialData({
            slug: json.gender.slug,
            translations: (json.gender.translations ?? []).map(
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
        if (mounted) setLoadingGender(false);
      }
    };

    loadGender();
    return () => {
      mounted = false;
    };
  }, [genderId, t, router]);

  if (loadingGender) {
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
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/genders")}>
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
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/genders")}>
          <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
      </div>

      <div>
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("editPage.title")}
        </h1>

        {initialData && <EditGenderForm initialData={initialData} genderId={genderId} />}
      </div>
    </div>
  );
}
