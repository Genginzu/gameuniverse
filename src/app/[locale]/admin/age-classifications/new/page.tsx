"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useRatingSystemForm } from "@/hooks/useRatingSystemForm";
import { RatingSystemForm } from "@/components/admin/age-classifications/RatingSystemForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

import type { RatingSystemFormData } from "@/lib/validations/admin-rating-system-form";
import { Icon } from "@iconify/react";

export default function NewRatingSystemPage() {
  const t = useTranslations("admin.ageClassifications");
  const router = useRouter();
  const { form, submitRatingSystem, isSubmitting } = useRatingSystemForm("create");

  const handleSubmit = useCallback(
    async (data: RatingSystemFormData) => {
      try {
        await submitRatingSystem(data);
        toast({ title: t("toast.systemCreated"), variant: "success" });
        setTimeout(() => router.push("/admin/age-classifications"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("toast.createError");
        const isDuplicate =
          message.toLowerCase().includes("already exists") ||
          message.toLowerCase().includes("existe déjà") ||
          message.toLowerCase().includes("duplicate");

        toast({
          title: isDuplicate ? t("toast.duplicateCode") : message,
          variant: "destructive",
        });
      }
    },
    [submitRatingSystem, router]
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/age-classifications")}>
          <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
          {t("backToList")}
        </Button>
      </div>

      <div className="mx-auto max-w-2xl">
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("newSystemTitle")}
        </h1>

        <RatingSystemForm
          mode="create"
          form={form}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
