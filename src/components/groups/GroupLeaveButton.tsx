"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import type { GroupMemberRole } from "@/types/group";

const EDITORIAL_OUTLINE =
  "border-editorial-line bg-editorial-3 text-white hover:bg-editorial-3 hover:border-[rgba(var(--accent-rgb,var(--neon-primary)),0.4)] hover:text-[rgb(var(--accent-rgb,var(--neon-primary)))]";

interface GroupLeaveButtonProps {
  viewerRole: GroupMemberRole | null;
  isLeaving: boolean;
  onLeave: () => Promise<void>;
}

/**
 * Bouton "Quitter le groupe". Les groupes sont invite-only : il n'y a pas de
 * bouton "rejoindre" public, seule l'acceptation d'une invitation ajoute un
 * membre. L'owner ne peut pas quitter (doit supprimer le groupe).
 */
export function GroupLeaveButton({ viewerRole, isLeaving, onLeave }: GroupLeaveButtonProps) {
  const t = useTranslations("groups.detail");

  if (viewerRole === null || viewerRole === "owner") return null;

  return (
    <Button variant="outline" className={EDITORIAL_OUTLINE} onClick={onLeave} disabled={isLeaving}>
      {isLeaving ? (
        <Icon icon="lucide:loader-2" className="animate-spin" />
      ) : (
        <Icon icon="lucide:user-minus" />
      )}
      {t("leave")}
    </Button>
  );
}
