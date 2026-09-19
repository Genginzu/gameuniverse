"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { LazyImage } from "@/components/ui/lazy-image";
import type { CommunityMember, CommunityMemberRole } from "@/types/community";

interface CommunityMembersListProps {
  members: CommunityMember[];
  canManage: boolean;
  currentPlayerId?: string;
  onUpdateRole: (playerId: string, role: CommunityMemberRole) => Promise<void>;
  onRemoveMember: (playerId: string) => Promise<void>;
}

export function CommunityMembersList({
  members,
  canManage,
  currentPlayerId,
  onUpdateRole,
  onRemoveMember,
}: CommunityMembersListProps) {
  const t = useTranslations("communities.members");

  if (members.length === 0) {
    return <p className="text-editorial-muted text-sm">{t("empty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {members.map((member) => {
        const canModify =
          canManage && member.role !== "owner" && member.playerId !== currentPlayerId;
        return (
          <li
            key={member.id}
            className="border-editorial-line bg-editorial-2 flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative size-9 overflow-hidden rounded-full bg-white/10">
                {member.player.avatarUrl && (
                  <LazyImage src={member.player.avatarUrl} alt="" fill className="object-cover" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {member.player.username ?? t("unknownPlayer")}
                </p>
                <p className="text-editorial-muted text-xs uppercase tracking-wide">
                  {t(`roles.${member.role}`)}
                </p>
              </div>
            </div>

            {canModify && (
              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) =>
                    onUpdateRole(member.playerId, e.target.value as CommunityMemberRole)
                  }
                  aria-label={t("changeRole")}
                  className="border-editorial-line bg-editorial-3 rounded-lg border px-2 py-1 text-xs text-white"
                >
                  <option value="member">{t("roles.member")}</option>
                  <option value="moderator">{t("roles.moderator")}</option>
                </select>
                <button
                  type="button"
                  onClick={() => onRemoveMember(member.playerId)}
                  aria-label={t("removeMember")}
                  className="text-editorial-muted hover:text-red-400"
                >
                  <Icon icon="lucide:user-x" className="h-4 w-4" />
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
