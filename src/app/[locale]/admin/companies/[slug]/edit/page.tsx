"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCompanyForm } from "@/hooks/useCompanyForm";
import { CompanyForm } from "@/components/admin/companies/CompanyForm";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { FaArrowLeft } from "react-icons/fa";
import type { CompanyFormData } from "@/lib/validations/admin-company-form";
import type { AdminCompany } from "@/types/admin-companies";

/**
 * Inner component that mounts only when initialData is ready,
 * so useCompanyForm receives correct defaultValues on first render.
 */
function EditCompanyForm({ initialData }: { initialData: CompanyFormData }) {
  const t = useTranslations("admin.companies");
  const router = useRouter();

  const { form, submitCompany, isSubmitting, supportedLanguages } = useCompanyForm(
    "edit",
    initialData
  );

  const handleSubmit = useCallback(
    async (data: CompanyFormData) => {
      try {
        await submitCompany(data);
        toast({ title: t("editPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/companies"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("editPage.errorGeneric");
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitCompany, router, t]
  );

  return (
    <CompanyForm
      mode="edit"
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      supportedLanguages={supportedLanguages}
    />
  );
}

export default function EditCompanyPage() {
  const t = useTranslations("admin.companies");
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [initialData, setInitialData] = useState<CompanyFormData | undefined>(undefined);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCompany = async () => {
      try {
        const res = await fetch(`/api/admin/companies/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) {
              toast({ title: t("editPage.notFound"), variant: "destructive" });
              router.push("/admin/companies");
            }
            return;
          }
          if (mounted) setLoadError(t("editPage.errorGeneric"));
          return;
        }
        const json: { company: AdminCompany } = await res.json();
        if (mounted) {
          setInitialData({
            slug: json.company.slug,
            name: json.company.name,
            company_type: json.company.company_type,
            website_url: json.company.website_url ?? "",
            logo_url: json.company.logo_url ?? "",
            founded_year: json.company.founded_year ?? undefined,
            headquarters: json.company.headquarters ?? "",
            translations: (json.company.translations ?? []).map((tr) => ({
              language_code: tr.language_code,
              description: tr.description ?? "",
            })),
          });
        }
      } catch {
        if (mounted) setLoadError(t("editPage.errorGeneric"));
      } finally {
        if (mounted) setLoadingCompany(false);
      }
    };

    loadCompany();
    return () => {
      mounted = false;
    };
  }, [slug, t, router]);

  if (loadingCompany) {
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
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/companies")}>
            <FaArrowLeft className="mr-1 h-3 w-3" />
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
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/companies")}>
          <FaArrowLeft className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
      </div>

      <div>
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("editPage.title")}
        </h1>

        {initialData && <EditCompanyForm initialData={initialData} />}
      </div>
    </div>
  );
}
