"use client";

/**
 * CommunitySettingsContent : page de paramètres d'une communauté
 * (`/communities/[slug]/settings`). Réservée aux owner/moderator. Deux onglets :
 * Infos (édition nom/description/logo) et Membres (gestion des rôles, retrait).
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { Link } from "@/i18n/navigation";

import { useAuth } from "@/hooks/useAuth";
import { useCommunity } from "@/hooks/useCommunity";
import { useCommunityMembers } from "@/hooks/useCommunityMembers";
import type { UpdateCommunityInput } from "@/types/community";

import { CommunityForm } from "./CommunityForm";
import { CommunityMembersList } from "./CommunityMembersList";

type SettingsTab = "info" | "members";

interface CommunitySettingsContentProps {
  slug: string;
}

export function CommunitySettingsContent({ slug }: CommunitySettingsContentProps) {
  const t = useTranslations("communities.settings");
  const { user } = useAuth();
  const [tab, setTab] = useState<SettingsTab>("info");

  const { community, isLoading, error, isUpdating, update } = useCommunity(slug);
  const canManage =
    community?.viewerRole === "owner" || community?.viewerRole === "moderator";
  const { members, updateRole, removeMember } = useCommunityMembers(slug);

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (error || !community || !canManage) {
    return (
      <ErrorFallback
        title={t("forbiddenTitle")}
        description={t("forbiddenDescription")}
        showBackButton
        backUrl={`/communities/${slug}`}
        backLabel={t("backToCommunity")}
      />
    );
  }

  const handleUpdate = async (data: UpdateCommunityInput) => {
    await update(data);
  };

  return (
    <section className="w-full">
      <EditorialContainer>
        <header className="mb-8">
          <Link
            href={`/communities/${slug}`}
            className="text-editorial-muted mb-4 inline-flex items-center gap-1.5 text-sm transition-colors hover:text-white"
          >
            <Icon icon="lucide:arrow-left" className="h-4 w-4" aria-hidden="true" />
            {t("backToCommunity")}
          </Link>
          <KickerLabel>{community.name}</KickerLabel>
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
            <CommunityForm
              mode="edit"
              defaultValues={{
                name: community.name,
                description: community.description ?? "",
                imageUrl: community.imageUrl ?? "",
              }}
              onSubmit={(data) => handleUpdate(data as UpdateCommunityInput)}
              isSubmitting={isUpdating}
            />
          </div>
        ) : (
          <div>
            <KickerLabel className="mb-4">{t("membersKicker")}</KickerLabel>
            <CommunityMembersList
              members={members}
              canManage
              currentPlayerId={user?.id}
              onUpdateRole={updateRole}
              onRemoveMember={removeMember}
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
