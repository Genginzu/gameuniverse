"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useRatingForm } from "@/hooks/useRatingForm";
import { RatingForm } from "@/components/admin/age-classifications/RatingForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

import type { RatingFormData } from "@/lib/validations/admin-rating-form";
import { Icon } from "@iconify/react";

export default function NewRatingPage() {
  const t = useTranslations("admin.ageClassifications.ratings");
  const tParent = useTranslations("admin.ageClassifications");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const ratingSystemId = params.id;

  const { form, submitRating, isSubmitting, supportedLanguages } = useRatingForm(
    "create",
    ratingSystemId
  );

  const handleSubmit = useCallback(
    async (data: RatingFormData) => {
      try {
        await submitRating(data);
        toast({ title: t("toast.created"), variant: "success" });
        setTimeout(() => router.push(`/admin/age-classifications/${ratingSystemId}/edit`), 500);
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
    [submitRating, router, ratingSystemId]
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/age-classifications/${ratingSystemId}/edit`)}
        >
          <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
          Retour au système
        </Button>
      </div>

      <div className="mx-auto max-w-4xl">
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("newRatingTitle")}
        </h1>

        <RatingForm
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
