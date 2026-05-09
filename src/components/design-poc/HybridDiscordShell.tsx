"use client";

/**
 * Variante G : Mega-menu + Discord-rail
 *
 *  ┌─────────────────────────────────────────────────┐
 *  │  MEGA-MENU TOP HEADER (full width, sticky)      │
 *  ├──────┬───────────┬──────────────────────────────┤
 *  │ rail │ sub-side  │                              │
 *  │ 56px │ 220px     │       CONTENT                │
 *  │      │ (toggle)  │                              │
 *  └──────┴───────────┴──────────────────────────────┘
 *
 * - Mega-menu top : full width, hover catégories ouvre les panels.
 *   Mode search = input visible (pas de Cmd+K).
 * - Rail gauche 56px : toujours visible. Cliquer sur une icône toggle
 *   la sub-sidebar pour cet espace.
 * - Sub-sidebar 220px : fermée par défaut, slide-in au clic. Re-clic
 *   sur le même icône = ferme. Clic sur un autre icône = change l'espace
 *   et reste ouverte. État persistant via localStorage.
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { PocMegaMenu } from "./PocMegaMenu";

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

const STORAGE_KEY = "poc-hybrid-discord-state-v1";

interface PersistedState {
  /** Espace dont la sub-sidebar est ouverte. null = fermée. */
  openSpace: SpaceKey | null;
}

interface HybridDiscordShellProps {
  locale: string;
  children: ReactNode;
}

export function HybridDiscordShell({ locale, children }: HybridDiscordShellProps) {
  const [openSpace, setOpenSpace] = useState<SpaceKey | null>(null);

  // Hydrate depuis localStorage au mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed.openSpace === null || isSpaceKey(parsed.openSpace)) {
        setOpenSpace(parsed.openSpace);
      }
    } catch {
      // ignore — état par défaut
    }
  }, []);

  // Persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ openSpace }));
    } catch {
      // ignore — quota / private mode
    }
  }, [openSpace]);

  const toggleSpace = (key: SpaceKey) => {
    setOpenSpace((current) => (current === key ? null : key));
  };

  const activeSpace = openSpace ? SPACES.find((s) => s.key === openSpace) : null;

  return (
    <>
      {/* Mega-menu top, full width */}
      <PocMegaMenu locale={locale} searchMode="input" />

      <div className="flex">
        {/* Rail gauche */}
        <aside className="sticky top-16 z-20 hidden h-[calc(100vh-4rem)] w-14 shrink-0 border-r border-white/5 bg-[#08020f]/90 backdrop-blur-xl lg:block">
          <div className="flex h-full flex-col items-center gap-1 py-4">
            {SPACES.map((s) => {
              const isOpen = openSpace === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleSpace(s.key)}
                  className={`group relative grid size-10 place-items-center rounded-xl transition ${
                    isOpen
                      ? "bg-[var(--poc-accent-500)]/20 text-[var(--poc-accent-300)]"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                  aria-label={s.label}
                  aria-pressed={isOpen}
                  title={s.label}
                >
                  <Icon icon={s.icon} className="size-4" />
                  {isOpen && (
                    <span className="absolute -left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[var(--poc-accent-400)]" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Sub-sidebar — slide-in/out */}
        <aside
          className={`sticky top-16 z-10 hidden h-[calc(100vh-4rem)] shrink-0 overflow-y-auto border-r border-white/5 bg-[#0e051c]/80 backdrop-blur-xl transition-[width] duration-300 lg:block ${
            activeSpace ? "w-56" : "w-0 border-r-0"
          }`}
        >
          {activeSpace && (
            <div className="w-56">
              <div className="flex h-12 items-center justify-between border-b border-white/5 px-5">
                <h2 className="poc-display text-lg text-white">{activeSpace.label}</h2>
                <button
                  type="button"
                  onClick={() => setOpenSpace(null)}
                  className="grid size-7 place-items-center rounded-md text-zinc-500 transition hover:bg-white/5 hover:text-white"
                  aria-label="Close sub-sidebar"
                >
                  <Icon icon="lucide:x" className="size-3.5" />
                </button>
              </div>
              <nav className="space-y-0.5 px-3 py-4">
                {activeSpace.links.map((link) => (
                  <Link
                    key={link.href}
                    href={`/${locale}${link.href}`}
                    className="block rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </aside>

        {/* Contenu */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}

function isSpaceKey(value: unknown): value is SpaceKey {
  return (
    typeof value === "string" &&
    ["games", "esport", "library", "community", "coaching"].includes(value)
  );
}
