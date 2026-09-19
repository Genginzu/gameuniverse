"use client";

/**
 * GroupDetailEditorial : page détail d'un groupe (`/groups/[slug]`).
 * Affiche description, membres, fil de posts, et les actions
 * rejoindre/quitter + gestion des membres pour owner/admin.
 */

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { LazyImage } from "@/components/ui/lazy-image";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useGroupPosts } from "@/hooks/useGroupPosts";
import { useGroupInvitations } from "@/hooks/useGroupInvitations";

import { GroupLeaveButton } from "./GroupLeaveButton";
import { GroupMembersList } from "./GroupMembersList";
import { GroupPostsFeed } from "./GroupPostsFeed";
import { GroupManagementPanel } from "./GroupManagementPanel";

interface GroupDetailEditorialProps {
  slug: string;
}

export function GroupDetailEditorial({ slug }: GroupDetailEditorialProps) {
  const t = useTranslations("groups.detail");
  const { user } = useAuth();

  const { group, isLoading, error, isLeaving, leave } = useGroup(slug);
  const { members, updateRole, removeMember } = useGroupMembers(slug);
  const { posts, isPosting, createPost } = useGroupPosts(slug);

  const canManage = group?.viewerRole === "owner" || group?.viewerRole === "admin";
  const { invitations, isInviting, inviteError, invite } = useGroupInvitations(
    slug,
    !!canManage
  );

  if (isLoading) {
    return <GroupDetailSkeleton />;
  }

  if (error || !group) {
    return (
      <ErrorFallback
        title={t("errorTitle")}
        description={t("errorDescription")}
        showRefresh
        showBackButton
        backUrl="/groups"
        backLabel={t("backToGroups")}
      />
    );
  }

  const canPost = group.viewerRole !== null;

  return (
    <section className="w-full">
      <EditorialContainer>
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="border-editorial-line bg-editorial-2 relative size-20 shrink-0 overflow-hidden rounded-2xl border">
              {group.imageUrl ? (
                <LazyImage src={group.imageUrl} alt="" fill className="object-cover" />
              ) : (
                <div className="text-editorial-accent/50 grid h-full w-full place-items-center">
                  <Icon icon="lucide:users" className="h-8 w-8" aria-hidden="true" />
                </div>
              )}
            </div>
            <div>
              <KickerLabel>{t("private")}</KickerLabel>
              <h1 className="mt-1 font-display text-[clamp(1.75rem,3vw+1rem,2.75rem)] leading-[1.05] font-bold tracking-tight text-white">
                {group.name}
              </h1>
              <p className="text-editorial-muted mt-2 text-sm">
                {t("membersCount", { count: group.membersCount, max: 50 })}
              </p>
            </div>
          </div>

          <GroupLeaveButton viewerRole={group.viewerRole} isLeaving={isLeaving} onLeave={leave} />
        </header>

        {group.description && (
          <p className="text-editorial-muted mb-10 max-w-[70ch] text-base">{group.description}</p>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[7fr_5fr]">
          <div>
            <KickerLabel className="mb-4">{t("postsKicker")}</KickerLabel>
            <GroupPostsFeed
              posts={posts}
              canPost={canPost}
              isPosting={isPosting}
              onCreatePost={createPost}
            />
          </div>

          <div className="flex flex-col gap-8">
            <div>
              <KickerLabel className="mb-4">{t("membersKicker")}</KickerLabel>
              <GroupMembersList
                members={members}
                canManage={!!canManage}
                currentPlayerId={user?.id}
                onUpdateRole={updateRole}
                onRemoveMember={removeMember}
              />
            </div>

            {canManage && (
              <GroupManagementPanel
                membersCount={group.membersCount}
                invitations={invitations}
                isInviting={isInviting}
                inviteError={inviteError}
                onInvite={invite}
              />
            )}
          </div>
        </div>
      </EditorialContainer>
    </section>
  );
}

function GroupDetailSkeleton() {
  return (
    <section className="w-full">
      <EditorialContainer>
        <div className="border-editorial-line bg-editorial-2 mb-10 h-24 animate-pulse rounded-2xl border" />
        <div className="border-editorial-line bg-editorial-2 h-64 animate-pulse rounded-2xl border" />
      </EditorialContainer>
    </section>
  );
}
