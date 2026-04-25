"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useLanguageForm } from "@/hooks/useLanguageForm";
import { LanguageForm } from "@/components/admin/languages/LanguageForm";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";

import type { LanguageFormData } from "@/lib/validations/admin-language-form";
import { Icon } from "@iconify/react";

interface LanguageApiResponse {
  code: string;
  name: string;
  native_name: string | null;
}

/**
 * Inner component that mounts only when initialData is ready,
 * so useLanguageForm receives correct defaultValues on first render.
 */
function EditLanguageForm({ initialData }: { initialData: LanguageFormData }) {
  const t = useTranslations("admin.languages");
  const router = useRouter();

  const { form, submitLanguage, isSubmitting } = useLanguageForm("edit", initialData);

  const handleSubmit = useCallback(
    async (data: LanguageFormData) => {
      try {
        await submitLanguage(data);
        toast({ title: t("editPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/languages"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("editPage.errorGeneric");
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitLanguage, router, t]
  );

  return (
    <LanguageForm mode="edit" form={form} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
  );
}

export default function EditLanguagePage() {
  const t = useTranslations("admin.languages");
  const _tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [initialData, setInitialData] = useState<LanguageFormData | undefined>(undefined);
  const [loadingLanguage, setLoadingLanguage] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadLanguage = async () => {
      try {
        const res = await fetch(`/api/admin/languages/${code}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) {
              toast({ title: t("editPage.notFound"), variant: "destructive" });
              router.push("/admin/languages");
            }
            return;
          }
          if (mounted) setLoadError(t("editPage.errorGeneric"));
          return;
        }
        const data: { language: LanguageApiResponse } = await res.json();
        if (mounted) {
          setInitialData({
            code: data.language.code,
            name: data.language.name,
            native_name: data.language.native_name ?? "",
          });
        }
      } catch {
        if (mounted) setLoadError(t("editPage.errorGeneric"));
      } finally {
        if (mounted) setLoadingLanguage(false);
      }
    };

    loadLanguage();
    return () => {
      mounted = false;
    };
  }, [code, t, router]);

  if (loadingLanguage) {
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
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/languages")}>
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
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/languages")}>
          <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
      </div>

      <div className="mx-auto max-w-2xl">
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("editPage.title")}
        </h1>

        {initialData && <EditLanguageForm initialData={initialData} />}
      </div>
    </div>
  );
}
