"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useAdminCommunities } from "@/hooks/useAdminCommunities";
import type { AdminCommunity } from "@/types/admin-communities";
import { AdminDataTable, type AdminColumnDef } from "@/components/admin/shared/AdminDataTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { toast } from "@/hooks/use-toast";

export default function AdminCommunitiesPage() {
  const t = useTranslations("admin.communities");
  const { communities, pagination, loading, fetchCommunities, setVisibility, deleteCommunity } =
    useAdminCommunities();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "created_at",
    order: "desc",
  });
  const [communityToDelete, setCommunityToDelete] = useState<AdminCommunity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchCommunities({
        search: query,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page: 1,
      });
    },
    [fetchCommunities, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchCommunities({ search: currentSearch, sortBy: field, sortOrder: order, page: 1 });
    },
    [fetchCommunities, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchCommunities({
        search: currentSearch,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page,
      });
    },
    [fetchCommunities, currentSearch, currentSort]
  );

  const handleToggleSuspend = useCallback(
    async (community: AdminCommunity) => {
      try {
        const nextVisibility = community.visibility === "private" ? "public" : "private";
        await setVisibility(community.id, nextVisibility);
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

  const handleDeleteRequest = useCallback((community: AdminCommunity) => {
    setCommunityToDelete(community);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!communityToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCommunity(communityToDelete.id);
      toast({ title: t("deleteDialog.success"), variant: "success" });
      setCommunityToDelete(null);
    } catch {
      toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [communityToDelete, deleteCommunity, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) setCommunityToDelete(null);
  }, [isDeleting]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  const communityColumns: AdminColumnDef<AdminCommunity>[] = [
    {
      key: "name",
      labelKey: "columns.name",
      sortable: true,
      render: (c) => c.name,
      className: "px-4 py-3 font-medium text-gray-900 dark:text-white",
    },
    {
      key: "owner_name",
      labelKey: "columns.owner",
      render: (c) => c.ownerName ?? t("unknownOwner"),
      className: "px-4 py-3 text-gray-500 dark:text-gray-400",
    },
    {
      key: "members_count",
      labelKey: "columns.membersCount",
      render: (c) => String(c.membersCount),
      className: "px-4 py-3 text-gray-500 dark:text-gray-400",
    },
    {
      key: "visibility",
      labelKey: "columns.visibility",
      render: (c) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            c.visibility === "private"
              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
          }`}
        >
          {c.visibility === "private" ? t("statusSuspended") : t("statusActive")}
        </span>
      ),
      className: "px-4 py-3",
    },
    {
      key: "created_at",
      labelKey: "columns.date",
      sortable: true,
      render: (c) => formatDate(c.createdAt),
      className: "px-4 py-3 text-gray-500 dark:text-gray-400",
    },
  ];

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("description")}</p>
      </div>

      <AdminDataTable<AdminCommunity>
        items={communities}
        columns={communityColumns}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onSort={handleSort}
        onEdit={handleToggleSuspend}
        onDelete={handleDeleteRequest}
        isLoading={loading}
        currentSort={currentSort}
        currentSearch={currentSearch}
        translationNamespace="admin.communities"
        totalCountKey="totalCommunities"
        emptyKey="noCommunities"
      />

      <AdminDeleteDialog
        isOpen={communityToDelete !== null}
        translationNamespace="admin.communities.deleteDialog"
        warningParams={{ name: communityToDelete?.name ?? "" }}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
