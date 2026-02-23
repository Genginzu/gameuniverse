"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useRatingForm } from "@/hooks/useRatingForm";
import { RatingForm } from "@/components/admin/age-classifications/RatingForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FaArrowLeft } from "react-icons/fa";
import type { RatingFormData } from "@/lib/validations/admin-rating-form";

export default function NewRatingPage() {
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
        toast({ title: "Note créée avec succès", variant: "success" });
        setTimeout(() => router.push(`/admin/age-classifications/${ratingSystemId}/edit`), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors de la création";
        const isDuplicate =
          message.toLowerCase().includes("already exists") ||
          message.toLowerCase().includes("existe déjà") ||
          message.toLowerCase().includes("duplicate");

        toast({
          title: isDuplicate ? "Une note avec ce code existe déjà" : message,
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
          <FaArrowLeft className="mr-1 h-3 w-3" />
          Retour au système
        </Button>
      </div>

      <div className="mx-auto max-w-4xl">
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Nouvelle note
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
