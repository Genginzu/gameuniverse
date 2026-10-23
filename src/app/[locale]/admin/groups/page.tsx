"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { groupsResource } from "@/lib/admin-resource/resources/groups";
import { readApiError } from "@/lib/admin-resource/defineAdminResource";
import type { AdminGroup } from "@/types/admin-groups";
import { AdminDataTable, type AdminColumnDef } from "@/components/admin/shared/AdminDataTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { toast } from "@/hooks/use-toast";

async function patchGroupVisibility(id: string, visibility: "public" | "private") {
  const response = await fetch(`/api/admin/groups/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visibility }),
  });
  if (!response.ok) throw await readApiError(response, "Failed to update group");
}

export default function AdminGroupsPage() {
  const t = useTranslations("admin.groups");
  const groups = useAdminResource(groupsResource);
  const deletion = useAdminDeleteFlow(groups, {
    onDeleted: () => toast({ title: t("deleteDialog.success"), variant: "success" }),
    onError: () => toast({ title: t("deleteDialog.errorGeneric"), variant: "destructive" }),
  });
  const { revalidate } = groups;

  const handleToggleSuspend = useCallback(
    async (group: AdminGroup) => {
      try {
        const nextVisibility = group.visibility === "private" ? "public" : "private";
        await patchGroupVisibility(group.id, nextVisibility);
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
        items={groups.rows}
        columns={groupColumns}
        pagination={groups.pagination}
        onPageChange={groups.setPage}
        onSearch={groups.setSearch}
        onSort={(field, order) => groups.setSort({ field, order })}
        onEdit={handleToggleSuspend}
        onDelete={deletion.request}
        isLoading={groups.isLoading}
        currentSort={groups.sort}
        currentSearch={groups.search}
        translationNamespace="admin.groups"
        totalCountKey="totalGroups"
        emptyKey="noGroups"
      />

      <AdminDeleteDialog
        {...deletion.dialog}
        translationNamespace="admin.groups.deleteDialog"
        warningParams={{ name: deletion.target?.name ?? "" }}
      />
    </div>
  );
}
