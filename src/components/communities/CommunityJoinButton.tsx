"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import type { CommunityMemberRole } from "@/types/community";

const EDITORIAL_OUTLINE =
  "border-editorial-line bg-editorial-3 text-white hover:bg-editorial-3 hover:border-[rgba(var(--accent-rgb,var(--neon-primary)),0.4)] hover:text-[rgb(var(--accent-rgb,var(--neon-primary)))]";

interface CommunityJoinButtonProps {
  isAuthenticated: boolean;
  viewerRole: CommunityMemberRole | null;
  isJoining: boolean;
  isLeaving: boolean;
  onJoin: () => Promise<void>;
  onLeave: () => Promise<void>;
}

export function CommunityJoinButton({
  isAuthenticated,
  viewerRole,
  isJoining,
  isLeaving,
  onJoin,
  onLeave,
}: CommunityJoinButtonProps) {
  const t = useTranslations("communities.detail");

  if (!isAuthenticated) return null;
  if (viewerRole === "owner") return null;

  if (viewerRole === null) {
    return (
      <Button onClick={onJoin} disabled={isJoining}>
        {isJoining ? (
          <Icon icon="lucide:loader-2" className="animate-spin" />
        ) : (
          <Icon icon="lucide:user-plus" />
        )}
        {t("join")}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className={EDITORIAL_OUTLINE}
      onClick={onLeave}
      disabled={isLeaving}
    >
      {isLeaving ? (
        <Icon icon="lucide:loader-2" className="animate-spin" />
      ) : (
        <Icon icon="lucide:user-minus" />
      )}
      {t("leave")}
    </Button>
  );
}
