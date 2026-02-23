"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminCharacters } from "@/hooks/useAdminCharacters";
import type { AdminCharacter } from "@/types/admin-characters";
import { AdminCharactersTable } from "@/components/admin/characters/AdminCharactersTable";
import { DeleteCharacterDialog } from "@/components/admin/characters/DeleteCharacterDialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FaPlus } from "react-icons/fa";

export default function AdminCharactersPage() {
  const t = useTranslations("admin.characters");
  const router = useRouter();
  const { canDelete } = useAdminAuth();
  const { characters, pagination, loading, fetchCharacters, deleteCharacter } =
    useAdminCharacters();

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "updated_at",
    order: "desc",
  });
  const [characterToDelete, setCharacterToDelete] = useState<AdminCharacter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentSearch(query);
      fetchCharacters({
        search: query,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page: 1,
      });
    },
    [fetchCharacters, currentSort]
  );

  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      setCurrentSort({ field, order });
      fetchCharacters({ search: currentSearch, sortBy: field, sortOrder: order, page: 1 });
    },
    [fetchCharacters, currentSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchCharacters({
        search: currentSearch,
        sortBy: currentSort.field,
        sortOrder: currentSort.order,
        page,
      });
    },
    [fetchCharacters, currentSearch, currentSort]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/admin/characters/${id}/edit`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback((character: AdminCharacter) => {
    setCharacterToDelete(character);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!characterToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCharacter(characterToDelete.id);
      toast({
        title: t("deleteDialog.success"),
        variant: "success",
      });
      setCharacterToDelete(null);
    } catch {
      toast({
        title: t("deleteDialog.errorGeneric"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [characterToDelete, deleteCharacter, t]);

  const handleDeleteClose = useCallback(() => {
    if (!isDeleting) {
      setCharacterToDelete(null);
    }
  }, [isDeleting]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
        <Button onClick={() => router.push("/admin/characters/new")}>
          <FaPlus className="h-4 w-4" />
          {t("newCharacter")}
        </Button>
      </div>

      <AdminCharactersTable
        characters={characters}
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

      <DeleteCharacterDialog
        character={characterToDelete}
        isOpen={characterToDelete !== null}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
