"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRoleForm } from "@/hooks/useRoleForm";
import { RoleForm } from "@/components/admin/roles/RoleForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { RoleFormData } from "@/lib/validations/admin-role-form";
import { Icon } from "@iconify/react";

export default function NewRolePage() {
  const t = useTranslations("admin.characterRoles");
  const router = useRouter();
  const { form, submitRole, isSubmitting, supportedLanguages } = useRoleForm("create");

  const handleSubmit = useCallback(
    async (data: RoleFormData) => {
      try {
        await submitRole(data);
        toast({ title: t("createPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/roles"), 500);
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
    [submitRole, router, t]
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/roles")}>
          <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
      </div>
      <div>
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("createPage.title")}
        </h1>
        <RoleForm
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
