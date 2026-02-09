"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useGameForm } from "@/hooks/useGameForm";
import { GameForm } from "@/components/admin/games/GameForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FaArrowLeft } from "react-icons/fa";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";

export default function NewGamePage() {
  const t = useTranslations("admin.games");
  const router = useRouter();
  const {
    form,
    genres,
    companies,
    ratings,
    contentDescriptors,
    supportedLanguages,
    loadingOptions,
    submitGame,
    isSubmitting,
  } = useGameForm("create");

  const handleSubmit = useCallback(
    async (data: AdminGameFormData) => {
      try {
        await submitGame(data);
        toast({
          title: t("createPage.success"),
        });
        router.push("/admin/games");
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
    [submitGame, router, t]
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/games")}>
          <FaArrowLeft className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("createPage.title")}
        </h1>
      </div>

      <div className="mx-auto max-w-7xl">
        <GameForm
          mode="create"
          form={form}
          genres={genres}
          companies={companies}
          ratings={ratings}
          contentDescriptors={contentDescriptors}
          supportedLanguages={supportedLanguages}
          loadingOptions={loadingOptions}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
