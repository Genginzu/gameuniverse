"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AchievementForm } from "@/components/admin/achievements/AchievementForm";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { FaArrowLeft } from "react-icons/fa";
import type { AchievementFormData } from "@/lib/validations/admin-achievement-form";
import type { AdminAchievement } from "@/types/admin-achievements";

export default function EditAchievementPage() {
  const t = useTranslations("adminAchievements");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const achievementId = params.id;

  const [initialData, setInitialData] = useState<AdminAchievement | undefined>(undefined);
  const [loadingAchievement, setLoadingAchievement] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAchievement = async () => {
      try {
        const res = await fetch(`/api/admin/achievements/${encodeURIComponent(achievementId)}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) {
              toast({ title: t("editPage.notFound"), variant: "destructive" });
              router.push("/admin/achievements");
            }
            return;
          }
          if (mounted) setLoadError(t("editPage.errorGeneric"));
          return;
        }
        const json: { achievement: AdminAchievement } = await res.json();
        if (mounted) setInitialData(json.achievement);
      } catch {
        if (mounted) setLoadError(t("editPage.errorGeneric"));
      } finally {
        if (mounted) setLoadingAchievement(false);
      }
    };

    loadAchievement();
    return () => {
      mounted = false;
    };
  }, [achievementId, t, router]);

  const handleSubmit = useCallback(
    async (data: AchievementFormData) => {
      setIsSubmitting(true);
      try {
        const response = await fetch(
          `/api/admin/achievements/${encodeURIComponent(achievementId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          if (response.status === 409) {
            toast({ title: t("createPage.errorDuplicate"), variant: "destructive" });
            return;
          }
          throw new Error(body.error || t("editPage.errorGeneric"));
        }

        toast({ title: t("editPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/achievements"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("editPage.errorGeneric");
        toast({ title: message, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [achievementId, router, t]
  );

  if (loadingAchievement) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-gray-500 dark:text-gray-400">{t("editPage.loading")}</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/achievements")}>
            <FaArrowLeft className="mr-1 h-3 w-3" />
            {t("form.backToList")}
          </Button>
        </div>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/achievements")}>
          <FaArrowLeft className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
      </div>

      <div>
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("editPage.title")}
        </h1>

        {initialData && (
          <AchievementForm
            mode="edit"
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
