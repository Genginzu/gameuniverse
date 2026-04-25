"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAdminRatings } from "@/hooks/useAdminRatings";
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
  const { ratings, loading, fetchRatings, deleteRating, checkRatingUsage } =
    useAdminRatings(ratingSystemId);

  const [currentSearch, setCurrentSearch] = useState("");
  const [ratingToDelete, setRatingToDelete] = useState<AdminRating | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchRatings(query);
    },
    [fetchRatings]
  );

  const handleEdit = useCallback(
    (rating: AdminRating) => {
      router.push(`/admin/age-classifications/${ratingSystemId}/ratings/${rating.id}/edit`);
    },
    [router, ratingSystemId]
  );

  const handleCreate = useCallback(() => {
    router.push(`/admin/age-classifications/${ratingSystemId}/ratings/new`);
  }, [router, ratingSystemId]);

  const handleDeleteRequest = useCallback(
    async (rating: AdminRating) => {
      setRatingToDelete(rating);
      setUsageCount(undefined);
      try {
        const count = await checkRatingUsage(rating.id);
        setUsageCount(count);
      } catch {
        setUsageCount(undefined);
      }
    },
    [checkRatingUsage]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!ratingToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRating(ratingToDelete.id);
      toast({ title: t("toast.deleted"), variant: "success" });
      setRatingToDelete(null);
    } catch {
      toast({ title: t("toast.deleteError"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [ratingToDelete, deleteRating]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) setRatingToDelete(null);
  }, [isDeleting]);

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
        ratings={ratings}
        onSearch={handleSearch}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        isLoading={loading}
        currentSearch={currentSearch}
      />

      <AdminDeleteDialog
        isOpen={ratingToDelete !== null}
          translationNamespace="admin.ageClassifications.ratings.delete"
          warningParams={{ name: ratingToDelete?.display_name ?? "" }}
          warningKey="confirm"
          confirmKey="delete"
          blockOnUsage
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        usageCount={usageCount}
      />
    </div>
  );
}
