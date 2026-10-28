"use client";

import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

interface BentoPillLinkProps {
  href: ComponentProps<typeof Link>["href"];
  children: ReactNode;
}

/** "At a glance" pill linking to the games listing filtered on its value. */
export function BentoPillLink({ href, children }: BentoPillLinkProps) {
  return (
    <Link href={href} className="editorial-game-detail-pill is-link">
      {children}
    </Link>
  );
}
