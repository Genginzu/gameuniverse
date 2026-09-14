"use client";

/**
 * EditorialFooter : footer éditorial des pages publiques refondues.
 *
 * Conforme à la DA sombre (tokens `bg-editorial-*`, `border-editorial-line`,
 * `text-editorial-muted`, `text-editorial-accent`, `font-display`). Aucun
 * `.glass-*`, `backdrop-blur`, `bg-white` opaque ni gradient clair.
 *
 * Rendu par défaut par `EditorialLayout` (donc `EditorialShell`) après le
 * `<main>`, sur toutes les pages publiques. Full-width, sémantique `<footer>`.
 *
 * Voir docs/design/editorial-components.md et issue #270.
 */

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

interface FooterLink {
  href: string;
  icon: string;
  /** Sous-clé i18n dans le namespace `navigation`. */
  labelKey: string;
}

const EXPLORE_LINKS: readonly FooterLink[] = [
  { href: "/games", icon: "fa:dice", labelKey: "games" },
  { href: "/characters", icon: "fa:user-ninja", labelKey: "characters" },
  { href: "/players", icon: "fa:user-friends", labelKey: "players" },
];

const COMMUNITY_LINKS: readonly FooterLink[] = [
  { href: "/discussions", icon: "fa:comments", labelKey: "discussions" },
  { href: "/esport/live", icon: "fa:bolt", labelKey: "esport" },
  { href: "/coaching", icon: "fa:graduation-cap", labelKey: "coaching" },
];

export function EditorialFooter() {
  const t = useTranslations("footer");
  const tNav = useTranslations("navigation");
  const currentYear = new Date().getFullYear();

  return (
    <footer
      data-testid="editorial-footer"
      className="border-t border-editorial-line bg-editorial-2 text-editorial-muted"
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2.5 text-white transition-colors hover:text-editorial-accent"
            >
              <Icon icon="fa:gamepad" className="size-5" aria-hidden />
              <span className="font-display text-lg font-semibold tracking-widest uppercase">
                Gamers Universe
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-editorial-muted">
              {t("tagline")}
            </p>
          </div>

          <FooterLinkGroup title={t("explore")} links={EXPLORE_LINKS} tNav={tNav} />
          <FooterLinkGroup title={t("community")} links={COMMUNITY_LINKS} tNav={tNav} />
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-editorial-line pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-editorial-muted">
            {t("copyright", { year: currentYear })}
          </p>
          <p className="flex items-center gap-1 text-xs text-editorial-muted">
            {t("madeWith")}
            <Icon icon="fa:heart" className="size-3 text-editorial-accent" aria-hidden />
            {t("forGamers")}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkGroup({
  title,
  links,
  tNav,
}: {
  title: string;
  links: readonly FooterLink[];
  tNav: (key: string) => string;
}) {
  return (
    <div>
      <h3 className="font-display text-xs font-semibold tracking-wider text-white/80 uppercase">
        {title}
      </h3>
      <ul className="mt-3 space-y-1">
        {links.map(({ href, icon, labelKey }) => (
          <li key={href}>
            <Link
              href={href}
              className="group inline-flex min-h-[44px] items-center gap-2 text-sm text-editorial-muted transition-colors hover:text-editorial-accent"
            >
              <Icon icon={icon} className="size-3.5" aria-hidden />
              {tNav(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
