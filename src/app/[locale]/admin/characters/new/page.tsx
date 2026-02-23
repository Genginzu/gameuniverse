"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCharacterForm } from "@/hooks/useCharacterForm";
import { CharacterForm } from "@/components/admin/characters/CharacterForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FaArrowLeft } from "react-icons/fa";
import type { AdminCharacterFormData } from "@/lib/validations/admin-character-form";

export default function NewCharacterPage() {
  const t = useTranslations("admin.characters");
  const router = useRouter();
  const {
    form,
    availableGames,
    availableCharacters,
    loadingOptions,
    submitCharacter,
    isSubmitting,
  } = useCharacterForm("create");

  const handleSubmit = useCallback(
    async (data: AdminCharacterFormData) => {
      try {
        await submitCharacter(data);
        toast({ title: t("createPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/characters"), 500);
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
    [submitCharacter, router, t]
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/characters")}>
          <FaArrowLeft className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">
          {t("createPage.title")}
        </h1>
      </div>

      <div className="mx-auto max-w-7xl">
        <CharacterForm
          mode="create"
          form={form}
          availableGames={availableGames}
          availableCharacters={availableCharacters}
          loadingOptions={loadingOptions}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
