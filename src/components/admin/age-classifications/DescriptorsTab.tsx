"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAdminDescriptors } from "@/hooks/useAdminDescriptors";
import { useDescriptorForm } from "@/hooks/useDescriptorForm";
import { DescriptorsTable } from "./DescriptorsTable";
import { DescriptorForm } from "./DescriptorForm";
import { DeleteDescriptorDialog } from "./DeleteDescriptorDialog";
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
  const { descriptors, loading, fetchDescriptors, deleteDescriptor, checkDescriptorUsage } =
    useAdminDescriptors(ratingSystemId);

  const [currentSearch, setCurrentSearch] = useState("");
  const [editingDescriptor, setEditingDescriptor] = useState<AdminContentDescriptor | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [descriptorToDelete, setDescriptorToDelete] = useState<AdminContentDescriptor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);

  const formMode = editingDescriptor ? "edit" : "create";
  const { form, submitDescriptor, isSubmitting } = useDescriptorForm(
    formMode,
    ratingSystemId,
    editingDescriptor?.id,
    editingDescriptor
      ? {
          code: editingDescriptor.code,
          icon_url: editingDescriptor.icon_url ?? "",
          translations: editingDescriptor.translations.map((t) => ({
            language_code: t.language_code,
            name: t.name,
            description: t.description ?? "",
          })),
        }
      : undefined
  );

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchDescriptors(query);
    },
    [fetchDescriptors]
  );

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
        fetchDescriptors(currentSearch);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("toast.error");
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitDescriptor, editingDescriptor, fetchDescriptors, currentSearch]
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

  const handleDeleteRequest = useCallback(
    async (descriptor: AdminContentDescriptor) => {
      setDescriptorToDelete(descriptor);
      setUsageCount(undefined);
      try {
        const count = await checkDescriptorUsage(descriptor.id);
        setUsageCount(count);
      } catch {
        setUsageCount(undefined);
      }
    },
    [checkDescriptorUsage]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!descriptorToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDescriptor(descriptorToDelete.id);
      toast({ title: t("toast.deleted"), variant: "success" });
      setDescriptorToDelete(null);
    } catch {
      toast({ title: t("toast.deleteError"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [descriptorToDelete, deleteDescriptor]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) setDescriptorToDelete(null);
  }, [isDeleting]);

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
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
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
        descriptors={descriptors}
        onSearch={handleSearch}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        isLoading={loading}
        currentSearch={currentSearch}
      />

      <DeleteDescriptorDialog
        descriptor={descriptorToDelete}
        isOpen={descriptorToDelete !== null}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        usageCount={usageCount}
      />
    </div>
  );
}
