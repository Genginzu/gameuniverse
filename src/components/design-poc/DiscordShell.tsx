"use client";

/**
 * Layout Discord-like : 2 sidebars empilées
 *
 *  ┌──────┬──────────┬──────────────────────┐
 *  │ rail │ sub-side │      content         │
 *  │ 56px │  220px   │                      │
 *  └──────┴──────────┴──────────────────────┘
 *
 * - Le rail (très étroit) liste les "espaces" majeurs avec des icônes
 *   colorées. Cliquer/hover change la sidebar secondaire.
 * - La sub-sidebar liste les sous-pages du space sélectionné.
 *
 * Pour la démo on initialise sur l'espace "Games" qui correspond à la
 * page detail courante.
 */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

type SpaceKey = "games" | "esport" | "library" | "community" | "coaching";

interface Space {
  key: SpaceKey;
  label: string;
  icon: string;
  links: { href: string; label: string }[];
}

const SPACES: Space[] = [
  {
    key: "games",
    label: "Games",
    icon: "fa:dice",
    links: [
      { href: "/games", label: "All games" },
      { href: "/trending", label: "Trending" },
      { href: "/upcoming", label: "Upcoming" },
      { href: "/characters", label: "Characters" },
      { href: "/favorites/characters", label: "My favorites" },
    ],
  },
  {
    key: "esport",
    label: "Esport",
    icon: "fa:bolt",
    links: [
      { href: "/esport/live", label: "Live now" },
      { href: "/esport/calendar", label: "Calendar" },
      { href: "/esport/tournaments", label: "Tournaments" },
      { href: "/esport/results", label: "Results" },
      { href: "/esport/teams", label: "Teams" },
      { href: "/esport/players", label: "Pro players" },
      { href: "/esport/predictions", label: "Predictions" },
      { href: "/esport/fantasy", label: "Fantasy" },
    ],
  },
  {
    key: "library",
    label: "Library",
    icon: "fa:gamepad",
    links: [
      { href: "/library", label: "All games" },
      { href: "/collections", label: "Collections" },
      { href: "/profile", label: "My profile" },
    ],
  },
  {
    key: "community",
    label: "Community",
    icon: "fa:user-friends",
    links: [
      { href: "/players", label: "Players" },
      { href: "/discussions", label: "Discussions" },
      { href: "/friends", label: "My friends" },
    ],
  },
  {
    key: "coaching",
    label: "Coaching",
    icon: "fa:graduation-cap",
    links: [
      { href: "/coaching", label: "Coaching hub" },
      { href: "/coaching/sessions", label: "My sessions" },
      { href: "/coaching/settings", label: "Coach settings" },
    ],
  },
];

interface DiscordShellProps {
  locale: string;
  children: ReactNode;
  defaultSpace?: SpaceKey;
}

export function DiscordShell({ locale, children, defaultSpace = "games" }: DiscordShellProps) {
  const [activeSpace, setActiveSpace] = useState<SpaceKey>(defaultSpace);
  const space = SPACES.find((s) => s.key === activeSpace) ?? SPACES[0];

  return (
    <div className="flex min-h-screen">
      {/* Rail principal */}
      <aside className="sticky top-0 z-20 hidden h-screen w-14 shrink-0 border-r border-white/5 bg-[#08020f]/90 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col items-center gap-2 py-4">
          <Link
            href={`/${locale}/design-poc`}
            className="poc-display mb-2 grid size-10 place-items-center rounded-xl bg-[var(--poc-accent-500)] text-white"
            title="POC index"
          >
            G
          </Link>
          <div className="my-2 h-px w-6 bg-white/10" />
          {SPACES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveSpace(s.key)}
              className={`group relative grid size-10 place-items-center rounded-xl transition ${
                activeSpace === s.key
                  ? "bg-[var(--poc-accent-500)]/20 text-[var(--poc-accent-300)]"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
              aria-label={s.label}
              title={s.label}
            >
              <Icon icon={s.icon} className="size-4" />
              {/* Indicateur actif (style Discord) */}
              {activeSpace === s.key && (
                <span className="absolute -left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[var(--poc-accent-400)]" />
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Sidebar secondaire */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 overflow-y-auto border-r border-white/5 bg-[#0e051c]/80 backdrop-blur-xl lg:block">
        <div className="flex h-16 items-center border-b border-white/5 px-5">
          <h2 className="poc-display text-xl text-white">{space.label}</h2>
        </div>
        <nav className="space-y-0.5 px-3 py-4">
          {space.links.map((link) => (
            <Link
              key={link.href}
              href={`/${locale}${link.href}`}
              className="block rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Contenu */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
