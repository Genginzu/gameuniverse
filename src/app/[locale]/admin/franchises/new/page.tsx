"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { FranchiseForm } from "@/components/admin/franchises/FranchiseForm";
import { Button } from "@/components/ui/button";
import { useAdminEntityForm } from "@/hooks/useAdminEntityForm";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/navigation";
import { franchiseForm } from "@/lib/admin-resource/forms/franchiseForm";
import { isDuplicateErrorMessage } from "@/lib/utils/duplicateError";
import type { FranchiseFormData } from "@/lib/validations/admin-franchise-form";

export default function NewFranchisePage() {
  const t = useTranslations("admin.franchises");
  const router = useRouter();
  const { form, submit, isSubmitting, supportedLanguages } = useAdminEntityForm(franchiseForm, "create");

  const handleSubmit = useCallback(
    async (data: FranchiseFormData) => {
      try {
        await submit(data);
        toast({ title: t("createPage.success"), variant: "success" });
        router.push("/admin/franchises");
      } catch (err) {
        const message = err instanceof Error ? err.message : t("createPage.errorGeneric");
        toast({
          title: isDuplicateErrorMessage(message) ? t("createPage.errorDuplicate") : message,
          variant: "destructive",
        });
      }
    },
    [submit, router, t]
  );

  return (
    <div className="p-4 lg:p-6">
      <Button variant="ghost" size="sm" className="mb-2 min-h-11" onClick={() => router.push("/admin/franchises")}>
        <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
        {t("form.backToList")}
      </Button>
      <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t("createPage.title")}</h1>
      <FranchiseForm
        mode="create"
        form={form}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        supportedLanguages={supportedLanguages}
      />
    </div>
  );
}
