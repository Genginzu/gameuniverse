"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useGenderForm } from "@/hooks/useGenderForm";
import { GenderForm } from "@/components/admin/genders/GenderForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { GenderFormData } from "@/lib/validations/admin-gender-form";
import { Icon } from "@iconify/react";

export default function NewGenderPage() {
  const t = useTranslations("admin.genders");
  const router = useRouter();
  const { form, submitGender, isSubmitting, supportedLanguages } = useGenderForm("create");

  const handleSubmit = useCallback(
    async (data: GenderFormData) => {
      try {
        await submitGender(data);
        toast({ title: t("createPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/genders"), 500);
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
    [submitGender, router, t]
  );

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
          {t("createPage.title")}
        </h1>

        <GenderForm
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
