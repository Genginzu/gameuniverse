"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { GameUniverseLogo } from "@/components/ui/game-universe-logo";

const EXPLORE_LINKS = [
  { href: "/games", icon: "fa:dice", labelKey: "games" },
  { href: "/characters", icon: "fa:mask", labelKey: "characters" },
  { href: "/players", icon: "fa:user-friends", labelKey: "players" },
] as const;

const COMMUNITY_LINKS = [
  { href: "/discussions", icon: "fa:comments", labelKey: "discussions" },
  { href: "/auth?mode=signin", icon: "fa:sign-in", labelKey: "login" },
  { href: "/auth?mode=signup", icon: "fa:user-plus", labelKey: "signup" },
] as const;

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("navigation");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 bg-white/5 backdrop-blur-xl dark:bg-slate-900/60">
      {/* Gradient accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-500/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <GameUniverseLogo size="sm" className="shadow-lg shadow-black/20" />
              <span className="text-lg font-bold tracking-widest text-gray-900 uppercase dark:text-white">
                Game Universe
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {t("tagline")}
            </p>
          </div>

          {/* Explore links */}
          <FooterLinkGroup title={t("explore")} links={EXPLORE_LINKS} tNav={tNav} />

          {/* Community links */}
          <FooterLinkGroup title={t("community")} links={COMMUNITY_LINKS} tNav={tNav} />
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {t("copyright", { year: currentYear })}
          </p>
          <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
            {t("madeWith")}
            <Icon icon="fa:heart" className="text-neon-violet h-3 w-3" />
            {t("forGamers")}
          </p>
        </div>
      </div>
    </footer>
  );
}

type FooterLink = { href: string; icon: string; labelKey: string };

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
      <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-500">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {links.map(({ href, icon, labelKey }) => (
          <li key={href}>
            <Link
              href={href}
              className="group hover:text-neon-violet dark:hover:text-neon-violet inline-flex items-center gap-2 text-sm text-gray-600 transition-colors dark:text-gray-400"
            >
              <Icon
                icon={icon}
                className="h-3.5 w-3.5 transition-all group-hover:drop-shadow-[0_0_4px_rgb(var(--neon-violet)/0.5)]"
              />
              {tNav(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
