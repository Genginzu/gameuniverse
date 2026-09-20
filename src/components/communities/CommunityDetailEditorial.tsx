"use client";

/**
 * CommunityDetailEditorial : page détail d'une communauté (`/communities/[slug]`).
 * Affiche description, membres, fil de posts, et les actions
 * rejoindre/quitter + gestion des membres pour owner/moderator.
 */

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { LazyImage } from "@/components/ui/lazy-image";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { useAuth } from "@/hooks/useAuth";
import { useCommunity } from "@/hooks/useCommunity";
import { useCommunityMembers } from "@/hooks/useCommunityMembers";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";

import { CommunityJoinButton } from "./CommunityJoinButton";
import { CommunityMembersList } from "./CommunityMembersList";
import { CommunityPostsFeed } from "./CommunityPostsFeed";

interface CommunityDetailEditorialProps {
  slug: string;
}

export function CommunityDetailEditorial({ slug }: CommunityDetailEditorialProps) {
  const t = useTranslations("communities.detail");
  const { user } = useAuth();

  const { community, isLoading, error, isJoining, isLeaving, join, leave } = useCommunity(slug);
  const { members } = useCommunityMembers(slug);
  const { posts, isPosting, createPost } = useCommunityPosts(slug);

  if (isLoading) {
    return <CommunityDetailSkeleton />;
  }

  if (error || !community) {
    return (
      <ErrorFallback
        title={t("errorTitle")}
        description={t("errorDescription")}
        showRefresh
        showBackButton
        backUrl="/communities"
        backLabel={t("backToCommunities")}
      />
    );
  }

  const canManage = community.viewerRole === "owner" || community.viewerRole === "moderator";
  const canPost = community.viewerRole !== null;

  return (
    <section className="w-full">
      <EditorialContainer>
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="border-editorial-line bg-editorial-2 relative size-20 shrink-0 overflow-hidden rounded-2xl border">
              {community.imageUrl ? (
                <LazyImage src={community.imageUrl} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <div className="text-editorial-accent/50 grid h-full w-full place-items-center">
                  <Icon icon="lucide:globe-2" className="h-8 w-8" aria-hidden="true" />
                </div>
              )}
            </div>
            <div>
              <KickerLabel>
                {community.visibility === "public" ? t("public") : t("private")}
              </KickerLabel>
              <h1 className="mt-1 font-display text-[clamp(1.75rem,3vw+1rem,2.75rem)] leading-[1.05] font-bold tracking-tight text-white">
                {community.name}
              </h1>
              <p className="text-editorial-muted mt-2 text-sm">
                {t("membersCount", { count: community.membersCount })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <Button
                asChild
                variant="outline"
                className="border-editorial-line bg-editorial-3 text-white"
              >
                <Link href={`/communities/${slug}/settings`}>
                  <Icon icon="lucide:settings" className="h-4 w-4" aria-hidden="true" />
                  {t("settings")}
                </Link>
              </Button>
            )}
            <CommunityJoinButton
              isAuthenticated={!!user}
              viewerRole={community.viewerRole}
              isJoining={isJoining}
              isLeaving={isLeaving}
              onJoin={join}
              onLeave={leave}
            />
          </div>
        </header>

        {community.description && (
          <p className="text-editorial-muted mb-10 max-w-[70ch] text-base">
            {community.description}
          </p>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[3fr_1fr]">
          <div>
            <KickerLabel className="mb-4">{t("postsKicker")}</KickerLabel>
            <CommunityPostsFeed
              posts={posts}
              canPost={canPost}
              isPosting={isPosting}
              onCreatePost={createPost}
            />
          </div>

          <div>
            <KickerLabel className="mb-4">{t("membersKicker")}</KickerLabel>
            <CommunityMembersList members={members} canManage={false} currentPlayerId={user?.id} />
          </div>
        </div>
      </EditorialContainer>
    </section>
  );
}

function CommunityDetailSkeleton() {
  return (
    <section className="w-full">
      <EditorialContainer>
        <div className="border-editorial-line bg-editorial-2 mb-10 h-24 animate-pulse rounded-2xl border" />
        <div className="border-editorial-line bg-editorial-2 h-64 animate-pulse rounded-2xl border" />
      </EditorialContainer>
    </section>
  );
}
