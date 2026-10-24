/**
 * HomeSection : shared shell of every logged-in home section
 * (kicker + display title + optional "see all" link + content).
 */

import type { ReactNode } from "react";
import { Icon } from "@iconify/react";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { Link } from "@/i18n/navigation";

interface HomeSectionProps {
  id: string;
  kicker: string;
  title: string;
  seeAll?: { href: string; label: string };
  /** Extra header control (e.g. a refresh button), rendered before `seeAll`. */
  action?: ReactNode;
  children: ReactNode;
}

export function HomeSection({ id, kicker, title, seeAll, action, children }: HomeSectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <KickerLabel>{kicker}</KickerLabel>
          <h2
            id={headingId}
            className="font-display text-[clamp(1.375rem,3vw,2rem)] leading-tight font-semibold text-white"
          >
            {title}
          </h2>
        </div>
        {(action || seeAll) && (
          <div className="flex flex-wrap items-center gap-3">
            {action}
            {seeAll && (
              <Link
                href={seeAll.href}
                className="text-editorial-accent border-editorial-accent/50 inline-flex min-h-11 items-center gap-2 border-b pb-1 font-mono text-xs tracking-[0.16em] uppercase transition-colors hover:border-white hover:text-white"
              >
                {seeAll.label}
                <Icon icon="mdi:arrow-top-right" className="size-4" aria-hidden />
              </Link>
            )}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
