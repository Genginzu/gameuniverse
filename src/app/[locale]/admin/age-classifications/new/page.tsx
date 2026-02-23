"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useRatingSystemForm } from "@/hooks/useRatingSystemForm";
import { RatingSystemForm } from "@/components/admin/age-classifications/RatingSystemForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FaArrowLeft } from "react-icons/fa";
import type { RatingSystemFormData } from "@/lib/validations/admin-rating-system-form";

export default function NewRatingSystemPage() {
  const router = useRouter();
  const { form, submitRatingSystem, isSubmitting } = useRatingSystemForm("create");

  const handleSubmit = useCallback(
    async (data: RatingSystemFormData) => {
      try {
        await submitRatingSystem(data);
        toast({ title: "Système créé avec succès", variant: "success" });
        setTimeout(() => router.push("/admin/age-classifications"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors de la création";
        const isDuplicate =
          message.toLowerCase().includes("already exists") ||
          message.toLowerCase().includes("existe déjà") ||
          message.toLowerCase().includes("duplicate");

        toast({
          title: isDuplicate ? "Un système avec ce code existe déjà" : message,
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
          <FaArrowLeft className="mr-1 h-3 w-3" />
          Retour à la liste
        </Button>
      </div>

      <div className="mx-auto max-w-2xl">
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Nouveau système de classification
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
