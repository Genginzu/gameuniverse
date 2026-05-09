"use client";

/**
 * Top mega-menu pour la variante "Hybrid".
 *
 * 5 catégories au hover ouvrent chacune un panneau riche : sous-liens
 * + contenu featured (mini cards). Inclut un search bar central proéminent
 * et un avatar/dropdown utilisateur.
 *
 * Tout est mocké — c'est une démo de structure, pas une nav fonctionnelle.
 */

import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useState } from "react";

type CategoryKey = "games" | "characters" | "esport" | "players" | "library" | null;

interface MegaCategory {
  key: Exclude<CategoryKey, null>;
  label: string;
  links: { href: string; icon: string; label: string; sub?: string }[];
  featured: {
    title: string;
    image: string;
    label: string;
    href: string;
  }[];
}

const CATEGORIES: MegaCategory[] = [
  {
    key: "games",
    label: "Games",
    links: [
      { href: "/games", icon: "fa:dice", label: "All games", sub: "3,200+ titles" },
      { href: "/trending", icon: "fa:fire", label: "Trending now" },
      { href: "/upcoming", icon: "fa:calendar", label: "Upcoming releases" },
      { href: "/games?sort=rating", icon: "fa:star", label: "Top rated" },
    ],
    featured: [
      {
        title: "God of War Ragnarök",
        image: "https://images.igdb.com/igdb/image/upload/t_cover_big/coba3d.jpg",
        label: "Featured",
        href: "/games/god-of-war-ragnarok",
      },
      {
        title: "Cyberpunk 2077",
        image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1rcz.webp",
        label: "Trending",
        href: "/games/cyberpunk-2077",
      },
    ],
  },
  {
    key: "characters",
    label: "Characters",
    links: [
      { href: "/characters", icon: "fa:mask", label: "All characters" },
      { href: "/favorites/characters", icon: "fa:heart", label: "My favorites" },
    ],
    featured: [
      {
        title: "Kratos",
        image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80",
        label: "Iconic",
        href: "/characters/kratos",
      },
      {
        title: "V (Cyberpunk)",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80",
        label: "Popular",
        href: "/characters/v-cyberpunk",
      },
    ],
  },
  {
    key: "esport",
    label: "Esport",
    links: [
      { href: "/esport/live", icon: "fa:bolt", label: "Live", sub: "14 matches" },
      { href: "/esport/calendar", icon: "fa:calendar", label: "Calendar" },
      { href: "/esport/tournaments", icon: "mdi:trophy-outline", label: "Tournaments" },
      { href: "/esport/results", icon: "fa:trophy", label: "Results" },
      { href: "/esport/teams", icon: "fa:users", label: "Teams" },
      { href: "/esport/players", icon: "fa:user", label: "Pro players" },
      { href: "/esport/predictions", icon: "fa:bar-chart", label: "Predictions" },
    ],
    featured: [
      {
        title: "VCT Champions",
        image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&q=80",
        label: "Live now",
        href: "/esport/live",
      },
      {
        title: "Worlds 2026",
        image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&q=80",
        label: "Coming soon",
        href: "/esport/tournaments",
      },
    ],
  },
  {
    key: "players",
    label: "Community",
    links: [
      { href: "/players", icon: "fa:user-friends", label: "All players" },
      { href: "/discussions", icon: "fa:comments", label: "Discussions" },
      { href: "/coaching", icon: "fa:graduation-cap", label: "Coaching hub" },
    ],
    featured: [
      {
        title: "Top reviewers",
        image: "https://i.pravatar.cc/200?img=12",
        label: "Featured",
        href: "/players?sort=top",
      },
    ],
  },
  {
    key: "library",
    label: "Library",
    links: [
      { href: "/library", icon: "fa:gamepad", label: "My library", sub: "247 games" },
      { href: "/collections", icon: "fa:layer-group", label: "Collections" },
      { href: "/profile", icon: "fa:user", label: "Profile" },
    ],
    featured: [],
  },
];

interface PocMegaMenuProps {
  locale: string;
  /** Callback pour ouvrir la command palette */
  onOpenPalette?: () => void;
}

export function PocMegaMenu({ locale, onOpenPalette }: PocMegaMenuProps) {
  const [active, setActive] = useState<CategoryKey>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#120821]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-6 px-6 lg:px-12">
        {/* Logo */}
        <Link
          href={`/${locale}/design-poc`}
          className="poc-display flex shrink-0 items-center gap-2 text-2xl text-white"
        >
          <span>G</span>
          <span className="text-[var(--poc-accent-400)]">·</span>
          <span>U</span>
        </Link>

        {/* Categories nav */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          onMouseLeave={() => setActive(null)}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onMouseEnter={() => setActive(cat.key)}
              onFocus={() => setActive(cat.key)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                active === cat.key
                  ? "bg-white/10 text-white"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        {/* Search button (proéminent) */}
        <button
          type="button"
          onClick={onOpenPalette}
          className="ml-auto flex h-10 w-72 items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-zinc-400 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <Icon icon="lucide:search" className="size-4" />
          <span className="flex-1 text-left">Search anything…</span>
          <span className="poc-mono rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-400">
            ⌘K
          </span>
        </button>

        {/* Avatar */}
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/5"
          aria-label="Profile"
        >
          <Image
            src="https://i.pravatar.cc/64?img=11"
            alt=""
            width={40}
            height={40}
            className="size-full object-cover"
          />
        </button>
      </div>

      {/* Mega panel */}
      <MegaPanel
        category={CATEGORIES.find((c) => c.key === active) ?? null}
        locale={locale}
        onClose={() => setActive(null)}
      />
    </header>
  );
}

function MegaPanel({
  category,
  locale,
  onClose,
}: {
  category: MegaCategory | null;
  locale: string;
  onClose: () => void;
}) {
  if (!category) return null;
  return (
    <div
      className="absolute inset-x-0 top-full border-t border-white/5 bg-[#0e051c]/95 backdrop-blur-2xl"
      onMouseLeave={onClose}
    >
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-12 lg:px-12">
        <div className="lg:col-span-4">
          <p className="poc-kicker mb-4">{category.label}</p>
          <ul className="space-y-1">
            {category.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={`/${locale}${link.href}`}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  <Icon icon={link.icon} className="size-5 text-[var(--poc-accent-400)]" />
                  <div className="flex-1 min-w-0">
                    <p className="poc-display text-base">{link.label}</p>
                    {link.sub && (
                      <p className="poc-mono text-xs text-zinc-500 group-hover:text-zinc-400">
                        {link.sub}
                      </p>
                    )}
                  </div>
                  <Icon
                    icon="lucide:arrow-up-right"
                    className="size-4 text-zinc-600 group-hover:text-zinc-300"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {category.featured.length > 0 && (
          <div className="lg:col-span-8">
            <p className="poc-kicker mb-4">Featured</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {category.featured.map((item) => (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  className="group relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/5"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 33vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p
                      className="poc-mono text-[10px] uppercase tracking-widest"
                      style={{ color: "var(--poc-accent-300)" }}
                    >
                      {item.label}
                    </p>
                    <p className="poc-display mt-1 text-2xl text-white">{item.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
