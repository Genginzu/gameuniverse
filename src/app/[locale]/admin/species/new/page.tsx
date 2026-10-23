"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminEntityForm } from "@/hooks/useAdminEntityForm";
import { speciesForm } from "@/lib/admin-resource/forms/translatedForms";
import { SpeciesForm } from "@/components/admin/species/SpeciesForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { isDuplicateErrorMessage } from "@/lib/utils/duplicateError";
import type { SpeciesFormData } from "@/lib/validations/admin-species-form";
import { Icon } from "@iconify/react";

export default function NewSpeciesPage() {
  const t = useTranslations("admin.species");
  const router = useRouter();
  const {
    form,
    submit: submitSpecies,
    isSubmitting,
    supportedLanguages,
  } = useAdminEntityForm(speciesForm, "create");

  const handleSubmit = useCallback(
    async (data: SpeciesFormData) => {
      try {
        await submitSpecies(data);
        toast({ title: t("createPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/species"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("createPage.errorGeneric");
        const isDuplicate = isDuplicateErrorMessage(message);

        toast({
          title: isDuplicate ? t("createPage.errorDuplicate") : message,
          variant: "destructive",
        });
      }
    },
    [submitSpecies, router, t]
  );

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
          {t("createPage.title")}
        </h1>

        <SpeciesForm
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
