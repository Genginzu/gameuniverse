"use client";

/**
 * Empty states of `/library`: signed-out visitor, and empty library or no
 * search result.
 */

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/** Bloc affiché à la place de la recherche et du contenu quand l'utilisateur n'est pas connecté. */
export function LibraryAuthRequired() {
  const t = useTranslations("userLibrary");

  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:lock" className="h-7 w-7" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">{t("authRequired.title")}</h3>
      <p className="text-editorial-muted max-w-[50ch]">{t("authRequired.description")}</p>
      <Button asChild>
        <Link href="/auth">
          <Icon icon="lucide:log-in" className="mr-2 h-4 w-4" />
          {t("authRequired.signIn")}
        </Link>
      </Button>
    </div>
  );
}

/** État vide — bibliothèque vide ou aucun résultat de recherche. */
export function LibraryEmptyState({
  hasFilters,
  onClearFilters,
  onAddGame,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onAddGame: () => void;
}) {
  const t = useTranslations("userLibrary");

  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:gamepad-2" className="h-7 w-7" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">
        {hasFilters ? t("empty.noGamesFound") : t("empty.title")}
      </h3>
      <p className="text-editorial-muted max-w-[50ch]">
        {hasFilters ? t("empty.modifySearch") : t("empty.description")}
      </p>
      {hasFilters ? (
        <Button onClick={onClearFilters}>{t("empty.clearFilters")}</Button>
      ) : (
        <Button onClick={onAddGame}>
          <Icon icon="lucide:plus" className="mr-2 h-4 w-4" />
          {t("addGame.trigger")}
        </Button>
      )}
    </div>
  );
}
