"use client";

import { Icon } from "@iconify/react";

import { LazyImage } from "@/components/ui/lazy-image";
import type { NavLink } from "@/types/navigation";

/** 20px avatar of a Membership Link: its image, or the space fallback icon. */
export function MembershipAvatar({ link }: { link: NavLink }) {
  return (
    <span className="editorial-sub-sidebar-avatar" aria-hidden>
      {link.imageUrl ? (
        <LazyImage src={link.imageUrl} alt="" fill sizes="20px" className="object-cover" />
      ) : (
        <Icon icon={link.icon} className="size-4" />
      )}
    </span>
  );
}
