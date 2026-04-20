"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminGames } from "@/hooks/useAdminGames";
import dynamic from "next/dynamic";
import type { AdminGame } from "@/types/admin-games";
import { AdminGamesTable } from "@/components/admin/games/AdminGamesTable";
const AdminDeleteDialog = dynamic(
  () => import("@/components/admin/shared/AdminDeleteDialog").then((m) => m.AdminDeleteDialog),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@iconify/react";

export default function AdminGamesPage() {
  const t = useTranslations("admin.games");
  const router = useRouter();
  const { canDelete } = useAdminAuth();
  const { games, pagination, loading, fetchGames, deleteGame } = useAdminGames();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "created_at",
    order: "desc",
  });
  const [gameToDelete, setGameToDelete] = useState<AdminGame | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchGames({
        search: query,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page: 1,
      });
    },
    [fetchGames, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchGames({ search: currentSearch, sortBy: field, sortOrder: order, page: 1 });
    },
    [fetchGames, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchGames({
        search: currentSearch,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page,
      });
    },
    [fetchGames, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/admin/games/${id}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback((game: AdminGame) => {
    setGameToDelete(game);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!gameToDelete) return;
    setIsDeleting(true);
    try {
      await deleteGame(gameToDelete.id);
      toast({
        title: t("deleteDialog.success"),
        variant: "success",
      });
      setGameToDelete(null);
    } catch {
      toast({
        title: t("deleteDialog.errorGeneric"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [gameToDelete, deleteGame, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) {
      setGameToDelete(null);
    }
  }, [isDeleting]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
        <Button onClick={() => router.push("/admin/games/new")}>
          <Icon icon="fa:plus" className="h-4 w-4" />
          {t("newGame")}
        </Button>
      </div>

      <AdminGamesTable
        games={games}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onSort={handleSort}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        canDelete={canDelete}
        isLoading={loading}
        currentSort={currentSort}
        currentSearch={currentSearch}
      />

      <AdminDeleteDialog
        isOpen={gameToDelete !== null}
          translationNamespace="admin.games.deleteDialog"
          warningParams={{ title: gameToDelete?.title ?? "" }}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
