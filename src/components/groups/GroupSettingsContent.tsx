"use client";

/**
 * GroupSettingsContent : page de paramètres d'un groupe (`/groups/[slug]/settings`).
 * Réservée aux owner/moderator. Deux onglets : Infos (édition nom/description/logo)
 * et Membres (gestion des rôles, retrait, invitations).
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { Link } from "@/i18n/navigation";

import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useGroupInvitations } from "@/hooks/useGroupInvitations";
import type { UpdateGroupInput } from "@/types/group";

import { GroupForm } from "./GroupForm";
import { GroupMembersList } from "./GroupMembersList";
import { GroupManagementPanel } from "./GroupManagementPanel";

type SettingsTab = "info" | "members";

interface GroupSettingsContentProps {
  slug: string;
}

export function GroupSettingsContent({ slug }: GroupSettingsContentProps) {
  const t = useTranslations("groups.settings");
  const { user } = useAuth();
  const [tab, setTab] = useState<SettingsTab>("info");

  const { group, isLoading, error, isUpdating, update } = useGroup(slug);
  const canManage = group?.viewerRole === "owner" || group?.viewerRole === "moderator";
  const { members, updateRole, removeMember } = useGroupMembers(slug);
  const { invitations, isInviting, inviteError, invite } = useGroupInvitations(slug, !!canManage);

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (error || !group || !canManage) {
    return (
      <ErrorFallback
        title={t("forbiddenTitle")}
        description={t("forbiddenDescription")}
        showBackButton
        backUrl={`/groups/${slug}`}
        backLabel={t("backToGroup")}
      />
    );
  }

  const handleUpdate = async (data: UpdateGroupInput) => {
    await update(data);
  };

  return (
    <section className="w-full">
      <EditorialContainer>
        <header className="mb-8">
          <Link
            href={`/groups/${slug}`}
            className="text-editorial-muted mb-4 inline-flex items-center gap-1.5 text-sm transition-colors hover:text-white"
          >
            <Icon icon="lucide:arrow-left" className="h-4 w-4" aria-hidden="true" />
            {t("backToGroup")}
          </Link>
          <KickerLabel>{group.name}</KickerLabel>
          <h1 className="mt-2 font-display text-[clamp(1.75rem,3vw+1rem,2.75rem)] leading-[1.05] font-bold tracking-tight text-white">
            {t("title")}
          </h1>
        </header>

        <div className="border-editorial-line mb-8 flex gap-1 border-b">
          <TabButton active={tab === "info"} onClick={() => setTab("info")}>
            {t("tabs.info")}
          </TabButton>
          <TabButton active={tab === "members"} onClick={() => setTab("members")}>
            {t("tabs.members")}
          </TabButton>
        </div>

        {tab === "info" ? (
          <div className="max-w-2xl">
            <GroupForm
              mode="edit"
              defaultValues={{
                name: group.name,
                description: group.description ?? "",
                imageUrl: group.imageUrl ?? "",
              }}
              onSubmit={(data) => handleUpdate(data as UpdateGroupInput)}
              isSubmitting={isUpdating}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div>
              <KickerLabel className="mb-4">{t("membersKicker")}</KickerLabel>
              <GroupMembersList
                members={members}
                canManage
                currentPlayerId={user?.id}
                onUpdateRole={updateRole}
                onRemoveMember={removeMember}
              />
            </div>
            <GroupManagementPanel
              membersCount={group.membersCount}
              invitations={invitations}
              isInviting={isInviting}
              inviteError={inviteError}
              onInvite={invite}
            />
          </div>
        )}
      </EditorialContainer>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "border-[rgb(var(--accent-rgb,var(--neon-primary)))] text-white"
          : "text-editorial-muted border-transparent hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function SettingsSkeleton() {
  return (
    <section className="w-full">
      <EditorialContainer>
        <div className="border-editorial-line bg-editorial-2 mb-8 h-16 animate-pulse rounded-2xl border" />
        <div className="border-editorial-line bg-editorial-2 h-64 animate-pulse rounded-2xl border" />
      </EditorialContainer>
    </section>
  );
}
