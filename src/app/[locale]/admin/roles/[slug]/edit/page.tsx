"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRoleForm } from "@/hooks/useRoleForm";
import { RoleForm } from "@/components/admin/roles/RoleForm";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import type { RoleFormData } from "@/lib/validations/admin-role-form";
import type { AdminRole } from "@/types/admin-roles";
import { Icon } from "@iconify/react";

function EditRoleForm({ initialData }: { initialData: RoleFormData }) {
  const t = useTranslations("admin.characterRoles");
  const router = useRouter();
  const { form, submitRole, isSubmitting, supportedLanguages } = useRoleForm("edit", initialData);

  const handleSubmit = useCallback(
    async (data: RoleFormData) => {
      try {
        await submitRole(data);
        toast({ title: t("editPage.success"), variant: "success" });
        setTimeout(() => router.push("/admin/roles"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("editPage.errorGeneric");
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitRole, router, t]
  );

  return (
    <RoleForm
      mode="edit"
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      supportedLanguages={supportedLanguages}
    />
  );
}

export default function EditRolePage() {
  const t = useTranslations("admin.characterRoles");
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [initialData, setInitialData] = useState<RoleFormData | undefined>(undefined);
  const [loadingRole, setLoadingRole] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadRole = async () => {
      try {
        const res = await fetch(`/api/admin/roles/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) {
              toast({ title: t("editPage.notFound"), variant: "destructive" });
              router.push("/admin/roles");
            }
            return;
          }
          if (mounted) setLoadError(t("editPage.errorGeneric"));
          return;
        }
        const json: { role: AdminRole } = await res.json();
        if (mounted) {
          setInitialData({
            slug: json.role.slug,
            translations: json.role.translations.map((tr) => ({
              language_code: tr.language_code,
              name: tr.name,
              description: tr.description ?? "",
            })),
          });
        }
      } catch {
        if (mounted) setLoadError(t("editPage.errorGeneric"));
      } finally {
        if (mounted) setLoadingRole(false);
      }
    };
    loadRole();
    return () => {
      mounted = false;
    };
  }, [slug, t, router]);

  if (loadingRole) {
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
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/roles")}>
            <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
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
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/roles")}>
          <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
      </div>
      <div>
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("editPage.title")}
        </h1>
        {initialData && <EditRoleForm initialData={initialData} />}
      </div>
    </div>
  );
}
