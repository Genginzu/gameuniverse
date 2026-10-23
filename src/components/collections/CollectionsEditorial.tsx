"use client";

/**
 * CollectionsEditorial : page Collections (`/collections`) au look éditorial.
 *
 * Affiche les collections de l'utilisateur courant. Conserve la logique métier :
 *   - Hook `useCollections(user.id)` pour la liste
 *   - Hook `useCollectionMutations` pour la création
 *
 * Style : Tailwind inline + tokens éditoriaux (cf steering styles-organization).
 */

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";

import { useAuth } from "@/hooks/useAuth";
import { useCollections } from "@/hooks/useCollections";
import { useCreateCollectionDialog } from "@/hooks/useCreateCollectionDialog";
import { useCollectionSuggestions } from "@/hooks/useCollectionSuggestions";

import { CollectionsGrid } from "./CollectionsGrid";
import { CreateCollectionDialog } from "./CreateCollectionDialog";
import { CollectionsPageSkeleton } from "./CollectionsPageSkeleton";
import { SuggestedCollections } from "./suggestions/SuggestedCollections";
import { SuggestionsButton } from "./suggestions/SuggestionsButton";

export function CollectionsEditorial() {
  const t = useTranslations("collections.editorial");
  const { user, loading: authLoading } = useAuth();

  const playerId = user?.id ?? "";
  const { collections, isLoading, refetch } = useCollections(playerId);
  const { isOpen, setIsOpen, isCreating, handleCreate } = useCreateCollectionDialog(playerId);
  const suggestions = useCollectionSuggestions(!!user);

  const stats = useMemo(() => {
    const totalCollections = collections.length;
    const totalGames = collections.reduce((sum, c) => sum + c.gamesCount, 0);
    const publicCollections = collections.filter((c) => c.isPublic).length;
    const largest = collections.reduce<(typeof collections)[number] | null>(
      (top, c) => (top === null || c.gamesCount > top.gamesCount ? c : top),
      null
    );
    return { totalCollections, totalGames, publicCollections, largest };
  }, [collections]);

  if (authLoading) {
    return <CollectionsPageSkeleton />;
  }

  if (user && isLoading) {
    return <CollectionsPageSkeleton />;
  }

  return (
    <section className="w-full">
      <EditorialContainer>
        {/* Hero */}
        <header className="mb-12 grid grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr] lg:items-end lg:gap-12">
          <div>
            <KickerLabel>{t("kicker")}</KickerLabel>
            <h1 className="mt-2 font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
              {t("titlePrefix")} <span className="text-editorial-accent">{t("titleAccent")}</span>
            </h1>
            <p className="text-editorial-muted mt-4 max-w-[60ch] text-base">{t("subtitle")}</p>
          </div>

          <div className="border-editorial-line grid grid-cols-2 gap-6 border-y py-6 md:grid-cols-3">
            <Stat label={t("stats.collections")} value={String(stats.totalCollections)} accent />
            <Stat label={t("stats.games")} value={String(stats.totalGames)} />
            <Stat
              label={t("stats.largest")}
              value={
                stats.largest ? (
                  <span className="font-display text-xl leading-tight font-bold text-white line-clamp-2">
                    {stats.largest.name}
                  </span>
                ) : (
                  "—"
                )
              }
            />
          </div>
        </header>

        {/* Controls */}
        {!user ? (
          <CollectionsAuthRequired />
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <KickerLabel>{t("listKicker", { count: stats.totalCollections })}</KickerLabel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SuggestionsButton controller={suggestions} />
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="btn-filled inline-flex h-14 items-center justify-center gap-2 rounded-[14px] px-6 text-[0.95rem] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
                >
                  <Icon icon="lucide:plus" className="h-4 w-4" aria-hidden="true" />
                  {t("createButton")}
                </button>
              </div>
            </div>

            {/* Suggested collections results (button-triggered) */}
            <SuggestedCollections controller={suggestions} onCreated={refetch} />

            {/* Content */}
            {collections.length === 0 ? (
              <CollectionsEmptyState onCreate={() => setIsOpen(true)} />
            ) : (
              <CollectionsGrid collections={collections} basePath="/collections" showVisibility />
            )}
          </>
        )}

        {/* Create dialog */}
        <CreateCollectionDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          onSubmit={handleCreate}
          isSubmitting={isCreating}
        />
      </EditorialContainer>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div>
      <p
        className={`font-display text-3xl leading-none font-bold tracking-tight ${
          accent ? "text-editorial-accent" : "text-white"
        }`}
      >
        {value}
      </p>
      <KickerLabel className="mt-2">{label}</KickerLabel>
    </div>
  );
}

/** Carte d'auth affichée à la place des contrôles et du contenu quand non connecté. */
function CollectionsAuthRequired() {
  const t = useTranslations("collections.editorial");

  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:lock" className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">{t("authRequired.title")}</h3>
      <p className="text-editorial-muted max-w-[50ch]">{t("authRequired.description")}</p>
      <Button asChild>
        <Link href="/auth">
          <Icon icon="lucide:log-in" className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("authRequired.signIn")}
        </Link>
      </Button>
    </div>
  );
}

function CollectionsEmptyState({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("collections.editorial");

  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:layers" className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">{t("empty.title")}</h3>
      <p className="text-editorial-muted max-w-[50ch]">{t("empty.description")}</p>
      <Button onClick={onCreate}>
        <Icon icon="lucide:plus" className="mr-2 h-4 w-4" aria-hidden="true" />
        {t("empty.cta")}
      </Button>
    </div>
  );
}
