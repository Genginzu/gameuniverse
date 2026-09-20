"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useAdminGroups } from "@/hooks/useAdminGroups";
import type { AdminGroup } from "@/types/admin-groups";
import { AdminDataTable, type AdminColumnDef } from "@/components/admin/shared/AdminDataTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { toast } from "@/hooks/use-toast";

export default function AdminGroupsPage() {
  const t = useTranslations("admin.groups");
  const { groups, pagination, loading, fetchGroups, setVisibility, deleteGroup } =
    useAdminGroups();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "created_at",
    order: "desc",
  });
  const [groupToDelete, setGroupToDelete] = useState<AdminGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchGroups({ search: query, sortBy: currentSort.field, sortOrder: currentSort.order, page: 1 });
    },
    [fetchGroups, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchGroups({ search: currentSearch, sortBy: field, sortOrder: order, page: 1 });
    },
    [fetchGroups, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchGroups({ search: currentSearch, sortBy: currentSort.field, sortOrder: currentSort.order, page });
    },
    [fetchGroups, currentSearch, currentSort]
  );

  const handleToggleSuspend = useCallback(
    async (group: AdminGroup) => {
      try {
        const nextVisibility = group.visibility === "private" ? "public" : "private";
        await setVisibility(group.id, nextVisibility);
        toast({
          title:
            nextVisibility === "private" ? t("suspendDialog.success") : t("restoreDialog.success"),
          variant: "success",
        });
      } catch {
        toast({ title: t("toggleError"), variant: "destructive" });
      }
    },
    [setVisibility, t]
  );

  const handleDeleteRequest = useCallback((group: AdminGroup) => {
    setGroupToDelete(group);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!groupToDelete) return;
    setIsDeleting(true);
    try {
      await deleteGroup(groupToDelete.id);
      toast({ title: t("deleteDialog.success"), variant: "success" });
      setGroupToDelete(null);
    } catch {
      toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [groupToDelete, deleteGroup, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) setGroupToDelete(null);
  }, [isDeleting]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  const groupColumns: AdminColumnDef<AdminGroup>[] = [
    {
      key: "name",
      labelKey: "columns.name",
      sortable: true,
      render: (g) => g.name,
      className: "px-4 py-3 font-medium text-gray-900 dark:text-white",
    },
    {
      key: "owner_name",
      labelKey: "columns.owner",
      render: (g) => g.ownerName ?? t("unknownOwner"),
      className: "px-4 py-3 text-gray-500 dark:text-gray-400",
    },
    {
      key: "members_count",
      labelKey: "columns.membersCount",
      render: (g) => String(g.membersCount),
      className: "px-4 py-3 text-gray-500 dark:text-gray-400",
    },
    {
      key: "visibility",
      labelKey: "columns.visibility",
      render: (g) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            g.visibility === "private"
              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
          }`}
        >
          {g.visibility === "private" ? t("statusSuspended") : t("statusActive")}
        </span>
      ),
      className: "px-4 py-3",
    },
    {
      key: "created_at",
      labelKey: "columns.date",
      sortable: true,
      render: (g) => formatDate(g.createdAt),
      className: "px-4 py-3 text-gray-500 dark:text-gray-400",
    },
  ];

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("description")}</p>
      </div>

      <AdminDataTable<AdminGroup>
        items={groups}
        columns={groupColumns}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onSort={handleSort}
        onEdit={handleToggleSuspend}
        onDelete={handleDeleteRequest}
        isLoading={loading}
        currentSort={currentSort}
        currentSearch={currentSearch}
        translationNamespace="admin.groups"
        totalCountKey="totalGroups"
        emptyKey="noGroups"
      />

      <AdminDeleteDialog
        isOpen={groupToDelete !== null}
        translationNamespace="admin.groups.deleteDialog"
        warningParams={{ name: groupToDelete?.name ?? "" }}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
