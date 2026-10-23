"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { descriptorsResource } from "@/lib/admin-resource/resources/descriptors";
import { useAdminEntityForm } from "@/hooks/useAdminEntityForm";
import { descriptorForm } from "@/lib/admin-resource/forms/ageClassificationForms";
import { DescriptorsTable } from "./DescriptorsTable";
import { DescriptorForm } from "./DescriptorForm";
import { AdminDeleteDialog } from "@/components/admin/shared/AdminDeleteDialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

import type { AdminContentDescriptor } from "@/types/admin-age-classifications";
import type { DescriptorFormData } from "@/lib/validations/admin-descriptor-form";
import { Icon } from "@iconify/react";

interface DescriptorsTabProps {
  ratingSystemId: string;
}

export function DescriptorsTab({ ratingSystemId }: DescriptorsTabProps) {
  const t = useTranslations("admin.ageClassifications.descriptors");
  const descriptors = useAdminResource(descriptorsResource, { pathParams: { ratingSystemId } });
  const deletion = useAdminDeleteFlow(descriptors, {
    onDeleted: () => toast({ title: t("toast.deleted"), variant: "success" }),
    onError: () => toast({ title: t("toast.deleteError"), variant: "destructive" }),
  });
  const { revalidate } = descriptors;

  const [editingDescriptor, setEditingDescriptor] = useState<AdminContentDescriptor | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const formMode = editingDescriptor ? "edit" : "create";
  const {
    form,
    submit: submitDescriptor,
    isSubmitting,
  } = useAdminEntityForm(descriptorForm, formMode, {
    pathParams: { ratingSystemId },
    id: editingDescriptor?.id,
    initialData: editingDescriptor
      ? {
          code: editingDescriptor.code,
          icon_url: editingDescriptor.icon_url ?? "",
          translations: editingDescriptor.translations.map((t) => ({
            language_code: t.language_code,
            name: t.name,
            description: t.description ?? "",
          })),
        }
      : undefined,
  });

  const handleFormSubmit = useCallback(
    async (data: DescriptorFormData) => {
      try {
        await submitDescriptor(data);
        toast({
          title: editingDescriptor ? t("toast.updated") : t("toast.created"),
          variant: "success",
        });
        setEditingDescriptor(null);
        setIsCreating(false);
        revalidate();
      } catch (err) {
        const message = err instanceof Error ? err.message : t("toast.error");
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitDescriptor, editingDescriptor, revalidate, t]
  );

  const handleEdit = useCallback((descriptor: AdminContentDescriptor) => {
    setIsCreating(false);
    setEditingDescriptor(descriptor);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingDescriptor(null);
    setIsCreating(true);
    form.reset({
      code: "",
      icon_url: "",
      translations: [{ language_code: "", name: "", description: "" }],
    });
  }, [form]);

  const handleCancel = useCallback(() => {
    setEditingDescriptor(null);
    setIsCreating(false);
  }, []);

  const showForm = isCreating || editingDescriptor !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("title")}</h2>
        {!showForm && (
          <Button size="sm" onClick={handleCreate}>
            <Icon icon="fa:plus" className="h-3 w-3" />
            {t("newDescriptor")}
          </Button>
        )}
      </div>

      {showForm && (
        <div className="border-palette-primary-200 bg-palette-primary-50/50 dark:border-palette-primary-800 dark:bg-palette-primary-900/20 rounded-xl border p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {editingDescriptor ? t("editTitle", { code: editingDescriptor.code }) : t("newTitle")}
            </h3>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              {t("cancel")}
            </Button>
          </div>
          <DescriptorForm
            mode={formMode}
            form={form}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      <DescriptorsTable
        descriptors={descriptors.rows}
        onSearch={descriptors.setSearch}
        onEdit={handleEdit}
        onDelete={deletion.request}
        isLoading={descriptors.isLoading}
        currentSearch={descriptors.search}
      />

      <AdminDeleteDialog
        {...deletion.dialog}
        translationNamespace="admin.ageClassifications.descriptors.delete"
        warningParams={{ code: deletion.target?.code ?? "" }}
        warningKey="confirm"
        confirmKey="delete"
        blockOnUsage
      />
    </div>
  );
}
