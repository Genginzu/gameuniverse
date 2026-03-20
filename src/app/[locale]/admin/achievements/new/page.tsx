"use client";

import { useCallback, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AchievementForm } from "@/components/admin/achievements/AchievementForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

import type { AchievementFormData } from "@/lib/validations/admin-achievement-form";
import { Icon } from "@iconify/react";

export default function NewAchievementPage() {
  const t = useTranslations("adminAchievements");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (data: AchievementFormData) => {
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/admin/achievements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          if (response.status === 409) {
            toast({ title: t("createPage.errorDuplicate"), variant: "destructive" });
            return;
          }
          throw new Error(body.error || t("createPage.errorGeneric"));
        }

        toast({ title: t("createPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/achievements"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("createPage.errorGeneric");
        toast({ title: message, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, t]
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/achievements")}>
          <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3"  />
          {t("form.backToList")}
        </Button>
      </div>

      <div>
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("createPage.title")}
        </h1>

        <AchievementForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
