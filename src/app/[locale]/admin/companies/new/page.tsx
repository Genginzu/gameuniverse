"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCompanyForm } from "@/hooks/useCompanyForm";
import { CompanyForm } from "@/components/admin/companies/CompanyForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FaArrowLeft } from "react-icons/fa";
import type { CompanyFormData } from "@/lib/validations/admin-company-form";

export default function NewCompanyPage() {
  const t = useTranslations("admin.companies");
  const router = useRouter();
  const { form, submitCompany, isSubmitting, supportedLanguages } = useCompanyForm("create");

  const handleSubmit = useCallback(
    async (data: CompanyFormData) => {
      try {
        await submitCompany(data);
        toast({ title: t("createPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/companies"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("createPage.errorGeneric");
        const isDuplicate =
          message.toLowerCase().includes("already exists") ||
          message.toLowerCase().includes("existe déjà");

        toast({
          title: isDuplicate ? t("createPage.errorDuplicate") : message,
          variant: "destructive",
        });
      }
    },
    [submitCompany, router, t]
  );

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
          {t("createPage.title")}
        </h1>

        <CompanyForm
          mode="create"
          form={form}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          supportedLanguages={supportedLanguages}
        />
      </div>
    </div>
  );
}
