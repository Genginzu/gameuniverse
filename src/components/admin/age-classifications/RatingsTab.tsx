"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAdminRatings } from "@/hooks/useAdminRatings";
import { RatingsTable } from "./RatingsTable";
import { DeleteRatingDialog } from "./DeleteRatingDialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FaPlus } from "react-icons/fa";
import type { AdminRating } from "@/types/admin-age-classifications";

interface RatingsTabProps {
  ratingSystemId: string;
}

export function RatingsTab({ ratingSystemId }: RatingsTabProps) {
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
      toast({ title: "Note supprimée avec succès", variant: "success" });
      setRatingToDelete(null);
    } catch {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h2>
        <Button size="sm" onClick={handleCreate}>
          <FaPlus className="h-3 w-3" />
          Nouvelle note
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

      <DeleteRatingDialog
        rating={ratingToDelete}
        isOpen={ratingToDelete !== null}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        usageCount={usageCount}
      />
    </div>
  );
}
