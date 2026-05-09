"use client";

/**
 * Sidebar du POC — reprend les liens de navigation du site existant en
 * version « éditoriale dark + accent dynamique ».
 *
 * Modes :
 * - "expanded"   : largeur 240px, icône + label visible
 * - "collapsed"  : largeur 64px, icônes seules (s'étend au hover)
 *
 * Tous les liens pointent en dehors du POC (ils sortent vers le vrai site)
 * SAUF "Demo home" qui ramène à la racine du POC. C'est volontaire : on veut
 * pouvoir tester la nav sans casser la démo.
 */

import Link from "next/link";
import { Icon } from "@iconify/react";

interface PocSidebarProps {
  locale: string;
  collapsed?: boolean;
  /** Au survol, on étend la sidebar collapsée. Côté CSS via group-hover. */
  expandOnHover?: boolean;
}

const SECTIONS: { kicker: string; links: { href: string; icon: string; label: string }[] }[] = [
  {
    kicker: "Explore",
    links: [
      { href: "/games", icon: "fa:dice", label: "Games" },
      { href: "/characters", icon: "fa:mask", label: "Characters" },
      { href: "/players", icon: "fa:user-friends", label: "Players" },
    ],
  },
  {
    kicker: "My space",
    links: [
      { href: "/profile", icon: "fa:user", label: "Profile" },
      { href: "/library", icon: "fa:gamepad", label: "Library" },
      { href: "/favorites/characters", icon: "fa:heart", label: "Favorites" },
      { href: "/discussions", icon: "fa:comments", label: "Discussions" },
    ],
  },
  {
    kicker: "Esport",
    links: [
      { href: "/esport/calendar", icon: "fa:calendar", label: "Calendar" },
      { href: "/esport/tournaments", icon: "mdi:trophy-outline", label: "Tournaments" },
      { href: "/esport/live", icon: "fa:bolt", label: "Live" },
      { href: "/esport/results", icon: "fa:trophy", label: "Results" },
      { href: "/esport/teams", icon: "fa:users", label: "Teams" },
      { href: "/esport/players", icon: "fa:user", label: "Players" },
    ],
  },
  {
    kicker: "Coaching",
    links: [
      { href: "/coaching", icon: "fa:users", label: "Coaching hub" },
      { href: "/coaching/sessions", icon: "fa:calendar", label: "Sessions" },
    ],
  },
];

export function PocSidebar({ locale, collapsed = false, expandOnHover = false }: PocSidebarProps) {
  const baseWidth = collapsed ? "w-16" : "w-60";
  const expanded = expandOnHover ? "group-hover/sidebar:w-60 hover:w-60" : "";

  return (
    <aside
      className={`group/sidebar sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r border-white/5 bg-[#0e051c]/80 backdrop-blur-xl transition-[width] duration-300 lg:block ${baseWidth} ${expanded}`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-white/5 px-5">
        <Link
          href={`/${locale}/design-poc`}
          className="poc-display flex items-center gap-2 text-2xl tracking-tight text-white"
        >
          <span>G</span>
          <span className="text-[var(--poc-accent-400)]">·</span>
          <span
            className={`whitespace-nowrap transition-opacity duration-200 ${
              collapsed && !expandOnHover
                ? "opacity-0"
                : collapsed
                  ? "opacity-0 group-hover/sidebar:opacity-100"
                  : "opacity-100"
            }`}
          >
            U
          </span>
        </Link>
      </div>

      <nav className="space-y-7 overflow-y-auto px-3 py-6">
        {SECTIONS.map((section) => (
          <div key={section.kicker}>
            <p
              className={`poc-kicker mb-2 px-3 transition-opacity ${
                collapsed && !expandOnHover
                  ? "opacity-0"
                  : collapsed
                    ? "opacity-0 group-hover/sidebar:opacity-100"
                    : "opacity-100"
              }`}
            >
              {section.kicker}
            </p>
            <ul className="space-y-0.5">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={`/${locale}${link.href}`}
                    className="group/link flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
                  >
                    <Icon
                      icon={link.icon}
                      className="size-4 shrink-0 transition group-hover/link:text-[var(--poc-accent-400)]"
                    />
                    <span
                      className={`whitespace-nowrap transition-opacity duration-200 ${
                        collapsed && !expandOnHover
                          ? "opacity-0"
                          : collapsed
                            ? "opacity-0 group-hover/sidebar:opacity-100"
                            : "opacity-100"
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
