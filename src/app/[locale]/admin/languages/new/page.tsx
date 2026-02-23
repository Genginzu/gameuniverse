"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useLanguageForm } from "@/hooks/useLanguageForm";
import { LanguageForm } from "@/components/admin/languages/LanguageForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FaArrowLeft } from "react-icons/fa";
import type { LanguageFormData } from "@/lib/validations/admin-language-form";

export default function NewLanguagePage() {
  const t = useTranslations("admin.languages");
  const router = useRouter();
  const { form, submitLanguage, isSubmitting } = useLanguageForm("create");

  const handleSubmit = useCallback(
    async (data: LanguageFormData) => {
      try {
        await submitLanguage(data);
        toast({ title: t("createPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/languages"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("createPage.errorGeneric");
        const isDuplicate =
          message.toLowerCase().includes("duplicate") ||
          message.toLowerCase().includes("already exists") ||
          message.toLowerCase().includes("existe déjà");

        toast({
          title: isDuplicate ? t("createPage.errorDuplicate") : message,
          variant: "destructive",
        });
      }
    },
    [submitLanguage, router, t]
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/languages")}>
          <FaArrowLeft className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
      </div>

      <div className="mx-auto max-w-2xl">
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("createPage.title")}
        </h1>

        <LanguageForm
          mode="create"
          form={form}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
