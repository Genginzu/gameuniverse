"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { communitiesResource } from "@/lib/admin-resource/resources/communities";
import { readApiError } from "@/lib/admin-resource/defineAdminResource";
import type { AdminCommunity } from "@/types/admin-communities";
import { AdminDataTable, type AdminColumnDef } from "@/components/admin/shared/AdminDataTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { toast } from "@/hooks/use-toast";

async function patchCommunityVisibility(id: string, visibility: "public" | "private") {
  const response = await fetch(`/api/admin/communities/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visibility }),
  });
  if (!response.ok) throw await readApiError(response, "Failed to update community");
}

export default function AdminCommunitiesPage() {
  const t = useTranslations("admin.communities");
  const communities = useAdminResource(communitiesResource);
  const deletion = useAdminDeleteFlow(communities, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });
  const { revalidate } = communities;

  const handleToggleSuspend = useCallback(
    async (community: AdminCommunity) => {
      try {
        const nextVisibility = community.visibility === "private" ? "public" : "private";
        await patchCommunityVisibility(community.id, nextVisibility);
        await revalidate();
        toast({
          title:
            nextVisibility === "private" ? t("suspendDialog.success") : t("restoreDialog.success"),
          variant: "success",
        });
      } catch {
        toast({ title: t("toggleError"), variant: "destructive" });
      }
    },
    [revalidate, t]
  );

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
        items={communities.rows}
        columns={communityColumns}
        pagination={communities.pagination}
        onPageChange={communities.setPage}
        onSearch={communities.setSearch}
        onSort={(field, order) => communities.setSort({ field, order })}
        onEdit={handleToggleSuspend}
        onDelete={deletion.request}
        isLoading={communities.isLoading}
        currentSort={communities.sort}
        currentSearch={communities.search}
        translationNamespace="admin.communities"
        totalCountKey="totalCommunities"
        emptyKey="noCommunities"
      />

      <AdminDeleteDialog
        {...deletion.dialog}
        translationNamespace="admin.communities.deleteDialog"
        warningParams={{ name: deletion.target?.name ?? "" }}
      />
    </div>
  );
}
