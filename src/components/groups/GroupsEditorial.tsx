"use client";

/**
 * GroupsEditorial : page "Mes groupes" (`/groups`) au look éditorial.
 * Les groupes sont invite-only et invisibles publiquement : cette page
 * n'affiche donc que les groupes dont l'utilisateur est déjà membre, et
 * ses invitations en attente. Pas de recherche/listing public.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useSearchParams } from "next/navigation";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialPageHeader } from "@/components/shared/EditorialPageHeader";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";

import { useAuth } from "@/hooks/useAuth";
import { useMyGroups } from "@/hooks/useMyGroups";
import { useMyInvitations } from "@/hooks/useMyInvitations";
import { GroupService } from "@/lib/services/groupService";
import type { CreateGroupInput } from "@/lib/validations/group";

import { GroupsGrid } from "./GroupsGrid";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { PendingInvitationsSection } from "./PendingInvitationsSection";

export function GroupsEditorial() {
  const t = useTranslations("groups.editorial");
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { groups, isLoading } = useMyGroups();
  const { invitations, isLoading: isLoadingInvitations } = useMyInvitations();

  useEffect(() => {
    if (user && searchParams.get("create") === "1") {
      setIsDialogOpen(true);
    }
  }, [user, searchParams]);

  const handleCreate = async (data: CreateGroupInput) => {
    setIsCreating(true);
    try {
      const created = await GroupService.createGroup(data);
      setIsDialogOpen(false);
      window.location.href = `/groups/${created.slug}`;
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="w-full">
      <EditorialContainer>
        <EditorialPageHeader
          kicker={t("kicker")}
          title={t("titlePrefix")}
          titleAccent={t("titleAccent")}
          subtitle={t("subtitle")}
        />

        {!isLoadingInvitations && invitations.length > 0 && (
          <PendingInvitationsSection invitations={invitations} />
        )}

        <div className="mb-8 flex items-center justify-between">
          <KickerLabel>{t("myGroupsKicker")}</KickerLabel>
          {user && (
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="btn-filled inline-flex h-12 items-center justify-center gap-2 rounded-[14px] px-5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
            >
              <Icon icon="lucide:plus" className="h-4 w-4" aria-hidden="true" />
              {t("createButton")}
            </button>
          )}
        </div>

        {!user ? (
          <GroupsAuthRequired />
        ) : isLoading ? (
          <GroupsGridSkeleton />
        ) : groups.length === 0 ? (
          <GroupsEmptyState onCreate={() => setIsDialogOpen(true)} />
        ) : (
          <GroupsGrid groups={groups} />
        )}

        {user && (
          <CreateGroupDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSubmit={handleCreate}
            isSubmitting={isCreating}
          />
        )}
      </EditorialContainer>
    </section>
  );
}

function GroupsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="border-editorial-line bg-editorial-2 aspect-[4/5] animate-pulse rounded-2xl border"
        />
      ))}
    </div>
  );
}

function GroupsAuthRequired() {
  const t = useTranslations("groups.editorial");

  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:lock" className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">{t("authRequired.title")}</h3>
      <p className="text-editorial-muted max-w-[50ch]">{t("authRequired.description")}</p>
    </div>
  );
}

function GroupsEmptyState({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("groups.editorial");

  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:users" className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">{t("empty.title")}</h3>
      <p className="text-editorial-muted max-w-[50ch]">{t("empty.description")}</p>
      <button
        type="button"
        onClick={onCreate}
        className="btn-filled inline-flex h-12 items-center justify-center gap-2 rounded-[14px] px-6 text-sm font-semibold transition"
      >
        <Icon icon="lucide:plus" className="h-4 w-4" aria-hidden="true" />
        {t("empty.cta")}
      </button>
    </div>
  );
}
