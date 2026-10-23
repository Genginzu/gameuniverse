"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";
import { ratingsResource } from "@/lib/admin-resource/resources/ratings";
import { RatingsTable } from "./RatingsTable";
import { AdminDeleteDialog } from "@/components/admin/shared/AdminDeleteDialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

import type { AdminRating } from "@/types/admin-age-classifications";
import { Icon } from "@iconify/react";

interface RatingsTabProps {
  ratingSystemId: string;
}

export function RatingsTab({ ratingSystemId }: RatingsTabProps) {
  const t = useTranslations("admin.ageClassifications.ratings");
  const router = useRouter();
  const ratings = useAdminResource(ratingsResource, { pathParams: { ratingSystemId } });
  const deletion = useAdminDeleteFlow(ratings, {
    onDeleted: () => toast({ title: t("toast.deleted"), variant: "success" }),
    onError: () => toast({ title: t("toast.deleteError"), variant: "destructive" }),
  });

  const handleEdit = useCallback(
    (rating: AdminRating) => {
      router.push(`/admin/age-classifications/${ratingSystemId}/ratings/${rating.id}/edit`);
    },
    [router, ratingSystemId]
  );

  const handleCreate = useCallback(() => {
    router.push(`/admin/age-classifications/${ratingSystemId}/ratings/new`);
  }, [router, ratingSystemId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("title")}</h2>
        <Button size="sm" onClick={handleCreate}>
          <Icon icon="fa:plus" className="h-3 w-3" />
          {t("newRating")}
        </Button>
      </div>

      <RatingsTable
        ratings={ratings.rows}
        onSearch={ratings.setSearch}
        onEdit={handleEdit}
        onDelete={deletion.request}
        isLoading={ratings.isLoading}
        currentSearch={ratings.search}
      />

      <AdminDeleteDialog
        {...deletion.dialog}
        translationNamespace="admin.ageClassifications.ratings.delete"
        warningParams={{ name: deletion.target?.display_name ?? "" }}
        warningKey="confirm"
        confirmKey="delete"
        blockOnUsage
      />
    </div>
  );
}
