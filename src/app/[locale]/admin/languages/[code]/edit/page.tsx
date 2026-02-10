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
import { FaArrowLeft } from "react-icons/fa";
import type { LanguageFormData } from "@/lib/validations/admin-language-form";

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
    <div className="mx-auto max-w-2xl">
      <LanguageForm mode="edit" form={form} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}

export default function EditLanguagePage() {
  const t = useTranslations("admin.languages");
  const tCommon = useTranslations("common");
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
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-500">{tCommon("loading")}</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/languages")}>
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
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/languages")}>
          <FaArrowLeft className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("editPage.title")}</h1>
      </div>

      {initialData && <EditLanguageForm initialData={initialData} />}
    </div>
  );
}
