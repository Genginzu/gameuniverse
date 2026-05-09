"use client";

/**
 * Layout Spotify-like : search-first
 *
 *  ┌───────────────┬──────────────────────┐
 *  │ user library  │ ┌──────────────────┐ │
 *  │   sidebar     │ │  big top search  │ │
 *  │   220px       │ ├──────────────────┤ │
 *  │               │ │     content      │ │
 *  └───────────────┴──────────────────────┘
 *
 * - La sidebar gauche contient la "vie" de l'utilisateur (library,
 *   collections, recently played) — pas la nav globale.
 * - Le top du content area contient un gros search bar central qui sert
 *   de point d'entrée principal pour explorer.
 * - La nav globale (Games, Esport, etc.) est en pills sous le search.
 *
 * Modèle issu de Spotify / YouTube.
 */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";

interface SpotifyShellProps {
  locale: string;
  children: ReactNode;
}

const QUICK_TABS = [
  { label: "All", href: "" },
  { label: "Games", href: "/games" },
  { label: "Characters", href: "/characters" },
  { label: "Esport", href: "/esport/live" },
  { label: "Players", href: "/players" },
  { label: "Discussions", href: "/discussions" },
];

const RECENTLY_PLAYED = [
  {
    title: "God of War Ragnarök",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/coba3d.jpg",
    sub: "84h played",
  },
  {
    title: "Cyberpunk 2077",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1rcz.webp",
    sub: "62h played",
  },
  {
    title: "Valorant",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5w0g.webp",
    sub: "312h played",
  },
];

const COLLECTIONS = [
  { label: "Wishlist", icon: "fa:heart" },
  { label: "Currently playing", icon: "fa:gamepad" },
  { label: "Completed 2025", icon: "fa:trophy" },
  { label: "Indie favorites", icon: "fa:star" },
];

export function SpotifyShell({ locale, children }: SpotifyShellProps) {
  const [query, setQuery] = useState("");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar utilisateur */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-white/5 bg-[#0e051c]/80 backdrop-blur-xl lg:block">
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-5">
          <Link
            href={`/${locale}/design-poc`}
            className="poc-display flex items-center gap-2 text-2xl text-white"
          >
            <span>G</span>
            <span className="text-[var(--poc-accent-400)]">·</span>
            <span>U</span>
          </Link>
          <button
            className="grid size-8 place-items-center rounded-full text-zinc-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Add"
          >
            <Icon icon="lucide:plus" className="size-4" />
          </button>
        </div>

        {/* Quick links */}
        <nav className="border-b border-white/5 px-3 py-4">
          <Link
            href={`/${locale}/library`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            <Icon icon="fa:gamepad" className="size-4" />
            Your library
            <span className="poc-mono ml-auto text-xs text-zinc-500">247</span>
          </Link>
          <Link
            href={`/${locale}/profile`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            <Icon icon="fa:user" className="size-4" />
            Profile
          </Link>
        </nav>

        {/* Recently played */}
        <div className="px-3 py-4">
          <p className="poc-kicker mb-3 px-3">Recently played</p>
          <ul className="space-y-1">
            {RECENTLY_PLAYED.map((g) => (
              <li key={g.title}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left text-zinc-300 transition hover:bg-white/5"
                >
                  <Image
                    src={g.cover}
                    alt={g.title}
                    width={40}
                    height={40}
                    className="size-10 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{g.title}</p>
                    <p className="poc-mono truncate text-[10px] text-zinc-500">{g.sub}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Collections */}
        <div className="px-3 py-4">
          <p className="poc-kicker mb-3 px-3">Collections</p>
          <ul className="space-y-0.5">
            {COLLECTIONS.map((c) => (
              <li key={c.label}>
                <Link
                  href="#"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  <Icon icon={c.icon} className="size-4 text-[var(--poc-accent-400)]" />
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1">
        {/* Sticky search header */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#120821]/80 px-6 py-4 backdrop-blur-xl lg:px-12">
          <div className="mx-auto flex max-w-[1600px] items-center gap-4">
            {/* Big search */}
            <div className="relative max-w-2xl flex-1">
              <Icon
                icon="lucide:search"
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to play today?"
                className="poc-display w-full rounded-full border border-white/10 bg-white/5 py-3 pl-12 pr-5 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-[var(--poc-accent-400)] focus:bg-white/10"
              />
            </div>

            <button
              type="button"
              className="ml-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              <Icon icon="lucide:bell" className="size-4" />
            </button>
            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/5"
              aria-label="Profile"
            >
              <Image
                src="https://i.pravatar.cc/64?img=11"
                alt=""
                width={36}
                height={36}
                className="size-full object-cover"
              />
            </button>
          </div>

          {/* Quick category tabs */}
          <div className="mx-auto mt-4 flex max-w-[1600px] items-center gap-2 overflow-x-auto">
            {QUICK_TABS.map((tab) => (
              <Link
                key={tab.label}
                href={tab.href ? `/${locale}${tab.href}` : `/${locale}/design-poc/game-detail?layout=spotify`}
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
