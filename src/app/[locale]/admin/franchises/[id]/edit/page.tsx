"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { FranchiseForm } from "@/components/admin/franchises/FranchiseForm";
import { FranchiseGamesManager } from "@/components/admin/franchises/FranchiseGamesManager";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAdminEntityForm } from "@/hooks/useAdminEntityForm";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/navigation";
import { franchiseForm } from "@/lib/admin-resource/forms/franchiseForm";
import { isDuplicateErrorMessage } from "@/lib/utils/duplicateError";
import { fetcher } from "@/lib/swr/fetcher";
import type { FranchiseFormData } from "@/lib/validations/admin-franchise-form";
import type { AdminFranchise } from "@/types/admin-franchises";

function EditFranchiseForm({ franchise }: { franchise: AdminFranchise }) {
  const t = useTranslations("admin.franchises");
  const router = useRouter();
  const initialData: FranchiseFormData = {
    name: franchise.name,
    slug: franchise.slug,
    translations: franchise.translations,
  };
  const { form, submit, isSubmitting, supportedLanguages } = useAdminEntityForm(franchiseForm, "edit", {
    initialData,
    id: franchise.id,
  });

  const handleSubmit = useCallback(
    async (data: FranchiseFormData) => {
      try {
        await submit(data);
        toast({ title: t("editPage.success"), variant: "success" });
        router.push("/admin/franchises");
      } catch (err) {
        const message = err instanceof Error ? err.message : t("editPage.errorGeneric");
        toast({
          title: isDuplicateErrorMessage(message) ? t("createPage.errorDuplicate") : message,
          variant: "destructive",
        });
      }
    },
    [submit, router, t]
  );

  return (
    <FranchiseForm
      mode="edit"
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      supportedLanguages={supportedLanguages}
    />
  );
}

export default function EditFranchisePage() {
  const t = useTranslations("admin.franchises");
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data, error, isLoading } = useSWR<{ franchise: AdminFranchise }>(
    `/api/admin/franchises/${encodeURIComponent(id)}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return (
    <div className="p-4 lg:p-6">
      <Button variant="ghost" size="sm" className="mb-2 min-h-11" onClick={() => router.push("/admin/franchises")}>
        <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
        {t("form.backToList")}
      </Button>
      <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t("editPage.title")}</h1>
      {isLoading ? (
        <div className="flex items-center gap-3 py-12">
          <LoadingSpinner size="lg" />
          <span className="text-gray-500 dark:text-gray-400">{t("editPage.loading")}</span>
        </div>
      ) : error || !data ? (
        <p className="rounded-xl border border-red-200 bg-red-50/60 p-6 text-center text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {t("editPage.errorGeneric")}
        </p>
      ) : (
        <div className="space-y-6">
          <EditFranchiseForm franchise={data.franchise} />
          <FranchiseGamesManager franchiseId={data.franchise.id} />
        </div>
      )}
    </div>
  );
}
